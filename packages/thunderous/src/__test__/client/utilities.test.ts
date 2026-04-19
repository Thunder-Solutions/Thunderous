import { describe, test, expect } from 'vitest';
import { NOOP, queryComment, queryChildren } from '../../utilities';

describe('NOOP', () => {
	test('returns undefined', () => {
		expect(NOOP()).toBe(undefined);
	});
});

describe('queryComment', () => {
	test('finds comment node with matching text', () => {
		const container = document.createElement('div');
		const comment = document.createComment('test-comment');
		container.appendChild(document.createElement('span'));
		container.appendChild(comment);
		container.appendChild(document.createElement('span'));

		const result = queryComment(container, 'test-comment');

		expect(result).toBe(comment);
		expect(result?.nodeType).toBe(Node.COMMENT_NODE);
		expect(result?.nodeValue).toBe('test-comment');
	});

	test('returns null when no matching comment found', () => {
		const container = document.createElement('div');
		const comment = document.createComment('other-comment');
		container.appendChild(comment);

		const result = queryComment(container, 'test-comment');

		expect(result).toBeNull();
	});

	test('returns null for container with no comments', () => {
		const container = document.createElement('div');
		container.appendChild(document.createElement('span'));

		const result = queryComment(container, 'any-comment');

		expect(result).toBeNull();
	});
});

describe('queryChildren', () => {
	test('finds first child matching selector', () => {
		const children = [document.createTextNode('text'), document.createElement('span'), document.createElement('div')];

		const result = queryChildren(children, 'div');

		expect(result).toBe(children[2]);
	});

	test('returns null when no child matches selector', () => {
		const children = [document.createTextNode('text'), document.createElement('span'), document.createElement('p')];

		const result = queryChildren(children, 'div');

		expect(result).toBeNull();
	});

	test('skips non-Element nodes', () => {
		const children = [
			document.createTextNode('text'),
			document.createComment('comment'),
			document.createElement('div'),
		];

		const result = queryChildren(children, 'div');

		expect(result).toBe(children[2]);
	});

	test('returns first match when multiple match', () => {
		const children = [document.createElement('div'), document.createElement('div')];

		const result = queryChildren(children, 'div');

		expect(result).toBe(children[0]);
	});

	test('returns null for empty array', () => {
		const result = queryChildren([], 'div');

		expect(result).toBeNull();
	});

	test('handles complex selectors', () => {
		const child = document.createElement('div');
		child.className = 'test-class';
		const children = [child];

		const result = queryChildren(children, '.test-class');

		expect(result).toBe(child);
	});
});
