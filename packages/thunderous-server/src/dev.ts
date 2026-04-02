import express from 'express';
import { readdirSync, statSync, mkdtempSync } from 'fs';
import { join, relative, resolve } from 'path';
import { tmpdir } from 'os';
import { bootstrapThunderous, generateStaticTemplate, generateImportMap, injectImportMap } from './generate';
import { config } from './config';
import livereload from 'livereload';
import connectLiveReload from 'connect-livereload';

/**
 * Find all `.html` files in the given directory and set up Express routes to serve them.
 *
 * Composes `processServerScripts` to handle server-side logic and templating in the HTML files.
 */
const bootstrapRoutes = (dir: string, app: express.Express, vendorDir: string) => {
	const dirPath = resolve(dir);
	const files = readdirSync(dirPath);

	for (const file of files) {
		const filePath = join(dirPath, file);
		if (file.endsWith('.html') && !file.startsWith('_')) {
			const basePath = relative(config.baseDir, dirPath);
			const path = `/${basePath}${file === 'index.html' ? '' : `/${file.replace('.html', '')}`}`;
			console.log(`\x1b[90mFound path: ${path}\x1b[0m`);

			app.get(path, (_, res) => {
				console.log(`\x1b[90mServing file: ${basePath}/${file}\x1b[0m`);

				// Process the HTML file and extract client entry files
				const result = generateStaticTemplate(filePath);
				let markup = result.markup;

				// Generate import map if there are client entry files
				if (result.clientEntryFiles.length > 0) {
					const importMapJson = generateImportMap(result.clientEntryFiles);
					markup = injectImportMap(markup, importMapJson);
				}

				// Clean up temporary files
				result.cleanup();

				res.send(markup);
			});
		}
		if (statSync(filePath).isDirectory()) {
			bootstrapRoutes(filePath, app, vendorDir);
		}
	}
};

export const dev = () => {
	console.log('\n\x1b[36m\x1b[1m⚡⚡ Starting development server... ⚡⚡\x1b[0m\x1b[0m\n');

	const PORT = process.env['PORT'] ?? 3000;

	// Set up simple express server
	const app = express();

	// Set up live reload to watch for changes
	const liveReloadServer = livereload.createServer();
	liveReloadServer.watch(`${process.cwd()}/${config.baseDir}`);
	app.use(connectLiveReload());
	app.use((_, res, next) => {
		const originalSend = res.send;

		// Inject live reload script into HTML responses
		res.send = function (body) {
			if (typeof body === 'string' && body.includes('</body>')) {
				const liveReloadScript = '<script src="http://localhost:35729/livereload.js"></script>';
				body = body.replace('</body>', `${liveReloadScript}</body>`);
			}
			return originalSend.call(this, body);
		};
		next();
	});

	// Create a temporary directory for vendorized modules in dev mode
	const vendorDir = mkdtempSync(join(tmpdir(), 'thunderous-vendor-'));
	console.log(`\x1b[90mUsing temporary vendor directory: ${vendorDir}\x1b[0m`);

	bootstrapThunderous();
	bootstrapRoutes(`./${config.baseDir}`, app, vendorDir);

	// Serve static assets from the base directory
	app.use(express.static(config.baseDir));

	// Serve vendorized modules
	app.use('/vendor', express.static(join(vendorDir, 'vendor')));

	const server = app.listen(PORT, () => {
		console.log(`\n\x1b[38;2;100;149;237mServer is running on http://localhost:${PORT}\x1b[0m\n`);
	});

	// Close everything when server is closed
	server.once('close', () => {
		liveReloadServer.close();
		server.closeAllConnections?.();
		console.log('\x1b[32m\nAll connections closed successfully.\x1b[0m\n\n');
	});

	// Handle graceful shutdown when user cancels the process
	process.once('SIGINT', () => {
		console.log('\n\x1b[90mShutting down gracefully...\x1b[0m');
		server.close((error) => {
			if (error === undefined) {
				process.exitCode = 0;
			} else {
				console.error('Error closing server:', error);
				process.exitCode = 1;
			}
		});
	});
};
