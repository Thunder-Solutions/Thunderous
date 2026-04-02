import { clientOnlyCallback, createEffect, createRegistry, createSignal, customElement, css, html } from 'thunderous';
const parser = (typeof window !== 'undefined' ? new DOMParser() : null)!;

// Mutable state for navigation handling
let viewCount = 0;
let navigateAbort = new AbortController();
let resolvers = Promise.withResolvers<string>();
resolvers.resolve(document.documentElement.outerHTML);

// Avoid registering the same navigation handler multiple times, in case this script
// is invoked again (e.g., referenced by a <script> tag rendered inside the view)
declare global {
	var __GLOBAL_THUNDEROUS_VIEW_REGISTERED: boolean;
}
if (!globalThis.__GLOBAL_THUNDEROUS_VIEW_REGISTERED) {
	globalThis.__GLOBAL_THUNDEROUS_VIEW_REGISTERED = true;

	// Setup global navigation behavior once
	// eslint-disable-next-line @typescript-eslint/no-floating-promises
	clientOnlyCallback(() => {
		navigation.addEventListener('navigate', (event) => {
			// Skip cross-origin and same-document navigations
			if (!event.canIntercept || event.destination.sameDocument) return;

			// Intercept the navigation
			event.intercept({
				async handler() {
					navigateAbort.abort();
					navigateAbort = new AbortController();
					resolvers = Promise.withResolvers<string>();
					fetch(event.destination.url, {
						headers: { 'content-type': 'text/html' },
						signal: navigateAbort.signal,
					})
						.then((r) => r.text())
						.then(resolvers.resolve)
						.catch(resolvers.reject);

					// Always replace all <head> content
					const destinationDocument = parser.parseFromString(await resolvers.promise, 'text/html');
					const destinationHeadElement = destinationDocument.querySelector('head');
					const destinationHeadChildren = Array.from(destinationHeadElement?.childNodes ?? []);
					document.head.replaceChildren(...destinationHeadChildren);

					if (viewCount === 0) {
						console.debug('THUNDEROUS-SPA: No views found, replacing entire body element');
						document.body.replaceChildren(...destinationDocument.body.childNodes);
					}
				},
			});
		});
	});
}

// This registry helps us track the consumer's tag name for the view element
const ViewRegistry = createRegistry();

/**
 * A custom element that renders partial page content on the client side.
 *
 * When a link is clicked, the content of this view is replaced by the content of
 * a corresponding view element with the same ID in the destination page.
 *
 * You may have multiple view elements on a page, but only one per ID.
 *
 * @example
 * ```js
 * import { View } from 'thunderous-csr';
 * View.define('t-view');
 * ```
 * @example
 * ```html
 * <t-view id="main-content">
 *   <div>Content</div>
 * </t-view>
 * ```
 */
const View = customElement(
	({ clientOnlyCallback, connectedCallback, disconnectedCallback, adoptStyleSheet, elementRef }) => {
		const [getStatus, setStatus] = createSignal('ready');

		// Define basic styles, but nothing too opinionated
		adoptStyleSheet(css`
			:host {
				display: block;
				.loading-overlay {
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					opacity: 0;
					background-color: black;
					transition: opacity 0.3s ease;
					pointer-events: none;
				}
			}
			:host(.pending) {
				cursor: wait;
				.loading-overlay {
					opacity: 0.5;
					pointer-events: auto;
				}
			}
		`);

		clientOnlyCallback(() => {
			// Validate ID attribute
			if (!elementRef.id) {
				console.error('THUNDEROUS-SPA: view missing required id attribute', elementRef);
				return;
			}

			// Define status property and corresponding classes
			Object.defineProperty(elementRef, 'status', {
				get: getStatus,
				set: () => {
					throw new Error('THUNDEROUS-SPA: view status is read-only');
				},
			});
			setStatus('ready');
			createEffect(() => {
				const status = getStatus();
				elementRef.classList.toggle('pending', status === 'pending');
				elementRef.classList.toggle('ready', status === 'ready');
				elementRef.classList.toggle('error', status === 'error');
				console.debug(`THUNDEROUS-SPA: view status updated to "${status}" for ${elementRef.id}`);
			});

			// Define navigation handlers
			const handleNavigate = (event: NavigateEvent) => {
				if (!event.canIntercept) return;
				setStatus('pending');
				event.intercept({
					async handler() {
						const destinationDocument = parser.parseFromString(await resolvers.promise, 'text/html');
						const tagName = ViewRegistry.getTagName(View) ?? 't-view';
						const selector = `${tagName}#${elementRef.id}`;
						const destinationViewElement = destinationDocument.querySelector(selector);
						destinationViewElement?.classList.add('pending'); // to match the host element's state for comparison later
						const destinationHTML = destinationDocument.body.innerHTML;

						if (destinationViewElement === null) {
							console.warn(
								`THUNDEROUS-SPA: view not found in destination document for ${elementRef.id}; this view will be removed from the DOM`,
							);
							elementRef.remove();
						} else {
							// Partial DOM patch using view transitions
							const viewTransition = document.startViewTransition(() => {
								elementRef.replaceChildren(...destinationViewElement.childNodes);
								console.debug(`THUNDEROUS-SPA: Replaced view content for ${elementRef.id}`);
							});
							await viewTransition.updateCallbackDone;
						}

						if (document.body.innerHTML !== destinationHTML) {
							console.warn(
								`THUNDEROUS-SPA: body content does not match the full destination document after the partial update. Replacing the entire body element instead.`,
								{
									source: document.body.innerHTML,
									destination: destinationHTML,
								},
							);
							const viewTransition = document.startViewTransition(() => {
								document.body.replaceChildren(...destinationDocument.body.childNodes);
							});
							await viewTransition.updateCallbackDone;
						}
					},
				});
			};
			const handleSuccess = () => {
				void navigation.transition?.finished.then(() => setStatus('ready'));
			};
			const handleError = () => setStatus('error');

			// Attach navigation handlers when this element is added to the DOM.
			connectedCallback(() => {
				navigation.addEventListener('navigate', handleNavigate);
				navigation.addEventListener('navigatesuccess', handleSuccess);
				navigation.addEventListener('navigateerror', handleError);
				viewCount++;
				console.debug(`THUNDEROUS-SPA: view connected for ${elementRef.id}`);
			});

			// Detach all navigation handlers when this element is removed from the DOM
			// to avoid stacking them up, since this affects the global navigation object.
			disconnectedCallback(() => {
				navigation.removeEventListener('navigate', handleNavigate);
				navigation.removeEventListener('navigatesuccess', handleSuccess);
				navigation.removeEventListener('navigateerror', handleError);
				viewCount--;
				console.debug(`THUNDEROUS-SPA: view disconnected for ${elementRef.id}`);
			});
		});

		// Render the view
		return html`
			<slot name="loading-overlay">
				<!-- This is the default loading overlay if no custom one is provided -->
				<div class="loading-overlay"></div>
			</slot>
			<!-- All other standard view content is passed through the default slot -->
			<slot></slot>
		`;
	},
).register(ViewRegistry);

export { View };
