import { isServer } from './server-side';
import { createEffect } from './signals';
import type { ElementParent, Styles, SignalGetter, AnyFn } from './types';
import { queryChildren, queryComment } from './utilities';

const CALLBACK_BINDING_REGEX = /(\{\{callback:.+\}\})/;
const LEGACY_CALLBACK_BINDING_REGEX = /(this.getRootNode\(\).host.__customCallbackFns.get\('.+'\)\(event\))/;
const SIGNAL_BINDING_REGEX = /(\{\{signal:.+\}\})/;
const FRAGMENT_ATTRIBUTE = '___thunderous-fragment';

export const renderState = {
	currentShadowRoot: null as ShadowRoot | null,
	signalMap: new Map<string, SignalGetter<unknown>>(),
	callbackMap: new Map<string, AnyFn>(),
	fragmentMap: new Map<string, DocumentFragment>(),
	childrenMap: new Map<DocumentFragment, Node[]>(),
	propertyMap: new Map<string, string>(),
	registry: typeof customElements !== 'undefined' ? customElements : ({} as CustomElementRegistry),
};

const logPropertyWarning = (propName: string, element: Element) => {
	console.warn(
		`Property "${propName}" does not exist on element:`,
		element,
		'\n\nThunderous will attempt to set the property anyway, but this may result in unexpected behavior. Please make sure the property exists on the element prior to setting it.',
	);
};

const asNodeList = (value: unknown, parent: ElementParent): Node[] => {
	if (typeof value === 'string') return [new Text(value)];
	if (value instanceof DocumentFragment) return [...value.children];
	if (Array.isArray(value)) {
		const nodeList: Node[] = [];
		let count = 0;
		const keys = new Set<string>();
		for (const item of value) {
			const cachedItem = item instanceof DocumentFragment ? renderState.childrenMap.get(item) : undefined;
			const children = cachedItem ?? asNodeList(item, parent);
			if (cachedItem === undefined && item instanceof DocumentFragment) {
				renderState.childrenMap.set(item, children);
			}
			if (children.length > 1) {
				console.error(
					'When rendering arrays, fragments must contain only one top-level element at a time. Error occured in:',
					parent,
				);
			}
			const child = children[0];
			if (child === null || !(child instanceof Element)) continue;
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
			nodeList.push(...children);
		}
		return nodeList;
	}
	return [new Text()];
};

// Handle each interpolated value and convert it to a string.
// Binding is done only after the combined HTML string is parsed into a DocumentFragment.
const processValue = (value: unknown): string => {
	if (!isServer && value instanceof DocumentFragment) {
		const uniqueKey = crypto.randomUUID();
		renderState.fragmentMap.set(uniqueKey, value);
		return `<div ${FRAGMENT_ATTRIBUTE}="${uniqueKey}"></div>`;
	}
	if (typeof value === 'function' && 'getter' in value && value.getter === true) {
		const getter = value as SignalGetter<unknown>;
		const uniqueKey = crypto.randomUUID();
		renderState.signalMap.set(uniqueKey, getter);
		let result = getter();
		if (Array.isArray(result)) {
			result = result.map((item: unknown) => processValue(item)).join('');
		}
		return isServer ? String(result) : `{{signal:${uniqueKey}}}`;
	}
	if (typeof value === 'function') {
		const uniqueKey = crypto.randomUUID();
		renderState.callbackMap.set(uniqueKey, value as AnyFn);
		return isServer ? String(value()) : `{{callback:${uniqueKey}}}`;
	}
	return String(value);
};

// Bind signals and callbacks to DOM nodes in a DocumentFragment.
const evaluateBindings = (element: ElementParent, fragment: DocumentFragment) => {
	for (const child of [...element.childNodes]) {
		if (child instanceof Text && SIGNAL_BINDING_REGEX.test(child.data)) {
			const textList = child.data.split(SIGNAL_BINDING_REGEX);
			const nextSibling = child.nextSibling;
			const prevSibling = child.previousSibling;
			textList.forEach((text, i) => {
				const uniqueKey = SIGNAL_BINDING_REGEX.test(text) ? text.replace(/\{\{signal:(.+)\}\}/, '$1') : undefined;
				const signal = uniqueKey !== undefined ? renderState.signalMap.get(uniqueKey) : undefined;
				const newValue = signal !== undefined ? signal() : text;
				const initialChildren = asNodeList(newValue, element);

				// there is only one text node, originally, so we have to replace it before inserting additional nodes
				if (i === 0) {
					child.replaceWith(...initialChildren);
				} else {
					const endAnchor = queryComment(element, `${uniqueKey}:end`) ?? nextSibling;
					if (endAnchor !== null) {
						endAnchor.before(...initialChildren);
					} else {
						element.append(...initialChildren);
					}
				}

				if (uniqueKey === undefined) return;

				const startAnchor = document.createComment(`${uniqueKey}:start`);
				if (prevSibling !== null) {
					prevSibling.after(startAnchor);
				} else {
					element.prepend(startAnchor);
				}
				const endAnchor = document.createComment(`${uniqueKey}:end`);
				if (nextSibling !== null) {
					nextSibling.before(endAnchor);
				} else {
					element.append(endAnchor);
				}

				const bindText = (node: Text, signal: SignalGetter<unknown>) => {
					createEffect(({ destroy }) => {
						const result = signal();

						// If the type of the result changes, destroy this effect in favor of the appropriate one.
						if (Array.isArray(result)) {
							destroy();
							bindArray(signal);
							return;
						}
						if (result instanceof DocumentFragment) {
							destroy();
							bindFragment(signal);
							return;
						}

						// Handle the string content of the text node.
						node.data = result === null ? '' : String(result);
					});
				};

				const bindArray = (signal: SignalGetter<unknown>) => {
					createEffect(
						({ lastValue: oldChildren, destroy }) => {
							const result = signal();
							console.trace('Binding array:', {
								result: (result as Node[]).map((node) => node.cloneNode(true)),
								oldChildren,
							});
							const newChildren = asNodeList(result, element);
							const firstChild = newChildren[0];

							// If the type of the result changes, destroy this effect in favor of the appropriate one.
							if (!Array.isArray(result) && newChildren.length === 1 && firstChild instanceof DocumentFragment) {
								destroy();
								bindFragment(signal);
								return;
							}
							if (newChildren.length === 1 && firstChild instanceof Text) {
								destroy();
								bindText(firstChild, signal);
								return;
							}

							// Remove all previous children between the anchor comments.
							while (startAnchor.nextSibling !== endAnchor) {
								startAnchor.nextSibling?.remove();
							}

							// Insert the new children after the start anchor.
							startAnchor.after(...newChildren);
							if (oldChildren === null) return newChildren;

							// If there are previous children, we need to persist their instances to avoid losing references.
							for (const persistedChild of oldChildren) {
								if (persistedChild instanceof Element) {
									const key = persistedChild.getAttribute('key');
									if (key === null) continue;
									const newChild = queryChildren(newChildren, `[key="${key}"]`);

									// If the new child is not found, remove the persisted child.
									if (newChild === null) {
										persistedChild.remove();
										continue;
									}

									// Remove attributes that are not present in the new child.
									for (const attr of [...persistedChild.attributes]) {
										if (!newChild.hasAttribute(attr.name)) persistedChild.removeAttribute(attr.name);
									}

									// Copy attributes from the new child to the persisted child.
									for (const newAttr of [...newChild.attributes]) {
										const oldAttrValue = persistedChild.getAttribute(newAttr.name);

										// Skip if the last attribute value is a custom callback. It's important to maintain the original callback key.
										if (oldAttrValue?.startsWith('this.__customCallbackFns')) continue;
										persistedChild.setAttribute(newAttr.name, newAttr.value);
									}
									newChild.replaceWith(persistedChild);
								}
							}

							// Return to manage the previous children in the next effect run.
							return newChildren;
						},
						null as Node[] | null,
					);
				};

				const bindFragment = (signal: SignalGetter<unknown>) => {
					const initialFragment = signal() as DocumentFragment;
					renderState.childrenMap.set(initialFragment, [...initialFragment.childNodes]);
					createEffect(({ destroy }) => {
						const result = signal();
						const cachedChildren = renderState.childrenMap.get(initialFragment);
						const children = cachedChildren ?? asNodeList(result, element);

						// If the type of the result changes, destroy this effect in favor of the appropriate one.
						if (Array.isArray(result)) {
							destroy();
							bindArray(signal);
							return;
						}
						if (result instanceof Text) {
							const children = asNodeList(result, element);
							const text = children[0] as Text;
							destroy();
							bindText(text, signal);
							return;
						}
						while (startAnchor.nextSibling !== endAnchor) {
							startAnchor.nextSibling?.remove();
						}
						startAnchor.after(...children);
					});
				};

				// evaluate signals and subscribe to them
				if (signal !== undefined) {
					if (Array.isArray(newValue)) {
						bindArray(signal);
					} else if (initialChildren instanceof DocumentFragment) {
						bindFragment(signal);
					} else {
						const initialChild = initialChildren[0] as Text;
						bindText(initialChild, signal);
					}
				}
			});
		}
		if (child instanceof Element && child.hasAttribute(FRAGMENT_ATTRIBUTE)) {
			const uniqueKey = child.getAttribute(FRAGMENT_ATTRIBUTE)!;
			const childFragment = renderState.fragmentMap.get(uniqueKey);
			if (childFragment !== undefined) {
				child.replaceWith(childFragment);
			}
		} else if (child instanceof Element) {
			for (const attr of [...child.attributes]) {
				const attrName = attr.name;
				if (SIGNAL_BINDING_REGEX.test(attr.value)) {
					const textList = attr.value.split(SIGNAL_BINDING_REGEX);
					let prevText = attr.value;
					createEffect(() => {
						let newText = '';
						let hasNull = false;
						let signal: SignalGetter<unknown> | undefined;
						for (const text of textList) {
							const uniqueKey = text.replace(/\{\{signal:(.+)\}\}/, '$1');
							if (signal === undefined) {
								signal = uniqueKey !== text ? renderState.signalMap.get(uniqueKey) : undefined;
								const value = signal !== undefined ? signal() : text;
								if (value === null) hasNull = true;
								newText += String(value);
							} else {
								newText += text;
							}
						}
						if ((hasNull && newText === 'null') || attrName.startsWith('prop-id:')) {
							if (child.hasAttribute(attrName)) child.removeAttribute(attrName);
						} else {
							if (newText !== prevText) child.setAttribute(attrName, newText);
						}
						if (attrName.startsWith('prop-id:')) {
							if (child.hasAttribute(attrName)) child.removeAttribute(attrName);
							const propId = attrName.replace('prop-id:', '');
							const propName = renderState.propertyMap.get(propId);
							if (propName === undefined) {
								console.error(
									`BRANCH:SIGNAL; Property ID "${propId}" does not exist in the property map. This is likely a problem with Thunderous. Report a bug if you see this message. https://github.com/Thunder-Solutions/Thunderous/issues`,
									child,
								);
								return;
							}
							const newValue = hasNull && newText === 'null' ? null : newText;
							if (!(propName in child)) logPropertyWarning(propName, child);
							// @ts-expect-error // the above warning should suffice for developers
							child[propName] = signal !== undefined ? signal() : newValue;
						}
						prevText = newText;
					});
				} else if (LEGACY_CALLBACK_BINDING_REGEX.test(attr.value)) {
					const getRootNode = child.getRootNode.bind(child);
					child.getRootNode = () => {
						const rootNode = getRootNode();
						return rootNode instanceof ShadowRoot ? rootNode : fragment;
					};
				} else if (CALLBACK_BINDING_REGEX.test(attr.value)) {
					const textList = attr.value.split(CALLBACK_BINDING_REGEX);
					createEffect(() => {
						child.__customCallbackFns = child.__customCallbackFns ?? new Map();
						let uniqueKey = '';
						for (const text of textList) {
							const _uniqueKey = text.replace(/\{\{callback:(.+)\}\}/, '$1');
							if (_uniqueKey !== text) uniqueKey = _uniqueKey;
							const callback = uniqueKey !== text ? renderState.callbackMap.get(uniqueKey) : undefined;
							if (callback !== undefined) {
								child.__customCallbackFns.set(uniqueKey, callback);
							}
						}
						if (uniqueKey !== '' && !attrName.startsWith('prop-id:')) {
							child.setAttribute(attrName, `this.__customCallbackFns.get('${uniqueKey}')(event)`);
						} else if (attrName.startsWith('prop-id:')) {
							child.removeAttribute(attrName);
							const propId = attrName.replace('prop-id:', '');
							const propName = renderState.propertyMap.get(propId);
							if (propName === undefined) {
								console.error(
									`BRANCH:CALLBACK; Property ID "${propId}" does not exist in the property map. This is likely a problem with Thunderous. Report a bug if you see this message. https://github.com/Thunder-Solutions/Thunderous/issues`,
									child,
								);
								return;
							}
							if (!(propName in child)) logPropertyWarning(propName, child);
							// @ts-expect-error // the above warning should suffice for developers
							child[propName] = child.__customCallbackFns.get(uniqueKey);
						}
					});
				} else if (attrName.startsWith('prop-id:')) {
					child.removeAttribute(attrName);
					const propId = attrName.replace('prop-id:', '');
					const propName = renderState.propertyMap.get(propId);
					if (propName === undefined) {
						console.error(
							`BRANCH:PROP; Property ID "${propId}" does not exist in the property map. This is likely a problem with Thunderous. Report a bug if you see this message. https://github.com/Thunder-Solutions/Thunderous/issues`,
							child,
						);
						return;
					}
					if (!(propName in child)) logPropertyWarning(propName, child);
					// @ts-expect-error // the above warning should suffice for developers
					child[propName] = attr.value;
				}
			}

			evaluateBindings(child, fragment);
		}
	}
};

/**
 * A tagged template function for creating DocumentFragment instances.
 */
export const html = (strings: TemplateStringsArray, ...values: unknown[]): DocumentFragment => {
	// Combine the strings and values into a single HTML string
	let innerHTML = strings.reduce((innerHTML, str, i) => {
		let value: unknown = values[i] ?? '';
		if (Array.isArray(value)) {
			value = value.map((item) => processValue(item)).join('');
		} else {
			value = processValue(value);
		}
		innerHTML += str + String(value === null ? '' : value);
		return innerHTML;
	}, '');

	// @ts-expect-error // return a plain string for server-side rendering
	if (isServer) return innerHTML;

	// Track properties in the render state while the HTML is still a string,
	// since everything converts to lowercase after parsing as a DOM fragment.
	const props = innerHTML.match(/prop:([^=]+)/g);
	if (props !== null) {
		for (const prop of props) {
			const name = prop.split(':')[1].trim();
			const id = crypto.randomUUID();
			const newProp = `prop-id:${id}`;
			renderState.propertyMap.set(id, name);
			innerHTML = innerHTML.replace(`prop:${name}`, newProp);
		}
	}

	// Parse the HTML string into a DocumentFragment
	const template = document.createElement('template');
	template.innerHTML = innerHTML;
	const fragment =
		renderState.currentShadowRoot?.importNode?.(template.content, true) ?? document.importNode(template.content, true);

	// Ensure the DocumentFragment is upgraded before binding to properties
	renderState.registry.upgrade(fragment);

	// Bind signals and callbacks to the DocumentFragment
	evaluateBindings(fragment, fragment);

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
			console.error('Objects are not valid in CSS values. Received:', value);
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
			stylesheet.replaceSync(newCSSText);
		} else {
			stylesheet.textContent = newCSSText;
		}
	});
	return stylesheet;
};
