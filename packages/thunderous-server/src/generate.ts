import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs';
import { join, relative, resolve } from 'path';
import { createRequire } from 'node:module';
import { html } from 'thunderous';
import { setMeta as setMeta, type Breadcrumb } from './meta';
import { basename, dirname, extname } from 'node:path';
import { config } from './config';
import { ModuleKind, ScriptTarget, transpileModule, ImportsNotUsedAsValues } from 'typescript';
import { processNodeModules } from './vendorize';
import { escapeHtml, raw } from './utilities';

// resolves imports relative to the output directory - this is important for persisting
// the correct references to avoid problems with unique values (like symbols) or other
// shared state within a given library.
const outRequire = createRequire(resolve(config.baseDir));

// track state outside the function so that we only have to set one `onServerDefine` handler
const renderState = {
	markup: '',
};

// ── Shared TypeScript compiler options (created once, reused everywhere) ──
const tsCompilerOptions = {
	module: ModuleKind.ESNext,
	target: ScriptTarget.ES2020,
	sourceMap: false,
	importsNotUsedAsValues: ImportsNotUsedAsValues.Remove,
	verbatimModuleSyntax: true,
	isolatedModules: true,
};

/** Transpile TypeScript source to JavaScript in-process (no child process). */
const transpileTs = (source: string, fileName = 'inline.ts'): string =>
	transpileModule(source, { compilerOptions: tsCompilerOptions, fileName, reportDiagnostics: false }).outputText;

/**
 * Import Thunderous (core lib, not server) and set up server-side rendering state.
 * This should be called once at the start of the build process.
 */
export const bootstrapThunderous = () => {
	// eslint-disable-next-line @typescript-eslint/consistent-type-imports
	const Thunderous: typeof import('thunderous') = outRequire('thunderous');
	const { insertTemplates, onServerDefine } = Thunderous;
	// Update the markup each time a thunderous element is defined on the server
	onServerDefine((tagName, innerHTML) => {
		renderState.markup = insertTemplates(
			tagName,
			innerHTML.replace(/\s+/gm, ' ').replace(/ >/g, '>'),
			renderState.markup,
		);
		console.log(`\x1b[90mInserted template for <${tagName}> into markup.\x1b[0m`);
	});
};

/** Transpile a .ts file on disk to .js, writing the output next to it. Returns the .js path. */
export const transpileTsFile = (tsFilePath: string) => {
	const source = readFileSync(tsFilePath, 'utf-8');
	const js = transpileTs(source, basename(tsFilePath));
	const jsPath = tsFilePath.replace(/\.ts$/, '.js');
	writeFileSync(jsPath, js, 'utf-8');
	rmSync(tsFilePath);
	return jsPath;
};

type ProcessFilesArgs = {
	dir: string;
	filter: (filePath: string) => boolean;
	callback: (filePath: string) => void | Promise<void>;
};

export const processFiles = (args: ProcessFilesArgs) => {
	const dirPath = resolve(args.dir);
	const files = readdirSync(dirPath);

	for (const file of files) {
		const filePath = join(dirPath, file);
		const stat = statSync(filePath);
		if (stat.isDirectory()) {
			processFiles({
				...args,
				dir: filePath,
			});
		} else if (args.filter(filePath)) {
			void args.callback(filePath);
		}
	}
};

type ScriptKind = 'expr' | 'server' | 'isomorphic' | 'module';
type ParsedScript = { kind: ScriptKind; content: string; href?: string | undefined; start: number; end: number };
type ParsedLayout = { href: string; start: number; end: number };

// ── Cached resolved paths (computed once at module load) ──
const resolvedBaseDir = resolve(config.baseDir);
const resolvedOutDir = resolve(config.outDir);

// ── Single-pass tag scanner ──
const extractTags = (markup: string) => {
	const scripts: ParsedScript[] = [];
	const layouts: ParsedLayout[] = [];
	let i = 0;
	while (i < markup.length) {
		if (markup[i] !== '<') {
			i++;
			continue;
		}

		// <?layout href="…">
		if (markup.startsWith('<?layout', i)) {
			const close = markup.indexOf('>', i);
			if (close === -1) {
				i++;
				continue;
			}
			const tag = markup.slice(i, close + 1);
			const hrefStart = tag.indexOf('href="');
			if (hrefStart !== -1) {
				const valStart = hrefStart + 6;
				const valEnd = tag.indexOf('"', valStart);
				if (valEnd !== -1) {
					layouts.push({ href: tag.slice(valStart, valEnd), start: i, end: close + 1 });
				}
			}
			i = close + 1;
			continue;
		}

		// <script …>
		if (markup.startsWith('<script', i) && /[\s>]/.test(markup[i + 7] ?? '')) {
			const tagClose = markup.indexOf('>', i);
			if (tagClose === -1) {
				i++;
				continue;
			}
			const openTag = markup.slice(i, tagClose + 1);
			const attrs = openTag.slice(openTag.indexOf(' '), openTag.lastIndexOf('>'));
			let kind: ScriptKind | null = null;
			if (/\bexpr\b/.test(attrs)) kind = 'expr';
			else if (/\bserver\b/.test(attrs)) kind = 'server';
			else if (/\bisomorphic\b/.test(attrs)) kind = 'isomorphic';
			else if (/\btype\s*=\s*"module"/.test(attrs)) kind = 'module';

			let href: string | undefined;
			const hrefMatch = /\bhref\s*=\s*"([^"]*)"/.exec(attrs);
			if (hrefMatch) href = hrefMatch[1];

			let endPos = -1;
			let j = tagClose + 1;
			while (j < markup.length) {
				const idx = markup.indexOf('</', j);
				if (idx === -1) break;
				if (/^script\s*>/i.test(markup.slice(idx + 2).trimStart())) {
					endPos = markup.indexOf('>', idx + 2) + 1;
					break;
				}
				j = idx + 2;
			}
			if (endPos === -1) {
				i = tagClose + 1;
				continue;
			}

			if (kind !== null) {
				const content = markup.slice(tagClose + 1, markup.lastIndexOf('</', endPos - 1)).trim();
				scripts.push({ kind, content, href, start: i, end: endPos });
			}
			i = endPos;
			continue;
		}

		i++;
	}
	return { scripts, layouts };
};

/**
 * Extract and execute all `<script server>` tags in the given file, and strip
 * them from the markup. Parse the remaining markup with Thunderous' `html` tagged template.
 *
 * @example
 * Example HTML file:
 * ```html
 * <p>
 *   <script expr>
 *     `${greeting}, world!`
 *   </script>
 * </p>
 *
 * <script server>
 *   export default {
 *     greeting: 'Hello'
 *   };
 * </script>
 * ```
 *
 * @example
 * TypeScript usage:
 * ```ts
 * generateStaticTemplate('path/to/file.html').then((renderedMarkup) => {
 *   console.log(renderedMarkup); // Outputs roughly: <p>Hello, world!</p>
 * });
 * ```
 */
export const generateStaticTemplate = (filePath: string) => {
	renderState.markup = readFileSync(filePath, 'utf-8');

	const name = basename(filePath, extname(filePath));

	// Set metadata context for the current page before server scripts run
	const relativePath = relative(resolvedBaseDir, filePath);
	const parentDir = dirname(relativePath).replace(/^\./, '');
	const pathname = `/${parentDir}${name === 'index' ? '' : `/${name}`}`;
	const titleWord = name === 'index' ? (pathname.split('/').pop() ?? '') : name;
	const title = titleWord
		.split(/[-_]/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
	const path = pathname.split('/').filter((segment) => segment !== '');
	let crumbPathname = '/';
	const breadcrumbs: Breadcrumb[] = [
		{
			// always add the home page
			name: config.name,
			pathname: crumbPathname,
		},
	];
	// add each segment of the path as a breadcrumb
	for (const segment of path) {
		crumbPathname += `/${segment}`;
		breadcrumbs.push({
			name: segment,
			pathname: crumbPathname,
		});
	}
	setMeta({
		config,
		pathname,
		title,
		filename: basename(filePath),
		name,
		breadcrumbs,
	});

	// ── Extract and apply layouts ──
	const { layouts } = extractTags(renderState.markup);
	for (let i = layouts.length - 1; i >= 0; i--) {
		const l = layouts[i]!;
		renderState.markup = renderState.markup.slice(0, l.start) + renderState.markup.slice(l.end);
	}
	renderState.markup = renderState.markup.trim();

	for (const layout of layouts) {
		const layoutPath = join(filePath.slice(0, filePath.lastIndexOf('/')), layout.href);
		if (!existsSync(layoutPath)) {
			console.warn(`\x1b[33mWarning: Layout file not found: ${layoutPath}\x1b[0m`);
			continue;
		}
		const layoutContent = readFileSync(layoutPath, 'utf-8');
		const slotTag = '<slot></slot>';
		const slotIndex = layoutContent.indexOf(slotTag);
		if (slotIndex === -1) {
			console.warn(`\x1b[33mWarning: No <slot></slot> found in ${layout.href}\x1b[0m`);
			continue;
		}
		renderState.markup =
			layoutContent.slice(0, slotIndex) + renderState.markup + layoutContent.slice(slotIndex + slotTag.length);
		console.log(`\x1b[90mApplied layout: ${layout.href}\x1b[0m`);
	}
	// ── Extract and process scripts ──
	const { scripts } = extractTags(renderState.markup);
	const fileDir = filePath.slice(0, filePath.lastIndexOf('/'));
	const safeValues: Record<string, unknown> = {};
	const clientEntryFiles: string[] = [];
	const tempFilesToCleanup: string[] = [];

	// Map from scriptKey → replacement text (built during processing, applied later)
	const scriptKey = (s: ParsedScript) => `${s.kind}|${s.href ?? ''}|${s.content}`;
	const replacementMap = new Map<string, string>();

	let scriptIndex = 0;
	for (const script of scripts) {
		const key = scriptKey(script);

		// ── Resolve content: from href file or inline ──
		let content = script.content;
		let hrefAbsPath: string | undefined;
		if (script.href) {
			hrefAbsPath = resolve(fileDir, script.href);
			if (!existsSync(hrefAbsPath)) {
				console.warn(`\x1b[33mWarning: Script href file not found: ${hrefAbsPath}\x1b[0m`);
				continue;
			}
			if (script.kind === 'expr') {
				content = readFileSync(hrefAbsPath, 'utf-8').trim();
			}
		}

		if (script.kind === 'expr') {
			// expr scripts are handled entirely in the replacement pass
			replacementMap.set(key, '__expr__');
			continue;
		}

		// ── Server/isomorphic: execute server-side to collect exported values ──
		if (script.kind === 'server' || script.kind === 'isomorphic') {
			let module: Record<string, unknown>;
			if (hrefAbsPath) {
				// href: require the file directly from source
				delete outRequire.cache[outRequire.resolve(hrefAbsPath)];
				module = outRequire(hrefAbsPath);
			} else {
				// inline: write temp .ts so outRequire can import it
				const tsScriptFile = join(resolvedOutDir, `${name}-${scriptIndex}.tmp.ts`);
				writeFileSync(tsScriptFile, `// @ts-nocheck\n${content}`, 'utf-8');
				tempFilesToCleanup.push(tsScriptFile);
				delete outRequire.cache[outRequire.resolve(tsScriptFile)];
				module = outRequire(tsScriptFile);
			}
			const values = module['default'] ?? {};
			for (const k in values) {
				const val = (values as Record<string, unknown>)[k];
				safeValues[k] = typeof val === 'string' ? escapeHtml(val) : val;
			}
		}

		// ── Build replacement text and collect client entry files ──
		if (script.kind === 'server') {
			// Server scripts are fully discarded from client output
			replacementMap.set(key, '');
		} else if (hrefAbsPath) {
			// href isomorphic/module: output a <script src> pointing to the .js file
			const jsSrc = script.href!.replace(/\.tsx?$/, '.js');
			replacementMap.set(key, `<script type="module" src="${jsSrc}"></script>`);
			// Resolve the outDir .js path for vendorization
			const hrefRelPath = relative(resolvedBaseDir, hrefAbsPath);
			const hrefOutJsPath = join(resolvedOutDir, hrefRelPath).replace(/\.tsx?$/, '.js');
			clientEntryFiles.push(resolve(hrefOutJsPath));
		} else {
			// inline isomorphic/module: transpile in-process and inline the JS
			const js = transpileTs(`// @ts-nocheck\n${content}`, `${name}-${scriptIndex}.ts`);
			const fixedJs = js
				.replace(/(import\s+.+?\s+from\s+['"](?:\.\.?\/|\/)[^'"]+?)\.tsx?(['"])/gm, '$1.js$2')
				.replace(/(import\s+.+?\s+from\s+['"](?:\.\.?\/|\/)[^'"]+?)(?<!\.m?js)(['"])/gm, '$1.js$2');
			replacementMap.set(key, `<script type="module">\n${fixedJs}\n</script>`);

			// Write .js to outDir for vendorization
			const jsOutPath = join(resolvedOutDir, `${name}-${scriptIndex}.tmp.js`);
			writeFileSync(jsOutPath, js, 'utf-8');
			tempFilesToCleanup.push(jsOutPath);
			clientEntryFiles.push(resolve(jsOutPath));
		}

		scriptIndex++;
	}

	// ── Re-parse and apply all replacements in one reverse pass ──
	const { scripts: freshScripts } = extractTags(renderState.markup);
	for (let i = freshScripts.length - 1; i >= 0; i--) {
		const script = freshScripts[i]!;
		const key = scriptKey(script);
		const replacement = replacementMap.get(key);
		if (replacement === undefined) continue;

		let text: string;
		if (replacement === '__expr__') {
			// Evaluate expr: content may come from href file
			let content = script.content;
			if (script.href) {
				const hrefPath = resolve(fileDir, script.href);
				content = readFileSync(hrefPath, 'utf-8').trim();
			}
			const expression = content.replace(/;$/, '');
			// eslint-disable-next-line @typescript-eslint/no-implied-eval
			text = Function(
				'html',
				'escapeHtml',
				'raw',
				...Object.keys(safeValues),
				`'use strict'; return html\`\${${expression}}\`;`,
			)(html, escapeHtml, raw, ...Object.values(safeValues));
		} else {
			text = replacement;
		}
		renderState.markup = renderState.markup.slice(0, script.start) + text + renderState.markup.slice(script.end);
	}
	renderState.markup = renderState.markup.trim();

	// Return the final rendered markup, client entry files, and cleanup function
	return {
		markup: renderState.markup,
		clientEntryFiles,
		cleanup: () => {
			for (const file of tempFilesToCleanup) {
				if (existsSync(file)) {
					rmSync(file);
				}
			}
		},
	};
};

/**
 * Generate import maps from entry files using vendorization.
 * Returns the import map JSON string that can be injected into HTML.
 */
export const generateImportMap = (entryFiles: string[]): string => {
	if (entryFiles.length === 0) {
		return JSON.stringify({ imports: {} }, null, 2);
	}

	console.log(`\x1b[90mVendorizing dependencies from ${entryFiles.length} entry file(s)...\x1b[0m`);
	processNodeModules(entryFiles, config.outDir);
	console.log(`\x1b[32m✓ Import map generated\x1b[0m`);

	const importMapPath = join(config.outDir, 'importmap.json');
	if (existsSync(importMapPath)) {
		return readFileSync(importMapPath, 'utf-8');
	}

	return JSON.stringify({ imports: {} }, null, 2);
};

/**
 * Inject an import map into HTML content.
 * If an import map script already exists, it will be replaced.
 * Otherwise, it will be injected before the first script tag or at the end.
 */
export const injectImportMap = (html: string, importMapJson: string): string => {
	const importMapTag = `<script type="importmap">\n${importMapJson}\n</script>`;

	// Check if there's already an import map and replace it
	const existingImportMapRegex = /<script\s+type="importmap"[^>]*>[\s\S]*?<\/script>/i;
	if (existingImportMapRegex.test(html)) {
		return html.replace(existingImportMapRegex, importMapTag);
	}

	// Otherwise inject before first script tag
	const firstScriptMatch = /<script/i.exec(html);
	if (firstScriptMatch?.index !== undefined) {
		return html.slice(0, firstScriptMatch.index) + importMapTag + '\n' + html.slice(firstScriptMatch.index);
	}

	// No script tag found, inject before </head> if possible
	const headCloseMatch = /<\/head>/i.exec(html);
	if (headCloseMatch?.index !== undefined) {
		return html.slice(0, headCloseMatch.index) + importMapTag + '\n' + html.slice(headCloseMatch.index);
	}

	// Last resort: add at the end
	return html + '\n' + importMapTag;
};
