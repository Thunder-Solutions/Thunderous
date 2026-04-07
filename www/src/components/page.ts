import { css, customElement, html } from 'thunderous';
import { theme } from '../styles/theme';

export const Page = customElement(({ adoptStyleSheet, attrSignals }) => {
	const [_splash] = attrSignals['splash'];
	const splash = _splash() !== null;
	adoptStyleSheet(theme);
	adoptStyleSheet(styles);
	return html`
		<div class="page ${splash ? 'splash' : ''}">
			<div><slot name="header"></slot></div>
			<div class="page__content"><slot></slot></div>
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
	.splash .page__content {
		display: grid;
		padding: 4em 0;
		gap: 2em;
	}
`;
