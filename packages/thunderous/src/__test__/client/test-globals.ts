import * as Thunderous from '../..';

declare global {
	interface Window {
		Thunderous: typeof Thunderous;
		TestUtils: typeof TestUtils;
	}
}

const TestUtils = {
	flushPromises: () => new Promise((resolve) => setTimeout(resolve, 0)),
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
	getContentWithoutComments: (fragment: DocumentFragment): string => {
		const div = document.createElement('div');
		div.appendChild(fragment.cloneNode(true));
		// Remove signal comment anchors
		const walker = document.createTreeWalker(div, NodeFilter.SHOW_COMMENT);
		const comments: Comment[] = [];
		let comment: Comment | null;
		while ((comment = walker.nextNode() as Comment | null)) {
			if (comment?.data?.includes(':start') || comment?.data?.includes(':end')) {
				comments.push(comment);
			}
		}
		comments.forEach((c) => c.remove());
		return div.innerHTML;
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
