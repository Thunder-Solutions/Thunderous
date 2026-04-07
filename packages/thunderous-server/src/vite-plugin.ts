import type { Plugin, ViteDevServer, Connect } from 'vite';
import type { ServerResponse } from 'http';
import { createRequire } from 'module';
import { existsSync, readdirSync, statSync } from 'fs';
import { dirname, join, relative, resolve } from 'path';
import { bootstrapThunderous, generateStaticTemplate } from './generate';
import { config } from './config';

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
		for (const entry of readdirSync(dir)) {
			const full = join(dir, entry);
			if (statSync(full).isDirectory()) {
				walk(full);
			} else if (entry.endsWith('.html') && !entry.startsWith('_')) {
				const rel = relative(root, dirname(full));
				const urlPath = `/${rel}${entry === 'index.html' ? '' : `/${entry.replace('.html', '')}`}`;
				pages.push({ filePath: full, urlPath });
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
	const outRequire = createRequire(resolve(config.baseDir));

	// Pre-rendered SSR markup cache: urlPath → markup
	const pageCache = new Map<string, string>();

	const invalidateRequireCache = () => {
		for (const key of Object.keys(outRequire.cache)) {
			if (key.startsWith(root)) {
				delete outRequire.cache[key];
			}
		}
	};

	/** Pre-render every routable page so SSR markup is ready before reload. */
	const renderAllPages = () => {
		pageCache.clear();
		for (const { filePath, urlPath } of collectHtmlPages(root)) {
			try {
				const result = generateStaticTemplate(filePath);
				pageCache.set(urlPath, result.markup);
				result.cleanup();
			} catch (error) {
				console.error(`\x1b[31mError pre-rendering ${urlPath}:\x1b[0m`, error);
			}
		}
	};

	const virtualId = 'virtual:thunderous-hmr-client';
	const resolvedVirtualId = '\0' + virtualId;

	return {
		name: 'thunderous',

		// resolveId(id) {
		// 	if (id === virtualId) return resolvedVirtualId;
		// 	return id;
		// },

		// load(id) {
		// 	if (id === resolvedVirtualId) {
		// 		return `
		// 			if (import.meta.hot) {
		// 				import.meta.hot.on('thunderous:reload', () => {
		// 					location.reload();
		// 				})
		// 			}
		// 		`;
		// 	}
		// 	return '';
		// },

		// transformIndexHtml(html) {
		// 	return {
		// 		html,
		// 		tags: [
		// 			{
		// 				tag: 'script',
		// 				attrs: { type: 'module' },
		// 				children: `import "virtual:thunderous-hmr-client"`,
		// 				injectTo: 'head',
		// 			},
		// 		],
		// 	};
		// },

		configureServer(server: ViteDevServer) {
			bootstrapThunderous();

			// Initial pre-render so the first request is served from cache.
			renderAllPages();

			// On any file change in baseDir: bust cache → re-render all pages → reload.
			// All three steps are synchronous, so the pre-render logs appear before the reload.
			const onFileChange = (file: string) => {
				if (!file.startsWith(root)) return;
				invalidateRequireCache();
				renderAllPages();
				server.ws.send({ type: 'full-reload' });
			};
			server.watcher.on('change', onFileChange);
			server.watcher.on('add', onFileChange);

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
				server.middlewares.use(
					async (req: Connect.IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
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
								result.cleanup();
							} catch (error) {
								console.error(`\x1b[31mError processing ${htmlPath}:\x1b[0m`, error);
								return next(error);
							}
						}

						try {
							// Let Vite inject its HMR client and process module scripts
							markup = await server.transformIndexHtml(url, markup);

							res.statusCode = 200;
							res.setHeader('Content-Type', 'text/html');
							res.end(markup);
						} catch (error) {
							console.error(`\x1b[31mError transforming HTML for ${url}:\x1b[0m`, error);
							next(error);
						}
					},
				);
			};
		},
	};
};
