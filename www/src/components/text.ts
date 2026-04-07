import { css, customElement, html } from 'thunderous';
import { theme } from '../styles/theme';

export const Text = customElement(({ adoptStyleSheet }) => {
	adoptStyleSheet(theme);
	adoptStyleSheet(styles);
	return html`<p><slot></slot></p>`;
});

const styles = css`
	p {
		margin: 0;
	}
`;
