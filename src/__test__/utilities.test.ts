import { describe, it } from 'node:test';
import assert from 'assert';
import { NOOP } from '../utilities';

await describe('NOOP', async () => {
	await it('returns nothing', () => {
		assert.strictEqual(NOOP(), undefined);
	});
});
