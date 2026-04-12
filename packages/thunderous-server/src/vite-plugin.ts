import type { Plugin, ViteDevServer, Connect } from 'vite';
import { clearServerCss, clearRenderState } from 'thunderous';
import type { ServerResponse } from 'http';
import { existsSync, readdirSync, statSync } from 'fs';
import { dirname, join, relative, resolve } from 'path';
import { bootstrapThunderous, generateStaticTemplate } from './generate';
import { config } from './config';
import chalk from 'chalk';

/**
 * Resolve a URL pathname to an HTML file in the base directory.
 * Maps routes like `/about` → `src/about/index.html`, `/about/contact` → `src/about/contact.html`.
 */
const resolveHtmlPath = (url: string, root: string): string | null => {
	const pathname = url.split('?')[0]?.split('#')[0] ?? '/';

	// Files starting with _ are excluded (layouts, partials, etc.)
	const lastSegment = pathname.split('/').pop() ?? '';
	if (lastSegment.startsWith('_')) return null;

	// Try: /about → src/about/index.html
	const indexPath = join(root, pathname, 'index.html');
	if (existsSync(indexPath)) return indexPath;

	// Try: /about/contact → src/about/contact.html
	const directPath = join(root, pathname + '.html');
	if (existsSync(directPath)) return directPath;

	return null;
};

/**
 * Walk baseDir and collect all routable HTML files (excluding _layout, _partials, etc.).
 * Returns an array of { filePath, urlPath } objects.
 */
const collectHtmlPages = (root: string): Array<{ filePath: string; urlPath: string }> => {
	const pages: Array<{ filePath: string; urlPath: string }> = [];
	const walk = (dir: string) => {
		if (dir.split('/').pop()?.startsWith('_')) return;
		for (const entry of readdirSync(dir)) {
			// Skip temp files created during template generation
			if (entry.includes('.tmp.')) continue;
			const full = join(dir, entry);
			try {
				if (statSync(full).isDirectory()) {
					walk(full);
				} else if (entry.endsWith('.html') && !entry.startsWith('_')) {
					const rel = relative(root, dirname(full));
					const urlPath = `/${rel}${entry === 'index.html' ? '' : `/${entry.replace('.html', '')}`}`;
					pages.push({ filePath: full, urlPath });
				}
			} catch {
				// Skip files that may have been deleted during walk
				continue;
			}
		}
	};
	walk(root);
	return pages;
};

/**
 * Vite plugin for Thunderous server-side rendering.
 *
 * Handles:
 * - HTML page requests routed through `generateStaticTemplate`
 * - `.js` → `.ts`/`.tsx` resolution for isomorphic script src attributes
 * - Pre-renders all pages on file change BEFORE triggering browser reload
 */
export const thunderousPlugin = (): Plugin => {
	const root = resolve(config.baseDir);

	// Pre-rendered SSR markup cache: urlPath → markup
	const pageCache = new Map<string, string>();

	// Global cleanup queue for temp files - prevents race conditions between concurrent renders
	const pendingCleanups: Array<() => void> = [];
	const flushPendingCleanups = () => {
		while (pendingCleanups.length > 0) {
			const cleanup = pendingCleanups.shift();
			cleanup?.();
		}
	};

	/** Pre-render a single page and cache it. */
	const renderPage = (filePath: string, urlPath: string) => {
		try {
			const result = generateStaticTemplate(filePath);
			pageCache.set(urlPath, result.markup);
			// Queue cleanup - deferred until batch completes
			pendingCleanups.push(result.cleanup);
		} catch (error) {
			console.error(`\x1b[31mError pre-rendering ${urlPath}:\x1b[0m`, error);
		}
	};

	/** Pre-render every routable page so SSR markup is ready before reload. */
	const renderAllPages = () => {
		// Flush any stale cleanups from previous batch before starting new one
		flushPendingCleanups();
		clearRenderState?.();
		clearServerCss?.();
		pageCache.clear();
		for (const { filePath, urlPath } of getPages()) {
			renderPage(filePath, urlPath);
		}
		// Clean up all temp files only after entire batch completes
		flushPendingCleanups();
		console.log('');
	};

	// Cache the pages list to avoid walking directory on every file change
	let cachedPages: Array<{ filePath: string; urlPath: string }> | null = null;
	const getPages = (): Array<{ filePath: string; urlPath: string }> => {
		cachedPages ??= collectHtmlPages(root);
		return cachedPages;
	};
	const invalidatePagesCache = () => {
		cachedPages = null;
	};

	/** Find the page URL path for a given file path. */
	const findPageForFile = (filePath: string): { filePath: string; urlPath: string } | null => {
		for (const page of getPages()) {
			if (page.filePath === filePath) return page;
		}
		return null;
	};

	return {
		name: 'thunderous',

		config() {
			return {
				optimizeDeps: {
					// Exclude underscore directories from dependency scanning
					exclude: ['**/_*/**'],
				},
			};
		},

		configureServer(server: ViteDevServer) {
			bootstrapThunderous();

			// Initial pre-render so the first request is served from cache.
			renderAllPages();

			// On file change: re-render affected pages → reload.
			// For HTML files, only re-render that page. For other files, re-render all pages
			// since they may be imported by multiple pages.
			const onFileChange = (file: string) => {
				if (!file.startsWith(root)) return;
				// Ignore temp files created during template generation
				if (file.includes('.tmp.ts') || file.includes('.tmp.js')) return;
				console.log(chalk.cyan.bold('\nChanges detected. Rebuilding...\n'));

				// Check if the changed file is a page itself
				const changedPage = findPageForFile(file);
				if (changedPage) {
					// Re-render only the changed page
					pageCache.delete(changedPage.urlPath);
					renderPage(changedPage.filePath, changedPage.urlPath);
				} else {
					// For non-page files (components, scripts, etc.), re-render all pages
					renderAllPages();
				}
				console.log('');
				server.ws.send({ type: 'full-reload' });
			};
			server.watcher.on('change', onFileChange);

			// On file add: invalidate cache since pages list may have changed
			const onFileAdd = (file: string) => {
				// Ignore temp files created during template generation
				if (file.includes('.tmp.ts') || file.includes('.tmp.js')) return;
				invalidatePagesCache();
				onFileChange(file);
			};
			server.watcher.on('add', onFileAdd);

			// Rewrite .js requests to .ts/.tsx when the .js file doesn't exist
			// (generateStaticTemplate outputs .js src paths but source files are .ts)
			server.middlewares.use((req: Connect.IncomingMessage, _res: unknown, next: Connect.NextFunction) => {
				if (!req.url?.endsWith('.js')) return next();
				const cleanUrl = req.url.split('?')[0] ?? '';
				const jsPath = join(root, cleanUrl);
				if (existsSync(jsPath)) return next();
				const tsPath = join(root, cleanUrl.replace(/\.js$/, '.ts'));
				const tsxPath = join(root, cleanUrl.replace(/\.js$/, '.tsx'));
				if (existsSync(tsPath)) {
					req.url = req.url.replace(/\.js$/, '.ts');
				} else if (existsSync(tsxPath)) {
					req.url = req.url.replace(/\.js$/, '.tsx');
				}
				next();
			});

			// Serve pre-rendered HTML pages, applying Vite's transforms at serve time.
			return () => {
				server.middlewares.use((req: Connect.IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
					const url = req.originalUrl ?? req.url;
					if (!url) return next();

					const urlPath = url.split('?')[0]?.split('#')[0] ?? '/';

					// Try cache first, fall back to on-demand render
					let markup = pageCache.get(urlPath);
					if (!markup) {
						const htmlPath = resolveHtmlPath(url, root);
						if (!htmlPath) return next();
						try {
							const result = generateStaticTemplate(htmlPath);
							markup = result.markup;
							// Queue cleanup - will be flushed after response sent
							pendingCleanups.push(result.cleanup);
						} catch (error) {
							console.error(`\x1b[31mError processing ${htmlPath}:\x1b[0m`, error);
							return next(error);
						}
					}

					// Let Vite inject its HMR client and process module scripts
					server
						.transformIndexHtml(url, markup)
						.then((markup) => {
							res.statusCode = 200;
							res.setHeader('Content-Type', 'text/html');
							res.end(markup);
							// Clean up temp files after response is sent
							flushPendingCleanups();
						})
						.catch((error) => {
							console.error(`\x1b[31mError transforming HTML for ${url}:\x1b[0m`, error);
							// Clean up temp files even on error
							flushPendingCleanups();
							next(error);
						});
				});
			};
		},
	};
};
