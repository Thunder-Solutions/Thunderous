import { customElement, html, css, derived } from 'thunderous';
import { theme } from '../styles/theme';

export const BlockQuote = customElement(({ adoptStyleSheet, attrSignals }) => {
	adoptStyleSheet(theme);
	adoptStyleSheet(styles);

	const [variant] = attrSignals['variant'];
	const icon = derived(() => (variant() === null ? 'info' : variant()!));

	return html`
		<blockquote class="${variant}">
			<th-icon icon-name="${icon}"></th-icon>
			<slot></slot>
		</blockquote>
	`;
});

const styles = css`
	blockquote {
		padding: 0.5em 1em;
		background-color: rgba(255, 255, 255, 0.05);
		border-left: 4px solid var(--color-site-2);
		margin: 0.5em 1em;
		color: var(--color-site-1-c-1);
		border-radius: 0 0.25em 0.25em 0;
	}
	blockquote.warning {
		background-color: rgba(249, 115, 22, 0.1);
		border-left-color: #f97316;
		color: #fdba74;
	}
	th-icon {
		font-size: 1.6em;
		display: inline-flex;
		margin-right: 0.1em;
		vertical-align: bottom;
	}
`;
