import { isServer } from './server-side';
import { createEffect } from './signals';
import type { ElementParent, Styles, SignalGetter, AnyFn } from './types';

export const renderState = {
	currentShadowRoot: null as ShadowRoot | null,
};

export const clearHTML = (element: ElementParent) => {
	while (element.childNodes.length > 0) {
		element.childNodes[0].remove();
	}
};

export const parseFragment = (htmlStr: string): DocumentFragment => {
	const template = document.createElement('template');
	template.innerHTML = htmlStr;
	const fragment =
		renderState.currentShadowRoot === null
			? template.content
			: renderState.currentShadowRoot.importNode(template.content, true);
	return fragment;
};

const logValueError = (value: unknown) => {
	console.error(
		'An invalid value was passed to a template function. Non-primitive values are not supported.\n\nValue:\n',
		value,
	);
};

const arrayToDocumentFragment = (array: unknown[], parent: ElementParent) => {
	const documentFragment = new DocumentFragment();
	let count = 0;
	const keys = new Set<string>();
	for (const item of array) {
		const node = getNewNode(item, parent).cloneNode(true);
		if (node instanceof DocumentFragment) {
			const child = node.firstElementChild;
			if (node.children.length > 1) {
				console.error(
					'When rendering arrays, fragments must contain only one top-level element at a time. Error occured in:',
					parent,
				);
			}
			if (child === null) continue;
			let key = child.getAttribute('key');
			if (key === null) {
				console.warn(
					'When rendering arrays, a `key` attribute should be provided on each child element. An index was automatically applied, but this could result in unexpected behavior:',
					child,
				);
				key = String(count);
				child.setAttribute('key', key);
			}
			if (keys.has(key)) {
				console.warn(
					`When rendering arrays, each child should have a unique \`key\` attribute. Duplicate key "${key}" found on:`,
					child,
				);
			}
			keys.add(key);
			count++;
		}
		documentFragment.append(node);
	}
	return documentFragment;
};

const getNewNode = (value: unknown, parent: ElementParent) => {
	if (typeof value === 'string') return new Text(value);
	if (Array.isArray(value)) return arrayToDocumentFragment(value, parent);
	if (value instanceof DocumentFragment) return value;
	return new Text('');
};

export const html = (strings: TemplateStringsArray, ...values: unknown[]): DocumentFragment => {
	let innerHTML = '';
	const signalMap = new Map<string, SignalGetter<unknown>>();
	const callbackMap = new Map<string, AnyFn>();
	const processValue = (value: unknown): string => {
		if (!isServer && value instanceof DocumentFragment) {
			const tempDiv = document.createElement('div');
			tempDiv.append(value.cloneNode(true));
			return tempDiv.innerHTML;
		}
		if (typeof value === 'function' && 'getter' in value && value.getter === true) {
			const getter = value as SignalGetter<unknown>;
			const uniqueKey = crypto.randomUUID();
			signalMap.set(uniqueKey, getter);
			let result = getter();
			if (Array.isArray(result)) {
				result = result.map((item: unknown) => processValue(item)).join('');
			}
			return isServer ? String(result) : `{{signal:${uniqueKey}}}`;
		}
		if (typeof value === 'function') {
			const uniqueKey = crypto.randomUUID();
			callbackMap.set(uniqueKey, value as AnyFn);
			return isServer ? String(value()) : `{{callback:${uniqueKey}}}`;
		}
		if (typeof value === 'object' && value !== null) {
			logValueError(value);
			return '';
		}
		return String(value);
	};
	strings.forEach((string, i) => {
		let value: unknown = values[i] ?? '';
		if (Array.isArray(value)) {
			value = value.map((item) => processValue(item)).join('');
		} else {
			value = processValue(value);
		}
		innerHTML += string + String(value === null ? '' : value);
	});
	if (isServer) {
		// @ts-expect-error // return a plain string for server-side rendering
		return innerHTML;
	}
	const fragment = parseFragment(innerHTML);
	const callbackBindingRegex = /(\{\{callback:.+\}\})/;
	const legacyCallbackBindingRegex = /(this.getRootNode\(\).host.__customCallbackFns.get\('.+'\)\(event\))/;
	const signalBindingRegex = /(\{\{signal:.+\}\})/;
	const parseChildren = (element: ElementParent) => {
		for (const child of element.childNodes) {
			if (child instanceof Text && signalBindingRegex.test(child.data)) {
				const textList = child.data.split(signalBindingRegex);
				const sibling = child.nextSibling;
				textList.forEach((text, i) => {
					const uniqueKey = text.replace(/\{\{signal:(.+)\}\}/, '$1');
					const signal = uniqueKey !== text ? signalMap.get(uniqueKey) : undefined;
					const newValue = signal !== undefined ? signal() : text;
					const newNode = getNewNode(newValue, element);

					// there is only one text node, originally, so we have to replace it before inserting additional nodes
					if (i === 0) {
						child.replaceWith(newNode);
					} else {
						element.insertBefore(newNode, sibling);
					}

					// evaluate signals and subscribe to them
					if (signal !== undefined && newNode instanceof Text) {
						createEffect(() => {
							newNode.data = signal() as string;
						});
					} else if (signal !== undefined && newNode instanceof DocumentFragment) {
						createEffect(() => {
							const result = signal();
							const nextNode = getNewNode(result, element);
							if (nextNode instanceof Text) {
								throw new TypeError(
									'Signal mismatch: expected DocumentFragment or Array<DocumentFragment>, but got Text',
								);
							}
							let lastSibling = element.lastChild;
							for (const child of nextNode.children) {
								const key = child.getAttribute('key');
								const matchingNode = element.querySelector(`[key="${key}"]`);
								if (matchingNode === null) continue;
								lastSibling = matchingNode.nextSibling;
								child.replaceWith(matchingNode);
							}
							element.insertBefore(nextNode, lastSibling);
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
					} else if (legacyCallbackBindingRegex.test(attr.value)) {
						const getRootNode = child.getRootNode.bind(child);
						child.getRootNode = () => {
							const rootNode = getRootNode();
							return rootNode instanceof ShadowRoot ? rootNode : fragment;
						};
					} else if (callbackBindingRegex.test(attr.value)) {
						const textList = attr.value.split(callbackBindingRegex);
						createEffect(() => {
							child.__customCallbackFns = child.__customCallbackFns ?? new Map();
							let uniqueKey = '';
							for (const text of textList) {
								const _uniqueKey = text.replace(/\{\{callback:(.+)\}\}/, '$1');
								if (_uniqueKey !== text) uniqueKey = _uniqueKey;
								const callback = uniqueKey !== text ? callbackMap.get(uniqueKey) : undefined;
								if (callback !== undefined) {
									child.__customCallbackFns.set(uniqueKey, callback);
								}
							}
							if (uniqueKey !== '') {
								child.setAttribute(attr.name, `this.__customCallbackFns.get('${uniqueKey}')(event)`);
							}
						});
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
