import { describe, it, expect } from 'vitest';
import { NOOP } from '../../utilities';

describe('NOOP', () => {
	it('returns nothing', () => {
		expect(NOOP()).toBe(undefined);
	});
});
