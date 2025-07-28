import type { Signal, SignalGetter, SignalOptions, SignalSetter, Effect } from './types';

let ident: object | null = null;

const effects = new WeakMap<object, { fn: Effect; value: unknown }>();

/**
 * Create a signal with an initial value.
 * @example
 * ```ts
 * const [getCount, setCount] = createSignal(0);
 * const increment = () => setCount(getCount() + 1);
 * const decrement = () => setCount(getCount() - 1);
 * ```
 */
export const createSignal = <T = undefined>(initVal?: T, options?: SignalOptions): Signal<T> => {
	const subscribers = new Set<object>();
	let value = initVal as T;
	const getter: SignalGetter<T> = (getterOptions) => {
		if (ident !== null) {
			subscribers.add(ident);
		}
		if (options?.debugMode === true || getterOptions?.debugMode === true) {
			let label = 'anonymous signal';
			if (options?.label !== undefined) {
				label = `(${options.label})`;
				if (getterOptions?.label !== undefined) {
					label += ` ${getterOptions.label}`;
				}
			} else if (getterOptions?.label !== undefined) {
				label = getterOptions.label;
			}
			console.log('Signal retrieved:', {
				value,
				subscribers: Array.from(subscribers).map((sym) => effects.get(sym)),
				label,
			});
		}
		return value;
	};
	getter.getter = true;
	let stackLength = 0;
	const setter: SignalSetter<T> = (newValue, setterOptions) => {
		stackLength++;
		queueMicrotask(() => stackLength--);
		if (stackLength > 1000) {
			console.error(new Error('Signal setter stack overflow detected. Possible infinite loop. Bailing out.'));
			stackLength = 0;
			return;
		}
		const isObject = typeof newValue === 'object' && newValue !== null;

		// If the value is the same, do not notify subscribers.
		if (!isObject && value === newValue) return;

		// If both values are plain object or array literals, check for deep equality.
		//     NOTE: This may be okay as an unrelated effort to reduce excess calls,
		//     but it's a bandaid on the problem of a stack overflow bug in some setters.
		if (isObject && typeof value === 'object' && value !== null) {
			const isPlainObject = (obj: unknown) =>
				typeof obj === 'object' && obj !== null && Object.getPrototypeOf(obj) === Object.prototype;
			if (isPlainObject(value) && isPlainObject(newValue)) {
				if (JSON.stringify(value) === JSON.stringify(newValue)) return;
			}
		}

		const oldValue = value;
		value = newValue;
		for (const sym of subscribers) {
			const effectRef = effects.get(sym);
			if (effectRef !== undefined) {
				try {
					effectRef.fn({
						lastValue: effectRef.value,
						destroy: () => {
							effects.delete(sym);
							queueMicrotask(() => subscribers.delete(sym));
						},
					});
				} catch (error) {
					console.error('Error in subscriber:', { error, oldValue, newValue, fn: effectRef.fn });
				}
			} else {
				// Cleanup any stale subscribers, queued to avoid breaking the `for` loop
				queueMicrotask(() => subscribers.delete(sym));
			}
		}
		if (options?.debugMode === true || setterOptions?.debugMode === true) {
			let label = 'anonymous signal';
			if (options?.label !== undefined) {
				label = `(${options.label})`;
				if (setterOptions?.label !== undefined) {
					label += ` ${setterOptions.label}`;
				}
			} else if (setterOptions?.label !== undefined) {
				label = setterOptions.label;
			}
			console.log('Signal set:', {
				oldValue,
				newValue,
				subscribers: Array.from(subscribers).map((sym) => effects.get(sym)),
				label,
			});
		}
	};
	return [getter, setter];
};

/**
 * Create a derived signal that depends on other signals.
 * @example
 * ```ts
 * const [getCount, setCount] = createSignal(0);
 * const doubleCount = derived(() => getCount() * 2);
 * ```
 */
export const derived = <T>(fn: () => T, options?: SignalOptions): SignalGetter<T> => {
	const [getter, setter] = createSignal<T>(undefined, options);
	createEffect(() => {
		try {
			setter(fn());
		} catch (error) {
			console.error('Error in derived signal:', { error, fn });
		}
	});
	return getter;
};

/**
 * Create an effect that runs when signals change.
 * @example
 * ```ts
 * const [getCount, setCount] = createSignal(0);
 * createEffect(() => {
 *  console.log('Count:', getCount());
 * });
 * ```
 */
export const createEffect = <T = unknown>(fn: Effect<T>, value?: T) => {
	const privateIdent = (ident = {});
	effects.set(ident, { fn, value });
	try {
		fn({
			lastValue: value as T,
			destroy: () => {
				effects.delete(privateIdent);
			},
		});
	} catch (error) {
		console.error('Error in effect:', { error, fn });
	}
	ident = null;
};
