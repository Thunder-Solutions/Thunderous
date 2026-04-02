import { accessSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path, { dirname, relative, join } from 'node:path';
import resolve from 'resolve';
import { resolve as resolveExports } from 'resolve.exports';
import { parse, initSync } from 'es-module-lexer';
import { ImportsNotUsedAsValues, JsxEmit, ModuleKind, ScriptTarget, transpileModule } from 'typescript';
import { config } from './config';
initSync();

const CONDITIONS = ['browser', 'import', 'default'];

type Graph = Set<string>;
const isBare = (s: string) => !s.startsWith('.') && !s.startsWith('/') && !s.startsWith('http');
const isUrl = (s: string) => s.startsWith('http:') || s.startsWith('https:') || s.startsWith('data:');
const isNodeBuiltin = (s: string) => s.startsWith('node:');

export function processNodeModules(entryFiles: string[], outputDir?: string) {
	const _outputDir = outputDir ?? config.outDir;
	const vendorRoot = join(_outputDir, 'vendor');
	const seen: Graph = new Set();
	const q = [...entryFiles];
	const importMap: Record<string, string> = {};

	while (q.length) {
		let file = q.pop()!;
		// Ensure .js extension: replace .ts/.tsx with .js, or add .js if no extension
		file = file.replace(/\.tsx?$/, '.js');
		if (!file.endsWith('.js') && !file.endsWith('.mjs')) {
			file = file + '.js';
		}
		if (seen.has(file)) continue;
		seen.add(file);

		const code = readFileSync(file, 'utf8');
		const [imports] = parse(code);

		for (const im of imports) {
			const spec = code
				.slice(im.s, im.e)
				.trim()
				.replace(/^['"]|['"]$/g, '');
			if (spec === '' || isUrl(spec) || isNodeBuiltin(spec) || spec === 'import.meta') continue;

			if (isBare(spec)) {
				// 1) Resolve package entry honoring "exports" + conditions
				const pkgEntry = resolve.sync(spec, {
					basedir: dirname(file),
					packageFilter(pkg) {
						// Prefer declared export for browser/import
						const sub = resolveExports(pkg, '.', { conditions: CONDITIONS });
						if (sub) {
							pkg['main'] = sub;
							return pkg;
						}
						// If no exports field, prefer "module" over "main" for ESM
						if (pkg['module']) {
							pkg['main'] = pkg['module'];
						}
						// Otherwise fall back to pkg.main (default behavior)
						return pkg;
					},
					extensions: ['.mjs', '.js', '.ts', '.tsx'], // allow TS in published packages
				});

				// 2) Copy/transform this package file into /dist/vendor/<name>@<version>/...
				const mapped = vendorizeFile(pkgEntry, vendorRoot);
				importMap[spec] = mapped.mappedUrl;

				// 3) Enqueue its internal deps (we rewrite imports in vendor files to relative URLs)
				q.push(...mapped.discoveredDeps.filter((f) => !seen.has(f)));
			} else if (spec.startsWith('.') || spec.startsWith('/')) {
				// local project module; include so we can walk transitive deps
				const resolved = path.resolve(dirname(file), spec);
				q.push(withJsOrTs(resolved));
			}
		}
	}

	writeFileSync(join(_outputDir, 'importmap.json'), JSON.stringify({ imports: importMap }, null, 2));
	// include es-module-shims in your HTML for Safari
}

// --- helpers ---

function withJsOrTs(p: string) {
	const cand = [p, p + '.mjs', p + '.js', p + '.ts', p + '.tsx'];
	for (const c of cand) return c; // optimistic; upstream readFile will fail fast if wrong
	return p;
}

function vendorizeFile(absPath: string, vendorRoot: string) {
	// Find package root & metadata
	const pkgRoot = findPkgRoot(absPath);
	const pkg = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8'));
	const versionTag = `${pkg.name.replace('/', '__')}@${pkg.version}`;
	const relFromPkg = relative(pkgRoot, absPath);
	const outDir = join(vendorRoot, versionTag);
	const outPath = join(outDir, relFromPkg.replace(/\.(ts|tsx)$/, '.js'));

	mkdirSync(dirname(outPath), { recursive: true });

	// Read & (if needed) transpile TS → JS (no typecheck, just emit)
	const src = readFileSync(absPath, 'utf8');
	const isTs = /\.(ts|tsx)$/.test(absPath);
	const code = isTs ? transpileTsFast(src, absPath) : src;

	// Rewrite its *internal* bare imports later; for package files we'll keep bare,
	// because the import map will point top-level specifiers at the package entry.
	const { rewritten, discoveredDeps } = rewriteAndDiscover(code, dirname(absPath), pkgRoot, outDir);

	writeFileSync(outPath, rewritten, 'utf8');

	// Get the vendorRoot's parent directory to make path relative from output directory
	const outputDir = dirname(vendorRoot);
	return {
		mappedUrl: `/${relative(outputDir, outPath).replace(/\\/g, '/')}`,
		discoveredDeps,
	};
}

function findPkgRoot(start: string) {
	let cur = start;
	while (true) {
		const candidate = join(cur, 'package.json');
		try {
			accessSync(candidate);
			return cur;
		} catch {
			// No package.json found in this directory
		}
		const up = dirname(cur);
		if (up === cur) throw new Error(`No package.json found for ${start}`);
		cur = up;
	}
}

function rewriteAndDiscover(code: string, basedir: string, pkgRoot: string, outDir: string) {
	const [imports] = parse(code);
	let offset = 0;
	let rewritten = code;
	const deps: string[] = [];

	for (const im of imports) {
		const s = im.s + offset,
			e = im.e + offset;
		const spec = rewritten
			.slice(s, e)
			.replace(/^['"]|['"]$/g, '')
			.trim();

		if (spec === '' || isUrl(spec) || isNodeBuiltin(spec)) continue;

		if (isBare(spec)) {
			// leave bare; import map will handle it
			continue;
		}
		if (spec.startsWith('.') || spec.startsWith('/')) {
			const abs = path.resolve(basedir, spec);
			const targetRel = relative(pkgRoot, abs).replace(/\.(ts|tsx)$/, '.js');
			const newSpec = path
				.relative(join(outDir, relative(pkgRoot, basedir)), join(outDir, targetRel))
				.replace(/\\/g, '/');
			// patch string literal
			const quoted = JSON.stringify(newSpec.startsWith('.') ? newSpec : './' + newSpec);
			rewritten = rewritten.slice(0, s) + quoted + rewritten.slice(e);
			offset += quoted.length - (e - s);
			deps.push(withJsOrTs(abs));
		}
	}

	return { rewritten, discoveredDeps: deps };
}

// minimal TS transpile (no type-check), stays "buildless"
function transpileTsFast(source: string, fileName: string) {
	const out = transpileModule(source, {
		compilerOptions: {
			module: ModuleKind.ESNext,
			target: ScriptTarget.ES2020,
			jsx: JsxEmit.ReactJSX,
			sourceMap: false,
			importsNotUsedAsValues: ImportsNotUsedAsValues.Remove,
			verbatimModuleSyntax: true,
			isolatedModules: true,
		},
		fileName,
		reportDiagnostics: false,
	});
	return out.outputText;
}
