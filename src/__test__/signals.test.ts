import { createEffect, createSignal, derived } from '../signals';
import { type Mock, test, type TestContext } from 'node:test';
import assert from 'assert';
import { assumeObj, NOOP } from '../utilities';

const getLogMock = (testContext: TestContext) => {
	testContext.mock.method(console, 'log', NOOP);
	type MockFunctionContext = Mock<typeof console.log>['mock'];
	// @ts-expect-error // typescript doesn't honor the node mock
	return console.log.mock as MockFunctionContext;
};

const getErrorMock = (testContext: TestContext) => {
	testContext.mock.method(console, 'error', NOOP);
	type MockFunctionContext = Mock<typeof console.error>['mock'];
	// @ts-expect-error // typescript doesn't honor the node mock
	return console.error.mock as MockFunctionContext;
};

const nextMicrotask = () => new Promise<void>((resolve) => queueMicrotask(resolve));

await test('createSignal', async () => {
	await test('initial value', () => {
		const [count] = createSignal(0);
		assert.strictEqual(count(), 0);
	});
	await test('set value', () => {
		const [count, setCount] = createSignal(0);
		setCount(1);
		assert.strictEqual(count(), 1);
	});
	await test('batch updates', async () => {
		const [count, setCount] = createSignal(0);
		let result: number | undefined;
		let runCount = 0;
		createEffect(() => {
			result = count();
			runCount++;
		});
		setCount(1);
		setCount(2);
		setCount(3);
		setCount(4);

		// Wait for the effect to run
		await nextMicrotask();

		assert.strictEqual(result, 4);
		assert.strictEqual(runCount, 2);
	});
	await test('does not recalculate for equal primitives', async () => {
		const [count, setCount] = createSignal(0);
		let runCount = 0;
		createEffect(() => {
			count();
			runCount++;
		});
		setCount(0);

		// Wait for the effect to run
		await nextMicrotask();

		assert.strictEqual(runCount, 1);
	});
	await test('recalculates for complex data', async () => {
		const [count, setCount] = createSignal({ value: 0 });
		let runCount = 0;
		createEffect(() => {
			count();
			runCount++;
		});
		setCount({ value: 0 });

		// Wait for the effect to run
		await nextMicrotask();

		assert.strictEqual(runCount, 2);
	});
	await test('debug mode', async (t) => {
		await test('Adds the label when the signal is created with one', async () => {
			const logMock = getLogMock(t);

			const [count, setCount] = createSignal(0, { debugMode: true, label: 'count' });

			await test('does not log when the signal is initially created', () => {
				assert.strictEqual(logMock.callCount(), 0);
			});

			await test('logs when the signal getter is run', async () => {
				count();

				// Wait for the debug log to run
				await nextMicrotask();
				assert.strictEqual(logMock.callCount(), 1);
				assert.deepStrictEqual(logMock.calls[0].arguments, [
					'Signal retrieved:',
					{ value: 0, subscribers: new Set(), label: '(count)' },
				]);
			});

			await test('logs when the signal setter is run', async () => {
				setCount(1);

				// Wait for the debug log to run
				await nextMicrotask();
				assert.strictEqual(logMock.callCount(), 2);
				assert.deepStrictEqual(logMock.calls[1].arguments, [
					'Signal set:',
					{ oldValue: 0, newValue: 1, subscribers: new Set(), label: '(count)' },
				]);
			});
		});

		await test('Uses "anonymous signal" when the signal is created without a label', async () => {
			const logMock = getLogMock(t);
			const [count, setCount] = createSignal(0, { debugMode: true });

			await test('does not log when the signal is initially created', () => {
				assert.strictEqual(logMock.callCount(), 0);
			});

			await test('logs when the signal getter is run', async () => {
				count();

				// Wait for the debug log to run
				await nextMicrotask();
				assert.strictEqual(logMock.callCount(), 1);
				assert.deepStrictEqual(logMock.calls[0].arguments, [
					'Signal retrieved:',
					{ value: 0, subscribers: new Set(), label: 'anonymous signal' },
				]);
			});

			await test('logs when the signal setter is run', async () => {
				setCount(1);

				// Wait for the debug log to run
				await nextMicrotask();
				assert.strictEqual(logMock.callCount(), 2);
				assert.deepStrictEqual(logMock.calls[1].arguments, [
					'Signal set:',
					{ oldValue: 0, newValue: 1, subscribers: new Set(), label: 'anonymous signal' },
				]);
			});
		});

		await test('Does not log if debugMode is false', async () => {
			const logMock = getLogMock(t);
			const [count, setCount] = createSignal(0, { debugMode: false, label: 'count' });

			await test('does not log when the signal is initially created', () => {
				assert.strictEqual(logMock.callCount(), 0);
			});

			await test('does not log when the signal getter is run', async () => {
				count();

				// Wait for the debug log to run
				await nextMicrotask();
				assert.strictEqual(logMock.callCount(), 0);
			});

			await test('does not log when the signal setter is run', async () => {
				setCount(1);

				// Wait for the debug log to run
				await nextMicrotask();
				assert.strictEqual(logMock.callCount(), 0);
			});
		});

		await test('Adds getter and setter labels in addition to the overall signal label', async () => {
			const logMock = getLogMock(t);
			const [count, setCount] = createSignal(0, { debugMode: true, label: 'count' });

			await test('does not log when the signal is initially created', () => {
				assert.strictEqual(logMock.callCount(), 0);
			});

			await test('logs when the signal getter is run with a label', async () => {
				count({ debugMode: true, label: 'getter' });

				// Wait for the debug log to run
				await nextMicrotask();
				assert.strictEqual(logMock.callCount(), 1);
				assert.deepStrictEqual(logMock.calls[0].arguments, [
					'Signal retrieved:',
					{ value: 0, subscribers: new Set(), label: '(count) getter' },
				]);
			});

			await test('logs when the signal setter is run with a label', async () => {
				setCount(1, { debugMode: true, label: 'setter' });

				// Wait for the debug log to run
				await nextMicrotask();
				assert.strictEqual(logMock.callCount(), 2);
				assert.deepStrictEqual(logMock.calls[1].arguments, [
					'Signal set:',
					{ oldValue: 0, newValue: 1, subscribers: new Set(), label: '(count) setter' },
				]);
			});
		});

		await test('Adds getter and setter labels instead of the overall signal label', async () => {
			const logMock = getLogMock(t);
			const [count, setCount] = createSignal(0);

			await test('does not log when the signal is initially created', () => {
				assert.strictEqual(logMock.callCount(), 0);
			});

			await test('logs when the signal getter is run with a label', async () => {
				count({ debugMode: true, label: 'getter' });

				// Wait for the debug log to run
				await nextMicrotask();
				assert.strictEqual(logMock.callCount(), 1);
				assert.deepStrictEqual(logMock.calls[0].arguments, [
					'Signal retrieved:',
					{ value: 0, subscribers: new Set(), label: 'getter' },
				]);
			});

			await test('logs when the signal setter is run with a label', async () => {
				setCount(1, { debugMode: true, label: 'setter' });

				// Wait for the debug log to run
				await nextMicrotask();
				assert.strictEqual(logMock.callCount(), 2);
				assert.deepStrictEqual(logMock.calls[1].arguments, [
					'Signal set:',
					{ oldValue: 0, newValue: 1, subscribers: new Set(), label: 'setter' },
				]);
			});
		});

		await test('handles errors in subscribers', async (t) => {
			const errorMock = getErrorMock(t);
			const [count, setCount] = createSignal(0);
			const error = new Error('Test error');
			createEffect(() => {
				if (count() === 1) {
					throw error;
				}
			});
			setCount(1);

			// Wait for the effect to run
			await nextMicrotask();
			assert.strictEqual(errorMock.callCount(), 1);
			assert.deepStrictEqual(errorMock.calls[0].arguments, [
				'Error in subscriber:',
				{ error, oldValue: 0, newValue: 1, fn: assumeObj(errorMock.calls[0].arguments[1]).fn },
			]);
		});
	});
});

await test('createEffect', async () => {
	await test('runs immediately', () => {
		const [count] = createSignal(0);
		let result: number | undefined;
		createEffect(() => {
			result = count();
		});
		assert.strictEqual(result, 0);
	});
	await test('runs when signals change', async () => {
		const [count, setCount] = createSignal(0);
		let result: number | undefined;
		createEffect(() => {
			result = count();
		});
		setCount(1);

		// Wait for the effect to run
		await nextMicrotask();

		assert.strictEqual(result, 1);
	});
	await test('multiple subscribers', async () => {
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

		// Wait for the effect to run
		await nextMicrotask();

		assert.strictEqual(result1, 1);
		assert.strictEqual(result2, 1);
	});
	await test('handles errors in effects', async (t) => {
		const errorMock = getErrorMock(t);
		const error = new Error('Test error');
		createEffect(() => {
			throw error;
		});

		// Wait for the effect to run
		await nextMicrotask();
		assert.strictEqual(errorMock.callCount(), 1);
		assert.deepStrictEqual(errorMock.calls[0].arguments, [
			'Error in effect:',
			{ error, fn: assumeObj(errorMock.calls[0].arguments[1]).fn },
		]);
	});
});

await test('derived', async () => {
	await test('calculates the value immediately', () => {
		const [count] = createSignal(1);
		const doubled = derived(() => count() * 2);
		assert.strictEqual(doubled(), 2);
	});
	await test('recalculates the value upon updating', async () => {
		const [count, setCount] = createSignal(1);
		const doubled = derived(() => count() * 2);
		setCount(2);

		// Wait for the effect to run
		await nextMicrotask();

		assert.strictEqual(doubled(), 4);
	});
	await test('handles errors in derived signals', async (t) => {
		const errorMock = getErrorMock(t);
		const error = new Error('Test error');
		const [count, setCount] = createSignal(1);
		derived(() => {
			if (count() === 2) {
				throw error;
			}
		});
		setCount(2);

		// Wait for the effect to run
		await nextMicrotask();
		assert.strictEqual(errorMock.callCount(), 1);
		assert.deepStrictEqual(errorMock.calls[0].arguments, [
			'Error in derived signal:',
			{ error, fn: assumeObj(errorMock.calls[0].arguments[1]).fn },
		]);
	});
});
