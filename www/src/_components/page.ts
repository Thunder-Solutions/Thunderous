import { css, customElement, html } from 'thunderous';
import { theme } from '../_styles/theme';

export const Page = customElement(({ adoptStyleSheet }) => {
	adoptStyleSheet(theme);
	adoptStyleSheet(styles);
	return html`
		<div class="page">
			<div><slot name="header"></slot></div>
			<div><slot></slot></div>
			<div><slot name="footer"></slot></div>
		</div>
	`;
});

const styles = css`
	.page {
		height: 100%;
		background-color: var(--color-site-1);
		color: var(--color-site-1-c);
		overflow: auto;
		display: grid;
		grid-template-rows: auto 1fr auto;
	}
`;
