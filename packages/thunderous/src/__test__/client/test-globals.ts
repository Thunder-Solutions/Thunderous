import * as Thunderous from '../..';

declare global {
	interface Window {
		Thunderous: typeof Thunderous;
		TestUtils: typeof TestUtils;
	}
}

const TestUtils = {
	getContent: (DOMOrCSS: DocumentFragment | CSSStyleSheet): string => {
		if (DOMOrCSS instanceof CSSStyleSheet) {
			return Array.from(DOMOrCSS.cssRules)
				.map((rule) => rule.cssText)
				.join('\n');
		} else if (DOMOrCSS instanceof DocumentFragment) {
			const div = document.createElement('div');
			div.appendChild(DOMOrCSS);
			return div.innerHTML;
		}
		throw new Error('Expected a DocumentFragment or CSSStyleSheet');
	},
	assertDocumentFragment: (result: unknown): DocumentFragment => {
		if (!(result instanceof DocumentFragment)) {
			throw new Error('Result was not a DocumentFragment');
		}
		return result;
	},
	assertCSSStyleSheet: (result: unknown): CSSStyleSheet => {
		if (!(result instanceof CSSStyleSheet)) {
			throw new Error('Result was not a CSSStyleSheet');
		}
		return result;
	},
};

window.Thunderous = Thunderous;
window.TestUtils = TestUtils;
