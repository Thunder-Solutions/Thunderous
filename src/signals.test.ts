import { createSignal } from './signals';
import { test } from 'node:test';
import assert from 'assert';

test('createSignal', () => {
	const [count, setCount] = createSignal(0);
	assert.strictEqual(count(), 0);
	setCount(1);
	assert.strictEqual(count(), 1);
});
