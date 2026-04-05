export type ParsedDocument = DocumentFragment & {
	documentElement: HTMLHtmlElement;
	head: HTMLHeadElement;
	body: HTMLBodyElement;
};

export const parseHTML = (html: string): ParsedDocument => {
	// This is only ever going to parse same-origin content, so this will be safe to parse without sanitization.
	const originalDocument = Document.parseHTMLUnsafe(html);
	const documentElement = originalDocument.documentElement as HTMLHtmlElement;
	const body = originalDocument.body as HTMLBodyElement;
	const head = originalDocument.head;
	const fragment = new DocumentFragment();
	fragment.replaceChildren(...originalDocument.childNodes);
	for (const el of fragment.querySelectorAll(':not(:defined)')) {
		customElements.upgrade(el);
	}
	return {
		...fragment,
		documentElement,
		head,
		body,
	};
};
