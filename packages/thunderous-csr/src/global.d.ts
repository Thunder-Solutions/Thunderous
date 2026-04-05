declare var navigation: Navigation;
declare var trustedTypes: TrustedTypePolicyFactory;

/**
 * The global Document API according to the latest spec.
 * This extension adds typing for the following widely supported features that are missing from lib-dom's types:
 *
 * - `parseHTMLUnsafe()` should accept either a string OR a `TrustedHTML` object.
 *   [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Document/parseHTMLUnsafe_static#input)
 *
 * ---
 *
 * **Original `Document` documentation:**
 *
 * ```ts
 * var Document: {
 *   new (): Document;
 *   prototype: Document;
 *   parseHTMLUnsafe(html: string): Document;
 * }
 * ```
 *
 * The **`Document`** interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Document)
 */
interface DocumentConstructor extends Document {
	new (): Document;
	/**
	 * The parseHTMLUnsafe() static method of the Document object is used to parse an HTML input, optionally filtering unwanted HTML elements and attributes, in order to create a new Document instance.
	 *
	 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Document/parseHTMLUnsafe_static)
	 */
	parseHTMLUnsafe(html: string | TrustedHTML): Document;
}

declare var __GLOBAL_THUNDEROUS_VIEW_REGISTERED: boolean;
declare var __GLOBAL_THUNDEROUS_LOGGER_DISABLED: boolean;

declare type AnyFunction = (...args: any[]) => any;
