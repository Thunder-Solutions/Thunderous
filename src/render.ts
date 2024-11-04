import { parseFragment, ElementParent } from './html-helpers';
import { createEffect } from './signals';

declare global {
	interface Element {
		__findHost: () => Element;
	}
}

export const html = (strings: TemplateStringsArray, ...values: unknown[]): DocumentFragment => {
	let innerHTML = '';
	const signalMap = new Map();
	strings.forEach((string, i) => {
		let value = values[i] ?? '';
		if (typeof value === 'function') {
			const uniqueKey = crypto.randomUUID();
			signalMap.set(uniqueKey, value);
			value = `{{signal:${uniqueKey}}}`;
		}
		innerHTML += string + String(value);
	});
	const fragment = parseFragment(innerHTML);
	const callbackBindingRegex = /(\{\{callback:.+\}\})/;
	const signalBindingRegex = /(\{\{signal:.+\}\})/;
	const parseChildren = (element: ElementParent) => {
		for (const child of element.childNodes) {
			if (child instanceof Text && signalBindingRegex.test(child.data)) {
				const textList = child.data.split(signalBindingRegex);
				textList.forEach((text, i) => {
					const uniqueKey = text.replace(/\{\{signal:(.+)\}\}/, '$1');
					const signal = uniqueKey !== text ? signalMap.get(uniqueKey) : null;
					const newText = signal !== null ? signal() : text;
					const newNode = new Text(newText);
					if (i === 0) {
						child.replaceWith(newNode);
					} else {
						element.insertBefore(newNode, child.nextSibling);
					}
					if (signal !== null) {
						createEffect(() => {
							newNode.data = signal();
						});
					}
				});
			}
			if (child instanceof Element) {
				for (const attr of child.attributes) {
					if (signalBindingRegex.test(attr.value)) {
						const textList = attr.value.split(signalBindingRegex);
						createEffect(() => {
							let newText = '';
							let hasNull = false;
							for (const text of textList) {
								const uniqueKey = text.replace(/\{\{signal:(.+)\}\}/, '$1');
								const signal = uniqueKey !== text ? signalMap.get(uniqueKey) : null;
								const value = signal !== null ? signal() : text;
								if (value === null) hasNull = true;
								newText += value;
							}
							if (hasNull && newText === 'null') {
								child.removeAttribute(attr.name);
							} else {
								child.setAttribute(attr.name, newText);
							}
						});
					} else if (callbackBindingRegex.test(attr.value)) {
						const getRootNode = child.getRootNode.bind(child);
						child.getRootNode = () => {
							const rootNode = getRootNode();
							return rootNode instanceof ShadowRoot ? rootNode : fragment;
						};
						const uniqueKey = attr.value.replace(/\{\{callback:(.+)\}\}/, '$1');
						child.setAttribute(attr.name, `this.getRootNode().host.__customCallbackFns.get('${uniqueKey}')(event)`);
					}
				}
				parseChildren(child);
			}
		}
	};
	parseChildren(fragment);
	return fragment;
};

const adoptedStylesSupported: boolean =
	typeof window !== 'undefined' &&
	window.ShadowRoot?.prototype.hasOwnProperty('adoptedStyleSheets') &&
	window.CSSStyleSheet?.prototype.hasOwnProperty('replace');

// This should be a string if constructible stylesheets are not supported
export type Styles = CSSStyleSheet | HTMLStyleElement;

export const isCSSStyleSheet = (stylesheet?: Styles): stylesheet is CSSStyleSheet => {
	return typeof CSSStyleSheet !== 'undefined' && stylesheet instanceof CSSStyleSheet;
};

export const css = (strings: TemplateStringsArray, ...values: unknown[]): Styles => {
	let cssText = '';
	const signalMap = new Map();
	const signalBindingRegex = /(\{\{signal:.+\}\})/;
	strings.forEach((string, i) => {
		let value = values[i] ?? '';
		if (typeof value === 'function') {
			const uniqueKey = crypto.randomUUID();
			signalMap.set(uniqueKey, value);
			value = `{{signal:${uniqueKey}}}`;
		}
		cssText += string + String(value);
	});
	let stylesheet = adoptedStylesSupported ? new CSSStyleSheet() : document.createElement('style');
	const textList = cssText.split(signalBindingRegex);
	createEffect(() => {
		const newCSSTextList: string[] = [];
		for (const text of textList) {
			const uniqueKey = text.replace(/\{\{signal:(.+)\}\}/, '$1');
			const signal = uniqueKey !== text ? signalMap.get(uniqueKey) : null;
			const newText = signal !== null ? signal() : text;
			newCSSTextList.push(newText);
		}
		const newCSSText = newCSSTextList.join('');
		if (isCSSStyleSheet(stylesheet)) {
			stylesheet.replace(newCSSText);
		} else {
			stylesheet.textContent = newCSSText;
		}
	});
	return stylesheet;
};
