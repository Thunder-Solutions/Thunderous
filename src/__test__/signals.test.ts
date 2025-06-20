import { createEffect, createSignal, derived } from '../signals';
import { describe, it, beforeEach, type Mock } from 'node:test';
import assert from 'assert';
import { NOOP } from '../utilities';
import type { AnyFn } from '../types';

await describe('createSignal', async () => {
	await it('sets the initial value', () => {
		const [count] = createSignal(0);
		assert.strictEqual(count(), 0);
	});
	await it('sets a new value', () => {
		const [count, setCount] = createSignal(0);
		setCount(1);
		assert.strictEqual(count(), 1);
	});
	await it('does not recalculate for equal primitives', () => {
		const [count, setCount] = createSignal(0);
		let runCount = 0;
		createEffect(() => {
			count();
			runCount++;
		});
		setCount(0);

		assert.strictEqual(runCount, 1);
	});
	await it('recalculates for complex data', () => {
		const [count, setCount] = createSignal({ value: 0 });
		let runCount = 0;
		createEffect(() => {
			count();
			runCount++;
		});
		setCount({ value: 0 });
		assert.strictEqual(runCount, 2);
	});
	await it('runs in debug mode', async (testContext) => {
		await it('adds the label when the signal is created with one', async () => {
			testContext.mock.method(console, 'log', NOOP);
			const logMock = (console.log as Mock<typeof console.log>).mock;
			beforeEach(() => logMock.resetCalls());

			const [count, setCount] = createSignal(0, { debugMode: true, label: 'count' });

			await it('does not log when the signal is initially created', () => {
				assert.strictEqual(logMock.callCount(), 0);
			});

			await it('logs when the signal getter is run', async () => {
				count();
				assert.strictEqual(logMock.callCount(), 1);
				assert.deepStrictEqual(logMock.calls[0].arguments, [
					'Signal retrieved:',
					{ value: 0, subscribers: new Set(), label: '(count)' },
				]);
			});

			await it('logs when the signal setter is run', async () => {
				setCount(1);
				assert.strictEqual(logMock.callCount(), 1);
				assert.deepStrictEqual(logMock.calls[0].arguments, [
					'Signal set:',
					{ oldValue: 0, newValue: 1, subscribers: new Set(), label: '(count)' },
				]);
			});
		});

		await it('uses "anonymous signal" when the signal is created without a label', async () => {
			testContext.mock.method(console, 'log', NOOP);
			const logMock = (console.log as Mock<typeof console.log>).mock;
			beforeEach(() => logMock.resetCalls());
			const [count, setCount] = createSignal(0, { debugMode: true });

			await it('does not log when the signal is initially created', () => {
				assert.strictEqual(logMock.callCount(), 0);
			});

			await it('logs when the signal getter is run', () => {
				count();
				assert.strictEqual(logMock.callCount(), 1);
				assert.deepStrictEqual(logMock.calls[0].arguments, [
					'Signal retrieved:',
					{ value: 0, subscribers: new Set(), label: 'anonymous signal' },
				]);
			});

			await it('logs when the signal setter is run', () => {
				setCount(1);
				assert.strictEqual(logMock.callCount(), 1);
				assert.deepStrictEqual(logMock.calls[0].arguments, [
					'Signal set:',
					{ oldValue: 0, newValue: 1, subscribers: new Set(), label: 'anonymous signal' },
				]);
			});
		});

		await it('does not log if debugMode is false', async () => {
			testContext.mock.method(console, 'log', NOOP);
			const logMock = (console.log as Mock<typeof console.log>).mock;
			beforeEach(() => logMock.resetCalls());
			const [count, setCount] = createSignal(0, { debugMode: false, label: 'count' });

			await it('does not log when the signal is initially created', () => {
				assert.strictEqual(logMock.callCount(), 0);
			});

			await it('does not log when the signal getter is run', () => {
				count();
				assert.strictEqual(logMock.callCount(), 0);
			});

			await it('does not log when the signal setter is run', () => {
				setCount(1);
				assert.strictEqual(logMock.callCount(), 0);
			});
		});

		await it('adds getter and setter labels in addition to the overall signal label', async () => {
			testContext.mock.method(console, 'log', NOOP);
			const logMock = (console.log as Mock<typeof console.log>).mock;
			beforeEach(() => logMock.resetCalls());
			const [count, setCount] = createSignal(0, { debugMode: true, label: 'count' });

			await it('does not log when the signal is initially created', () => {
				assert.strictEqual(logMock.callCount(), 0);
			});

			await it('logs when the signal getter is run with a label', () => {
				count({ debugMode: true, label: 'getter' });

				assert.strictEqual(logMock.callCount(), 1);
				assert.deepStrictEqual(logMock.calls[0].arguments, [
					'Signal retrieved:',
					{ value: 0, subscribers: new Set(), label: '(count) getter' },
				]);
			});

			await it('logs when the signal setter is run with a label', () => {
				setCount(1, { debugMode: true, label: 'setter' });

				assert.strictEqual(logMock.callCount(), 1);
				assert.deepStrictEqual(logMock.calls[0].arguments, [
					'Signal set:',
					{ oldValue: 0, newValue: 1, subscribers: new Set(), label: '(count) setter' },
				]);
			});
		});

		await it('adds getter and setter labels instead of the overall signal label', async () => {
			testContext.mock.method(console, 'log', NOOP);
			const logMock = (console.log as Mock<typeof console.log>).mock;
			beforeEach(() => logMock.resetCalls());
			const [count, setCount] = createSignal(0);

			await it('does not log when the signal is initially created', () => {
				assert.strictEqual(logMock.callCount(), 0);
			});

			await it('logs when the signal getter is run with a label', () => {
				count({ debugMode: true, label: 'getter' });

				assert.strictEqual(logMock.callCount(), 1);
				assert.deepStrictEqual(logMock.calls[0].arguments, [
					'Signal retrieved:',
					{ value: 0, subscribers: new Set(), label: 'getter' },
				]);
			});

			await it('logs when the signal setter is run with a label', () => {
				setCount(1, { debugMode: true, label: 'setter' });

				assert.strictEqual(logMock.callCount(), 1);
				assert.deepStrictEqual(logMock.calls[0].arguments, [
					'Signal set:',
					{ oldValue: 0, newValue: 1, subscribers: new Set(), label: 'setter' },
				]);
			});
		});

		await it('handles errors in subscribers', async (testContext) => {
			testContext.mock.method(console, 'error', NOOP);
			const errorMock = (console.error as Mock<typeof console.error>).mock;
			const [count, setCount] = createSignal(0);
			const error = new Error('Test error');
			createEffect(() => {
				if (count() === 1) {
					throw error;
				}
			});
			setCount(1);

			assert.strictEqual(errorMock.callCount(), 1);
			assert.deepStrictEqual(errorMock.calls[0].arguments, [
				'Error in subscriber:',
				{ error, oldValue: 0, newValue: 1, fn: (errorMock.calls[0].arguments[1] as { fn: AnyFn }).fn },
			]);
		});
	});
});

await describe('createEffect', async () => {
	await it('runs immediately', () => {
		const [count] = createSignal(0);
		let result: number | undefined;
		createEffect(() => {
			result = count();
		});
		assert.strictEqual(result, 0);
	});
	await it('runs when signals change', () => {
		const [count, setCount] = createSignal(0);
		let result: number | undefined;
		createEffect(() => {
			result = count();
		});
		setCount(1);

		assert.strictEqual(result, 1);
	});
	await it('handles multiple subscribers', () => {
		const [count, setCount] = createSignal(0);
		let result1: number | undefined;
		let result2: number | undefined;
		createEffect(() => {
			result1 = count();
		});
		createEffect(() => {
			result2 = count();
		});
		setCount(1);

		assert.strictEqual(result1, 1);
		assert.strictEqual(result2, 1);
	});
	await it('handles errors in effects', (testContext) => {
		testContext.mock.method(console, 'error', NOOP);
		const errorMock = (console.error as Mock<typeof console.error>).mock;
		const error = new Error('Test error');
		createEffect(() => {
			throw error;
		});

		assert.strictEqual(errorMock.callCount(), 1);
		assert.deepStrictEqual(errorMock.calls[0].arguments, [
			'Error in effect:',
			{ error, fn: (errorMock.calls[0].arguments[1] as { fn: AnyFn }).fn },
		]);
	});
});

await describe('derived', async () => {
	await it('calculates the value immediately', () => {
		const [count] = createSignal(1);
		const doubled = derived(() => count() * 2);
		assert.strictEqual(doubled(), 2);
	});
	await it('recalculates the value upon updating', () => {
		const [count, setCount] = createSignal(1);
		const doubled = derived(() => count() * 2);
		setCount(2);

		assert.strictEqual(doubled(), 4);
	});
	await it('handles errors in derived signals', (testContext) => {
		testContext.mock.method(console, 'error', NOOP);
		const errorMock = (console.error as Mock<typeof console.error>).mock;
		const error = new Error('Test error');
		const [count, setCount] = createSignal(1);
		derived(() => {
			if (count() === 2) {
				throw error;
			}
		});
		setCount(2);

		assert.strictEqual(errorMock.callCount(), 1);
		assert.deepStrictEqual(errorMock.calls[0].arguments, [
			'Error in derived signal:',
			{ error, fn: (errorMock.calls[0].arguments[1] as { fn: AnyFn }).fn },
		]);
	});
});
