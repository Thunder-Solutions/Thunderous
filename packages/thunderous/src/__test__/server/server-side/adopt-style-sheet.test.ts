import { describe, it, expect } from 'vitest';
import { getServerRenderArgs, serverCss } from '../../../server-side';

describe('adoptStyleSheet', () => {
	it('adds CSS to serverCss map for a tag', () => {
		// Clear any existing CSS
		serverCss.clear();

		const args = getServerRenderArgs('test-component');
		// @ts-expect-error // this will be a string on the server.
		args.adoptStyleSheet('body { margin: 0; }');

		expect(serverCss.get('test-component')).toContain('body { margin: 0; }');
	});

	it('accumulates multiple CSS calls for the same tag', () => {
		serverCss.clear();

		const args = getServerRenderArgs('multi-css-component');
		// @ts-expect-error // this will be a string on the server.
		args.adoptStyleSheet('.class1 { color: red; }');
		// @ts-expect-error // this will be a string on the server.
		args.adoptStyleSheet('.class2 { color: blue; }');

		const cssArray = serverCss.get('multi-css-component');
		expect(cssArray).toHaveLength(2);
		expect(cssArray).toContain('.class1 { color: red; }');
		expect(cssArray).toContain('.class2 { color: blue; }');
	});
});
