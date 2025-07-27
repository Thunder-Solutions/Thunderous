import { describe, it, type Mock } from 'node:test';
import assert from 'assert';
import { html, css } from '../../render';
import { NOOP } from '../../utilities';

await describe('html', async () => {
	await it('renders a simple string', () => {
		const result = html`<div></div>`;
		assert.strictEqual(result, '<div></div>');
	});
	await it('renders a string with interpolated values', () => {
		const result = html`<div>${'Hello, world!'} ${1} ${true}</div>`;
		assert.strictEqual(result, '<div>Hello, world! 1 true</div>');
	});
	await it('renders a string with signals', () => {
		const mockGetter = () => 'Hello, world!';
		const result = html`<div>${mockGetter}</div>`;
		assert.strictEqual(result, '<div>Hello, world!</div>');
	});
});

await describe('css', async () => {
	await it('renders a simple string', () => {
		// prettier-ignore
		const result = css`div { color: red; }`;
		assert.strictEqual(result, 'div { color: red; }');
	});
	await it('renders a string with interpolated values', () => {
		// prettier-ignore
		const result = css`div { --str: ${'str'}; --num: ${1}; --bool: ${true}; }`;
		assert.strictEqual(result, 'div { --str: str; --num: 1; --bool: true; }');
	});
	await it('logs an error if a non-primitive value is interpolated', (testContext) => {
		testContext.mock.method(console, 'error', NOOP);
		const errorMock = (console.error as Mock<typeof console.error>).mock;
		const obj = {};
		// prettier-ignore
		const result = css`div { --obj: ${obj}; }`;
		assert.strictEqual(result, 'div { --obj: ; }');
		assert.strictEqual(errorMock.callCount(), 1);
		assert.strictEqual(errorMock.calls[0].arguments[0], 'Objects are not valid in CSS values. Received:');
		assert.strictEqual(errorMock.calls[0].arguments[1], obj);
	});
	await it('renders a string with signals', () => {
		const mockGetter = () => 'red';
		// prettier-ignore
		const result = css`div { color: ${mockGetter}; }`;
		assert.strictEqual(result, 'div { color: red; }');
	});
});
