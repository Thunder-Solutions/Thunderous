import { html, css, customElement } from 'thunderous';
import { theme } from '../styles/theme';

export const ContentGroup = customElement(({ adoptStyleSheet, connectedCallback, elementRef, refs }) => {
	adoptStyleSheet(theme);
	adoptStyleSheet(styles);
	connectedCallback(() => {
		const isNested = elementRef.parentElement?.closest('th-content-group') !== null;
		if (isNested && refs['content-group'] !== null) {
			refs['content-group'].classList.add('nested');
		}
	});
	return html`<div ref="content-group" class="content-group"><slot></slot></div>`;
});

const styles = css`
	.content-group {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1em;
		max-width: 50em;
	}
	.content-group:not(.nested) {
		padding: 2em;
	}
	@media (min-width: 60em) {
		.content-group:not(.nested) {
			padding: 2em 4em;
		}
	}
`;
