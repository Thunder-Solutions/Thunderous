import { cpSync, existsSync, rmSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { join, resolve, dirname, relative } from 'path';
import {
	bootstrapThunderous,
	processFiles,
	generateStaticTemplate,
	transpileTsFile,
	generateImportMap,
	injectImportMap,
} from './generate';
import { config } from './config';

/** Make the directory if it does not exist. Not worth installing fs-extra just for this. */
export const ensureDirSync = (dirPath: string) => {
	if (!existsSync(dirPath)) {
		mkdirSync(dirPath, { recursive: true });
	}
};

/**
 * Build the static site.
 */
export const build = () => {
	console.log('\x1b[36m🔨 Building static site...\x1b[0m\n');

	const baseDir = resolve(config.baseDir);
	const outDir = resolve(config.outDir);

	if (!existsSync(baseDir)) {
		console.error(`\x1b[31mError: Base directory "${baseDir}" does not exist.\x1b[0m`);
		process.exit(1);
	}

	// Clean and create output directory
	if (existsSync(outDir)) {
		rmSync(outDir, { recursive: true });
	}
	ensureDirSync(outDir);

	// Copy all files (excluding build files which we'll process separately)
	console.log(`\x1b[90mCopying static assets...\x1b[0m`);

	cpSync(baseDir, outDir, {
		recursive: true,
		filter: (src) => !/\.server\.(ts|js)$/.test(src),
	});
	bootstrapThunderous();

	// Transpile TypeScript files FIRST and collect entry points
	console.log(`\x1b[90mTranspiling TypeScript files...\x1b[0m`);
	const entryFiles: string[] = [];
	processFiles({
		dir: outDir,
		filter: (filePath) => /(?<!\.d|\.tmp|\.server)\.ts$/.test(filePath),
		callback: (filePath) => {
			const relPath = relative(outDir, filePath);
			console.log(`\x1b[90mTranspiling: ${relPath}\x1b[0m`);
			try {
				const jsPath = transpileTsFile(filePath);
				entryFiles.push(jsPath);
				console.log(`\x1b[32m✓ Transpiled: ${relPath} → ${relative(outDir, jsPath)}\x1b[0m`);
			} catch (error) {
				console.error(`\x1b[31m✗ Error transpiling ${filePath}:\x1b[0m`, error);
			}
		},
	});

	// Process HTML files AFTER transpilation
	console.log(`\x1b[90mProcessing HTML files...\x1b[0m`);
	const htmlEntryFiles: string[] = [];
	const cleanupFunctions: Array<() => void> = [];
	const errors: string[] = [];
	processFiles({
		dir: baseDir,
		filter: (filePath) => filePath.endsWith('.html') && !filePath.split('/').pop()!.startsWith('_'),
		callback: (filePath) => {
			console.log(`\x1b[90mProcessing: ${relative(baseDir, filePath)}\x1b[0m`);

			try {
				const result = generateStaticTemplate(filePath);
				const markup = result.markup;

				// Collect client entry files from this HTML
				htmlEntryFiles.push(...result.clientEntryFiles);
				cleanupFunctions.push(result.cleanup);

				// Calculate the output path
				const relativePath = relative(baseDir, filePath);
				const outputPath = join(outDir, relativePath);

				// Ensure output directory exists
				ensureDirSync(dirname(outputPath));

				// Write the processed HTML
				writeFileSync(outputPath, markup, 'utf-8');

				console.log(`\x1b[32m✓ Generated: ${relativePath}\x1b[0m`);
			} catch (error) {
				console.error(`\x1b[31m✗ Error processing ${filePath}:\x1b[0m`, error);
				errors.push(filePath);
			}
		},
	});

	// Vendorize node modules based on collected entry files
	const allEntryFiles = [...htmlEntryFiles, ...entryFiles];
	if (allEntryFiles.length > 0) {
		const importMapJson = generateImportMap(allEntryFiles);

		// Inject import map into HTML files
		processFiles({
			dir: outDir,
			filter: (filePath) => filePath.endsWith('.html'),
			callback: (filePath) => {
				let html = readFileSync(filePath, 'utf-8');
				html = injectImportMap(html, importMapJson);
				writeFileSync(filePath, html, 'utf-8');
			},
		});
		console.log(`\x1b[32m✓ Import map injected into HTML files\x1b[0m`);
	}

	// Clean up temporary files from HTML processing
	for (const cleanup of cleanupFunctions) {
		cleanup();
	}

	if (errors.length > 0) {
		console.error(`\n\x1b[31m❌ Build failed with ${errors.length} error(s).\x1b[0m`);
		process.exit(1);
	}

	console.log(`\n\x1b[32m✅ Static site built successfully in "${outDir}"\x1b[0m`);
};
