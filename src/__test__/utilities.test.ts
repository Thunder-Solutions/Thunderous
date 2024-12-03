import { test } from 'node:test';
import assert from 'assert';
import { assumeObj, NOOP } from '../utilities';

await test('assumeObj', () => {
	const obj = assumeObj({ a: 1 });
	assert.strictEqual(obj.a, 1);
	assert.strictEqual(obj.b, undefined);
	assert.throws(() => assumeObj(null), { message: 'Expected an object.' });
});

await test('NOOP', () => {
	assert.strictEqual(NOOP(), undefined);
});
