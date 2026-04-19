import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createEffect, createSignal, derived } from '../../signals';
import { NOOP } from '../../utilities';

describe('createSignal', () => {
	it('sets the initial value', () => {
		const [count] = createSignal(0);
		expect(count()).toBe(0);
	});
	it('sets a new value', () => {
		const [count, setCount] = createSignal(0);
		setCount(1);
		expect(count()).toBe(1);
	});
	it('does not recalculate for equal primitives', () => {
		const [count, setCount] = createSignal(0);
		let runCount = 0;
		createEffect(() => {
			count();
			runCount++;
		});
		setCount(0);
		expect(runCount).toBe(1);
	});
	it('does not recalculate for complex data', () => {
		const [count, setCount] = createSignal({ value: 0 });
		let runCount = 0;
		createEffect(() => {
			count();
			runCount++;
		});
		setCount({ value: 0 });
		expect(runCount).toBe(1);
	});
	describe('runs in debug mode', () => {
		describe('adds the label when the signal is created with one', () => {
			const logSpy = vi.spyOn(console, 'log').mockImplementation(NOOP);
			beforeEach(() => logSpy.mockClear());

			const [count, setCount] = createSignal(0, { debugMode: true, label: 'count' });

			it('does not log when the signal is initially created', () => {
				expect(logSpy).not.toHaveBeenCalled();
			});

			it('logs when the signal getter is run', () => {
				count();
				expect(logSpy).toHaveBeenCalledTimes(1);
				expect(logSpy).toHaveBeenCalledWith('Signal retrieved:', {
					value: 0,
					subscribers: [],
					label: '(count)',
				});
			});

			it('logs when the signal setter is run', () => {
				setCount(1);
				expect(logSpy).toHaveBeenCalledTimes(1);
				expect(logSpy).toHaveBeenCalledWith('Signal set:', {
					oldValue: 0,
					newValue: 1,
					subscribers: [],
					label: '(count)',
				});
			});
		});

		describe('uses "anonymous signal" when the signal is created without a label', () => {
			const logSpy = vi.spyOn(console, 'log').mockImplementation(NOOP);
			beforeEach(() => logSpy.mockClear());
			const [count, setCount] = createSignal(0, { debugMode: true });

			it('does not log when the signal is initially created', () => {
				expect(logSpy).not.toHaveBeenCalled();
			});

			it('logs when the signal getter is run', () => {
				count();
				expect(logSpy).toHaveBeenCalledTimes(1);
				expect(logSpy).toHaveBeenCalledWith('Signal retrieved:', {
					value: 0,
					subscribers: [],
					label: 'anonymous signal',
				});
			});

			it('logs when the signal setter is run', () => {
				setCount(1);
				expect(logSpy).toHaveBeenCalledTimes(1);
				expect(logSpy).toHaveBeenCalledWith('Signal set:', {
					oldValue: 0,
					newValue: 1,
					subscribers: [],
					label: 'anonymous signal',
				});
			});
		});

		describe('does not log if debugMode is false', () => {
			const logSpy = vi.spyOn(console, 'log').mockImplementation(NOOP);
			beforeEach(() => logSpy.mockClear());
			const [count, setCount] = createSignal(0, { debugMode: false, label: 'count' });

			it('does not log when the signal is initially created', () => {
				expect(logSpy).not.toHaveBeenCalled();
			});

			it('does not log when the signal getter is run', () => {
				count();
				expect(logSpy).not.toHaveBeenCalled();
			});

			it('does not log when the signal setter is run', () => {
				setCount(1);
				expect(logSpy).not.toHaveBeenCalled();
			});
		});

		describe('adds getter and setter labels in addition to the overall signal label', () => {
			const logSpy = vi.spyOn(console, 'log').mockImplementation(NOOP);
			beforeEach(() => logSpy.mockClear());
			const [count, setCount] = createSignal(0, { debugMode: true, label: 'count' });

			it('does not log when the signal is initially created', () => {
				expect(logSpy).not.toHaveBeenCalled();
			});

			it('logs when the signal getter is run with a label', () => {
				count({ debugMode: true, label: 'getter' });
				expect(logSpy).toHaveBeenCalledTimes(1);
				expect(logSpy).toHaveBeenCalledWith('Signal retrieved:', {
					value: 0,
					subscribers: [],
					label: '(count) getter',
				});
			});

			it('logs when the signal setter is run with a label', () => {
				setCount(1, { debugMode: true, label: 'setter' });
				expect(logSpy).toHaveBeenCalledTimes(1);
				expect(logSpy).toHaveBeenCalledWith('Signal set:', {
					oldValue: 0,
					newValue: 1,
					subscribers: [],
					label: '(count) setter',
				});
			});
		});

		describe('adds getter and setter labels instead of the overall signal label', () => {
			const logSpy = vi.spyOn(console, 'log').mockImplementation(NOOP);
			beforeEach(() => logSpy.mockClear());
			const [count, setCount] = createSignal(0);

			it('does not log when the signal is initially created', () => {
				expect(logSpy).not.toHaveBeenCalled();
			});

			it('logs when the signal getter is run with a label', () => {
				count({ debugMode: true, label: 'getter' });
				expect(logSpy).toHaveBeenCalledTimes(1);
				expect(logSpy).toHaveBeenCalledWith('Signal retrieved:', {
					value: 0,
					subscribers: [],
					label: 'getter',
				});
			});

			it('logs when the signal setter is run with a label', () => {
				setCount(1, { debugMode: true, label: 'setter' });
				expect(logSpy).toHaveBeenCalledTimes(1);
				expect(logSpy).toHaveBeenCalledWith('Signal set:', {
					oldValue: 0,
					newValue: 1,
					subscribers: [],
					label: 'setter',
				});
			});
		});

		it('handles errors in subscribers', () => {
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(NOOP);
			const [count, setCount] = createSignal(0);
			const error = new Error('Test error');
			createEffect(() => {
				if (count() === 1) {
					throw error;
				}
			});
			setCount(1);
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenCalledWith(
				'Error in subscriber:',
				expect.objectContaining({
					error,
					oldValue: 0,
					newValue: 1,
				}),
			);
		});
	});
});

describe('createEffect', () => {
	it('runs immediately', () => {
		const [count] = createSignal(0);
		let result: number | undefined;
		createEffect(() => {
			result = count();
		});
		expect(result).toBe(0);
	});
	it('runs when signals change', () => {
		const [count, setCount] = createSignal(0);
		let result: number | undefined;
		createEffect(() => {
			result = count();
		});
		setCount(1);
		expect(result).toBe(1);
	});
	it('handles multiple subscribers', () => {
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
		expect(result1).toBe(1);
		expect(result2).toBe(1);
	});
	it('handles errors in effects', () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(NOOP);
		const error = new Error('Test error');
		createEffect(() => {
			throw error;
		});
		expect(errorSpy).toHaveBeenCalledWith('Error in effect:', expect.objectContaining({ error }));
		errorSpy.mockRestore();
	});
});

describe('derived', () => {
	it('calculates the value immediately', () => {
		const [count] = createSignal(1);
		const doubled = derived(() => count() * 2);
		expect(doubled()).toBe(2);
	});
	it('recalculates the value upon updating', () => {
		const [count, setCount] = createSignal(1);
		const doubled = derived(() => count() * 2);
		setCount(2);
		expect(doubled()).toBe(4);
	});
	it('handles errors in derived signals', () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(NOOP);
		const error = new Error('Test error');
		const [count, setCount] = createSignal(1);
		derived(() => {
			if (count() === 2) {
				throw error;
			}
		});
		setCount(2);
		expect(errorSpy).toHaveBeenCalledWith('Error in derived signal:', expect.objectContaining({ error }));
		errorSpy.mockRestore();
	});
});
