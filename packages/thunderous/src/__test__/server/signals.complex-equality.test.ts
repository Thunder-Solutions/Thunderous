import { describe, it, expect } from 'vitest';
import { createEffect, createSignal } from '../../signals';

describe('createSignal complex-value equality', () => {
	it('re-runs subscribers when a plain object is replaced with a structurally different object', () => {
		// The signal uses a JSON.stringify deep-equality bail-out for plain objects to avoid
		// unnecessary re-renders. When the stringified values DIFFER, notifications must still fire.
		const [value, setValue] = createSignal<{ count: number }>({ count: 0 });
		let runs = 0;
		createEffect(() => {
			value();
			runs++;
		});
		expect(runs).toBe(1);

		setValue({ count: 1 });
		expect(runs).toBe(2);
	});

	it('does not re-run subscribers when a non-plain object (e.g. Map) is replaced with an equal copy', () => {
		// The plain-object equality bail-out should NOT apply to non-plain objects (like Map),
		// so setting a different Map instance should still notify.
		const initial = new Map<string, number>([['a', 1]]);
		const [getter, setter] = createSignal<Map<string, number>>(initial);
		let runs = 0;
		createEffect(() => {
			getter();
			runs++;
		});
		expect(runs).toBe(1);

		const next = new Map<string, number>([['a', 1]]);
		setter(next);
		// Non-plain objects bypass the JSON.stringify equality path and always notify subscribers.
		expect(runs).toBe(2);
	});
});
