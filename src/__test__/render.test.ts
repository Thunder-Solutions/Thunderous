import { test } from 'node:test';
import assert from 'assert';
import { html, css } from '../render';
import { getErrorMock } from './_test-utils';

await test('html', async () => {
	await test('renders a simple string', () => {
		const result = html`<div></div>`;
		assert.strictEqual(result, '<div></div>');
	});
	await test('renders a string with interpolated values', () => {
		const result = html`<div>${'Hello, world!'} ${1} ${true}</div>`;
		assert.strictEqual(result, '<div>Hello, world! 1 true</div>');
	});
	await test('logs an error if a non-primitive value is interpolated', (t) => {
		const mockError = getErrorMock(t);
		const obj = {};
		const result = html`<div>${obj}</div>`;
		assert.strictEqual(result, '<div></div>');
		assert.strictEqual(mockError.callCount(), 1);
		assert.strictEqual(
			mockError.calls[0].arguments[0],
			'An invalid value was passed to a template function. Non-primitive values are not supported.\n\nValue:\n',
		);
		assert.strictEqual(mockError.calls[0].arguments[1], obj);
	});
	await test('renders a string with signals', () => {
		const mockGetter = () => 'Hello, world!';
		const result = html`<div>${mockGetter}</div>`;
		assert.strictEqual(result, '<div>Hello, world!</div>');
	});
});

await test('css', async () => {
	await test('renders a simple string', () => {
		// prettier-ignore
		const result = css`div { color: red; }`;
		assert.strictEqual(result, 'div { color: red; }');
	});
	await test('renders a string with interpolated values', () => {
		// prettier-ignore
		const result = css`div { --str: ${'str'}; --num: ${1}; --bool: ${true}; }`;
		assert.strictEqual(result, 'div { --str: str; --num: 1; --bool: true; }');
	});
	await test('logs an error if a non-primitive value is interpolated', (t) => {
		const mockError = getErrorMock(t);
		const obj = {};
		// prettier-ignore
		const result = css`div { --obj: ${obj}; }`;
		assert.strictEqual(result, 'div { --obj: ; }');
		assert.strictEqual(mockError.callCount(), 1);
		assert.strictEqual(
			mockError.calls[0].arguments[0],
			'An invalid value was passed to a template function. Non-primitive values are not supported.\n\nValue:\n',
		);
		assert.strictEqual(mockError.calls[0].arguments[1], obj);
	});
	await test('renders a string with signals', () => {
		const mockGetter = () => 'red';
		// prettier-ignore
		const result = css`div { color: ${mockGetter}; }`;
		assert.strictEqual(result, 'div { color: red; }');
	});
});
