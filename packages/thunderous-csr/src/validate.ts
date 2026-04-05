/**
 * Load the destination page in a hidden iframe, let all scripts run and
 * custom elements upgrade, then capture the resulting body innerHTML.
 * This gives us high confidence that we're comparing against the real
 * client-rendered output.
 */
const getConnectedHTML = async (destinationUrl: string) => {
	// A hidden iframe loads the destination page so we can run ALL scripts
	// against an isolated global environment and capture the resulting DOM.
	// Disruptive APIs (alert, confirm, open, console, etc.) are overridden
	// on the iframe's contentWindow after load instead of using sandbox,
	// which either blocks same-origin requests or logs a noisy warning.
	//    NOTE: This will be made much easier by the ShadowRealm API when it lands in browsers...
	const iframe = document.createElement('iframe');
	iframe.style.display = 'none';
	iframe.src = destinationUrl;

	const { promise, resolve } = Promise.withResolvers<string>();

	iframe.addEventListener('load', () => {
		const iframeWindow = iframe.contentWindow!;

		// Override potentially disruptive APIs so the end user
		// doesn't even notice this stuff happening.
		iframeWindow.alert = () => {};
		iframeWindow.confirm = () => true;
		iframeWindow.prompt = () => '';
		iframeWindow.print = () => {};
		iframeWindow.open = () => null;

		// Silence any manual logging going forward
		const iframeGlobal = iframeWindow as unknown as typeof globalThis;
		const oldConsole = iframeGlobal.console;
		iframeGlobal.console = new Proxy(oldConsole, {
			get: (target, key) => {
				const value = target[key as keyof typeof target];
				if (typeof value === 'function') return () => {};
				return value;
			},
		});

		// Wait a tick for connectedCallbacks to finish, then capture the body
		queueMicrotask(() => {
			requestAnimationFrame(() => {
				resolve(iframe.contentDocument!.body.innerHTML);
				iframe.remove();
			});
		});
	});

	// appending the iframe triggers the page load
	document.body.append(iframe);

	return promise;
};

type ValidateHTMLResult = {
	valid: boolean;
	htmlSrc: string;
	htmlDest: string;
};

/**
 * Validates that the current document fully matches the destination HTML.
 *
 * If it does NOT match, a warning is logged and the entire document is replaced,
 * rather than only replacing the views.
 */
export const validateHTML = async (destinationUrl: string): Promise<ValidateHTMLResult> => {
	const normalize = (str: string) => str.trim().replace(/\n+|\s+/gm, ' ');

	// normalize the whitespace on both sides
	const htmlSrc = normalize(document.body.innerHTML);
	const htmlDest = normalize(await getConnectedHTML(destinationUrl));

	// Return the validity and both parsed HTML strings
	return { valid: htmlSrc === htmlDest, htmlSrc, htmlDest };
};
