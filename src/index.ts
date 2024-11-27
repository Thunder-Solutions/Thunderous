export { customElement, createRegistry } from './custom-element';
export { onServerDefine } from './server-side';
export { createEffect, createSignal, derived } from './signals';
export { html, css } from './render';

export type {
	RenderFunction,
	RenderArgs,
	/**
	 * @deprecated Use `RenderArgs` instead.
	 */
	RenderArgs as RenderProps,
} from './types';
export type { Signal, SignalGetter, SignalSetter } from './signals';
