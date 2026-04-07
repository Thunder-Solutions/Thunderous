import { css, customElement, html } from 'thunderous';

export const Heading = customElement(({ adoptStyleSheet }) => {
	adoptStyleSheet(styles);
	return html`<slot></slot>`;
});

const styles = css`
	::slotted(h1),
	::slotted(h2),
	::slotted(h3),
	::slotted(h4),
	::slotted(h5),
	::slotted(h6) {
		all: initial;
		color: inherit;
		font: inherit;
		font-size: 3em;
		line-height: 1;
		display: block;
	}
`;
