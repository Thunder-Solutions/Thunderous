import { clientOnlyCallback } from 'thunderous';
import { type ParsedDocument, parseHTML } from './render';
import { validateHTML } from './validate';
import { View, type ViewElement, viewRegistry } from './view';
import { logger } from './logger';
import { state } from './state';

/**
 * Generates a stable key for a head element so we can match existing elements
 * against incoming ones without removing/re-adding identical tags.
 */
const headElementKey = (el: Element): string => {
	const tag = el.tagName;
	// For elements whose identity is determined by specific attributes
	if (tag === 'META') {
		const name =
			el.getAttribute('name') ||
			el.getAttribute('property') ||
			el.getAttribute('http-equiv') ||
			el.getAttribute('charset');
		if (name) return `meta[${name}]`;
	}
	if (tag === 'LINK') {
		const rel = el.getAttribute('rel') || '';
		const href = el.getAttribute('href') || '';
		return `link[${rel}][${href}]`;
	}
	if (tag === 'SCRIPT') {
		const src = el.getAttribute('src') || '';
		if (src) return `script[${src}]`;
	}
	// Fall back to outerHTML for style tags and anything else
	return el.outerHTML;
};

/**
 * Diff-patches the live <head> against the destination <head>.
 * Identical elements are left in place to avoid FOUC.
 */
const patchHead = (destHead: HTMLHeadElement) => {
	const liveChildren = [...document.head.children];
	const destChildren = [...destHead.children];

	// Build a map of destination elements keyed by identity
	const destMap = new Map<string, Element[]>();
	for (const el of destChildren) {
		const key = headElementKey(el);
		const list = destMap.get(key) ?? [];
		list.push(el);
		destMap.set(key, list);
	}

	// Remove live elements that are not in the destination
	const keepSet = new Set<Element>();
	for (const el of liveChildren) {
		const key = headElementKey(el);
		const matches = destMap.get(key);
		if (matches && matches.length > 0) {
			// This element still exists in the destination — keep it
			keepSet.add(el);
			matches.shift(); // consume the match
		} else {
			// Not in destination — remove it
			el.remove();
		}
	}

	// Add new destination elements that weren't matched
	for (const [, remaining] of destMap) {
		for (const el of remaining) {
			document.head.appendChild(el);
		}
	}
};

const parent = (typeof window === 'undefined' ? globalThis : window.parent) as typeof globalThis;

// Avoid registering the same navigation handler multiple times, in case this script
// is invoked again (e.g., referenced by a <script> tag rendered inside the view)
if (!globalThis.__GLOBAL_THUNDEROUS_VIEW_REGISTERED || parent.__GLOBAL_THUNDEROUS_VIEW_REGISTERED) {
	globalThis.__GLOBAL_THUNDEROUS_VIEW_REGISTERED = true;

	// Setup global navigation behavior once
	clientOnlyCallback(() => {
		navigation.addEventListener('navigate', (event) => {
			// Skip cross-origin and same-document navigations
			if (!event.canIntercept || event.destination.sameDocument) return;

			// Intercept the navigation
			event.intercept({
				async handler() {
					state.navigateAbort.abort();
					state.navigateAbort = new AbortController();
					state.destResolvers = Promise.withResolvers<ParsedDocument>();

					// fetch the new page content via ajax
					fetch(event.destination.url, {
						headers: { 'content-type': 'text/html' },
						signal: state.navigateAbort.signal,
					})
						.then((r) => r.text())
						.then((htmlStr) => {
							globalThis.__GLOBAL_THUNDEROUS_LOGGER_DISABLED = true;
							state.destResolvers.resolve(parseHTML(htmlStr));
							globalThis.__GLOBAL_THUNDEROUS_LOGGER_DISABLED = false;
						})
						.catch(state.destResolvers.reject);

					// Diff-patch <head> to avoid FOUC from removing/re-adding identical tags
					const destinationDocument = await state.destResolvers.promise;
					patchHead(destinationDocument.head);

					// Deferred cleanup tasks
					queueMicrotask(() => {
						requestAnimationFrame(async () => {
							// a utility to render the entire document
							const renderAll = () => {
								return document.startViewTransition(() => {
									document.body.replaceChildren(...destinationDocument.body.childNodes);
								});
							};

							// collect all views currently in the document
							const viewTagName = viewRegistry.getTagName(View) ?? 't-view';
							const views = document.querySelectorAll(viewTagName) as NodeListOf<ViewElement>;

							// render everything if there's no views at all.
							if (views.length === 0) {
								logger.debug('THUNDEROUS-CSR: No views found, replacing entire body element');
								await renderAll().updateCallbackDone;
								return;
							}

							// wait for all the views to be finished before proceeding with validation
							const viewPromises: Promise<void>[] = [];
							views.forEach((view) => viewPromises.push(view.finished));
							await Promise.all(viewPromises);

							// otherwise, validate the rendered document matches the destination HTML
							const { valid, htmlSrc, htmlDest } = await validateHTML(event.destination.url).catch((error) => {
								logger.error('THUNDEROUS-CSR: Unknown error while validating HTML.\n\n', error);
								return { valid: false, htmlSrc: '', htmlDest: '' };
							});
							if (valid) return; // if it's valid, just stop here

							// log a helpful error message if the HTML is invalid
							const diffRange = 50;
							let diffIdx = 0;
							for (const c of htmlSrc) {
								if (c === htmlDest.charAt(diffIdx)) {
									diffIdx++;
									continue;
								}
								break;
							}
							let startIdx = diffIdx - diffRange;
							if (startIdx < 0) startIdx = 0;
							console.warn(
								`THUNDEROUS-CSR: The rendered content does not match the server HTML after the partial update. Replacing the entire document instead.\n\n` +
									'EXPECTED:\n' +
									`%c${htmlDest.slice(startIdx, diffIdx + diffRange)}\n\n` +
									'%cACTUAL:\n' +
									`%c${htmlSrc.slice(startIdx, diffIdx + diffRange)}\n` +
									`%c${' '.repeat(diffIdx - startIdx)}^ Mismatched HTML here\n`,
								'color: cornflowerblue',
								'color: unset',
								'color: cornflowerblue',
								'color: red',
							);

							// HTML is invalid, render everything
							renderAll();
						});
					});
				},
			});
		});
	});
}
