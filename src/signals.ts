import type { Signal, SignalGetter, SignalOptions, SignalSetter } from './types';

let subscriber: (() => void) | null = null;
const updateQueue = new Set<() => void>();
let isBatchingUpdates = false;

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
	const subscribers = new Set<() => void>();
	let value = initVal as T;
	const getter: SignalGetter<T> = (getterOptions) => {
		if (subscriber !== null) {
			subscribers.add(subscriber);
		}
		if (options?.debugMode === true || getterOptions?.debugMode === true) {
			queueMicrotask(() => {
				let label = 'anonymous signal';
				if (options?.label !== undefined) {
					label = `(${options.label})`;
					if (getterOptions?.label !== undefined) {
						label += ` ${getterOptions.label}`;
					}
				} else if (getterOptions?.label !== undefined) {
					label = getterOptions.label;
				}
				console.log('Signal retrieved:', { value, subscribers, label });
			});
		}
		return value;
	};
	const setter: SignalSetter<T> = (newValue, setterOptions) => {
		const isObject = typeof newValue === 'object' && newValue !== null;
		if (!isObject && value === newValue) return;
		const oldValue = value;
		value = newValue;
		for (const fn of subscribers) {
			updateQueue.add(fn);
		}
		if (!isBatchingUpdates) {
			isBatchingUpdates = true;
			queueMicrotask(() => {
				for (const fn of updateQueue) {
					try {
						fn();
					} catch (error) {
						console.error('Error in subscriber:', { error, oldValue, newValue, fn });
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
					console.log('Signal set:', { oldValue, newValue, subscribers, label });
				}
				updateQueue.clear();
				isBatchingUpdates = false;
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
export const derived = <T>(fn: () => T): SignalGetter<T> => {
	const [getter, setter] = createSignal<T>();
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
export const createEffect = (fn: () => void) => {
	subscriber = fn;
	try {
		fn();
	} catch (error) {
		console.error('Error in effect:', { error, fn });
	}
	subscriber = null;
};
