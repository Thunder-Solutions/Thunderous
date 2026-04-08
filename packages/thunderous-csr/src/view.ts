import { createEffect, createRegistry, createSignal, customElement, css, html } from 'thunderous';
import { logger } from './logger';
import { state } from './state';

// This registry helps us track the consumer's tag name for the view element
export const viewRegistry = createRegistry();

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
export const View = customElement(
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
				logger.error('THUNDEROUS-CSR: View missing required id attribute', elementRef);
				return;
			}

			// Define status property and corresponding classes
			Object.defineProperty(elementRef, 'status', {
				get: getStatus,
				set: () => {
					throw new Error('THUNDEROUS-CSR: View status is read-only');
				},
			});

			let finishedResolvers = Promise.withResolvers<void>();

			Object.defineProperty(elementRef, 'finished', {
				get: () => finishedResolvers.promise,
				set: () => {
					throw new Error('THUNDEROUS-CSR: finished is a read-only promise');
				},
			});

			setStatus('pending');

			createEffect(() => {
				const status = getStatus();
				elementRef.classList.toggle('pending', status === 'pending');
				elementRef.classList.toggle('ready', status === 'ready');
				elementRef.classList.toggle('error', status === 'error');
				if (status === 'pending') finishedResolvers = Promise.withResolvers();
				else if (status === 'ready') finishedResolvers.resolve();
				else if (status === 'error') finishedResolvers.reject();
				logger.debug(`THUNDEROUS-CSR: View status updated to "${status}" for "${elementRef.id}"`);
			});

			// Define navigation handlers
			const handleNavigate = (event: NavigateEvent) => {
				if (!event.canIntercept || getStatus() === 'pending' || event.navigationType === 'reload') {
					return;
				}

				setStatus('pending');
				event.intercept({
					async handler() {
						const destinationDocument = await state.destResolvers.promise;
						const viewTagName = viewRegistry.getTagName(View) ?? 't-view';
						const selector = `${viewTagName}#${elementRef.id}`;
						const destinationViewElement = destinationDocument.body.querySelector(selector);

						if (destinationViewElement === null) {
							logger.log(
								`THUNDEROUS-CSR: View not found in destination document for "${elementRef.id}" -- this view will be removed from the DOM`,
							);
							elementRef.remove();
						} else {
							// Partial DOM patch using view transitions
							await document.startViewTransition(() => {
								// Clone each child node of the view -- avoid cloning the view itself,
								// since doing so will trigger the component lifecycle again and
								// clutter the console with extra noise.
								const childNodes = Array.from(destinationViewElement.childNodes).map((n) => n.cloneNode(true));
								elementRef.replaceChildren(...childNodes);
								logger.debug(`THUNDEROUS-CSR: Replaced view content for "${elementRef.id}"`);
							}).updateCallbackDone;
						}
						// Mark this view as ready so the global handler's
						// await Promise.all(viewPromises) can proceed.
						setStatus('ready');
					},
				});
			};
			const handleSuccess = () => {
				navigation.transition?.finished.then(() => setStatus('ready'));
			};
			const handleError = () => setStatus('error');

			// Attach navigation handlers when this element is added to the DOM.
			connectedCallback(() => {
				navigation.addEventListener('navigate', handleNavigate);
				navigation.addEventListener('navigatesuccess', handleSuccess);
				navigation.addEventListener('navigateerror', handleError);
				setStatus('ready');
				logger.debug(`THUNDEROUS-CSR: View connected for "${elementRef.id}"`);
			});

			// Detach all navigation handlers when this element is removed from the DOM
			// to avoid stacking them up, since this affects the global navigation object.
			disconnectedCallback(() => {
				navigation.removeEventListener('navigate', handleNavigate);
				navigation.removeEventListener('navigatesuccess', handleSuccess);
				navigation.removeEventListener('navigateerror', handleError);
				logger.debug(`THUNDEROUS-CSR: View disconnected for "${elementRef.id}"`);
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
).register(viewRegistry);

export interface ViewElement extends HTMLElement {
	new (): ViewElement;
	readonly status: 'pending' | 'ready' | 'error';
	readonly finished: Promise<void>;
}
