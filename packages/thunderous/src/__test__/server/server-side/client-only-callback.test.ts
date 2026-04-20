import { describe, it, expect, vi } from 'vitest';
import { clientOnlyCallback } from '../../../server-side';

describe('clientOnlyCallback', () => {
	it('does not call the function on server', () => {
		const fn = vi.fn();
		const result = clientOnlyCallback(fn);
		expect(fn).not.toHaveBeenCalled();
		expect(result).toBeUndefined();
	});
});
