import { describe, test, expect } from 'vitest';
import { clientOnlyCallback } from '../..';

describe('clientOnlyCallback (top-level export)', () => {
	test('invokes the callback on the client', () => {
		let ran = false;
		clientOnlyCallback(() => {
			ran = true;
		});
		expect(ran).toBe(true);
	});

	test('returns the callback result on the client', () => {
		const result = clientOnlyCallback(() => 'value' as unknown as void);
		expect(result).toBe('value');
	});
});
