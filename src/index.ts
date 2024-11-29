export { customElement } from './custom-element';
export { createRegistry } from './registry';
export { onServerDefine, insertTemplates } from './server-side';
export { createEffect, createSignal, derived } from './signals';
export { html, css } from './render';

export type {
	RenderFunction,
	RenderArgs,
	/**
	 * @deprecated Use `RenderArgs` instead.
	 */
	RenderArgs as RenderProps,
	Signal,
	SignalGetter,
	SignalSetter,
} from './types';
