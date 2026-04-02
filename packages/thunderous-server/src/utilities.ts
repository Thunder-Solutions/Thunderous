/**
 * Escape a string for safe insertion into HTML.
 */
export const escapeHtml = (str: string): string => {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
};

class RawHtml {
	value: string;
	constructor(value: string) {
		this.value = value;
	}
	toString() {
		return this.value;
	}
}

/**
 * Wrap a string so it bypasses automatic HTML escaping in `<script expr>`.
 */
export const raw = (str: string): RawHtml => new RawHtml(str);
