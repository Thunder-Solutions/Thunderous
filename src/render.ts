import { isServer } from './server-side';
import { createEffect } from './signals';
import type { ElementParent, Styles, SignalGetter } from './types';

export const clearHTML = (element: ElementParent) => {
	while (element.childNodes.length > 0) {
		element.childNodes[0].remove();
	}
};

export const parseFragment = (htmlStr: string): DocumentFragment => {
	const range = document.createRange();
	range.selectNode(document.body); // required in Safari
	return range.createContextualFragment(htmlStr);
};

export const setInnerHTML = (element: ElementParent, html: string | DocumentFragment) => {
	clearHTML(element);
	const fragment = typeof html === 'string' ? parseFragment(html) : html;
	element.append(fragment);
};

const logValueError = (value: unknown) => {
	console.error(
		'An invalid value was passed to a template function. Non-primitive values are not supported.\n\nValue:\n',
		value,
	);
};

export const html = (strings: TemplateStringsArray, ...values: unknown[]): DocumentFragment => {
	let innerHTML = '';
	const signalMap = new Map<string, SignalGetter<unknown>>();
	strings.forEach((string, i) => {
		let value: unknown = values[i] ?? '';
		if (typeof value === 'function') {
			const uniqueKey = crypto.randomUUID();
			signalMap.set(uniqueKey, value as SignalGetter<unknown>);
			value = isServer ? value() : `{{signal:${uniqueKey}}}`;
		}
		if (typeof value === 'object' && value !== null) {
			logValueError(value);
			value = '';
		}
		innerHTML += string + String(value);
	});
	if (isServer) {
		// @ts-expect-error // return a plain string for server-side rendering
		return innerHTML;
	}
	const fragment = parseFragment(innerHTML);
	const callbackBindingRegex = /(\{\{callback:.+\}\})/;
	const signalBindingRegex = /(\{\{signal:.+\}\})/;
	const parseChildren = (element: ElementParent) => {
		for (const child of element.childNodes) {
			if (child instanceof Text && signalBindingRegex.test(child.data)) {
				const textList = child.data.split(signalBindingRegex);
				textList.forEach((text, i) => {
					const uniqueKey = text.replace(/\{\{signal:(.+)\}\}/, '$1');
					const signal = uniqueKey !== text ? signalMap.get(uniqueKey) : undefined;
					const newValue = signal !== undefined ? signal() : text;
					const newNode = (() => {
						if (typeof newValue === 'string') return new Text(newValue);
						if (newValue instanceof DocumentFragment) return newValue;
						return new Text('');
					})();
					if (i === 0) {
						child.replaceWith(newNode);
					} else {
						element.insertBefore(newNode, child.nextSibling);
					}
					if (signal !== undefined && newNode instanceof Text) {
						createEffect(() => {
							newNode.data = signal() as string;
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
								const signal = uniqueKey !== text ? signalMap.get(uniqueKey) : undefined;
								const value = signal !== undefined ? signal() : text;
								if (value === null) hasNull = true;
								newText += String(value);
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

export const isCSSStyleSheet = (stylesheet?: Styles): stylesheet is CSSStyleSheet => {
	return typeof CSSStyleSheet !== 'undefined' && stylesheet instanceof CSSStyleSheet;
};

export const css = (strings: TemplateStringsArray, ...values: unknown[]): Styles => {
	let cssText = '';
	const signalMap = new Map<string, () => unknown>();
	const signalBindingRegex = /(\{\{signal:.+\}\})/;
	strings.forEach((string, i) => {
		let value: unknown = values[i] ?? '';
		if (typeof value === 'function') {
			const uniqueKey = crypto.randomUUID();
			signalMap.set(uniqueKey, value as () => unknown);
			value = isServer ? value() : `{{signal:${uniqueKey}}}`;
		}
		if (typeof value === 'object' && value !== null) {
			logValueError(value);
			value = '';
		}
		cssText += string + String(value);
	});
	if (isServer) {
		// @ts-expect-error // return a plain string for server-side rendering
		return cssText;
	}
	const stylesheet = adoptedStylesSupported ? new CSSStyleSheet() : document.createElement('style');
	const textList = cssText.split(signalBindingRegex);
	createEffect(() => {
		const newCSSTextList: string[] = [];
		for (const text of textList) {
			const uniqueKey = text.replace(/\{\{signal:(.+)\}\}/, '$1');
			const signal = uniqueKey !== text ? signalMap.get(uniqueKey)! : null;
			const newValue = signal !== null ? signal() : text;
			const newText = String(newValue);
			newCSSTextList.push(newText);
		}
		const newCSSText = newCSSTextList.join('');
		if (isCSSStyleSheet(stylesheet)) {
			stylesheet.replace(newCSSText).catch(console.error);
		} else {
			stylesheet.textContent = newCSSText;
		}
	});
	return stylesheet;
};
