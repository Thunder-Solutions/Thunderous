import { css, customElement, html } from 'thunderous';
import { theme } from '../styles/theme';

export const PageHeader = customElement(({ adoptStyleSheet }) => {
	adoptStyleSheet(theme);
	adoptStyleSheet(pageHeaderStyles);
	return html`
		<header>
			<h2>
				<slot></slot>
			</h2>
			<a href="https://github.com/Thunder-Solutions/Thunderous" class="github-link">
				<th-icon icon-name="github"></th-icon>
			</a>
		</header>
	`;
});

const pageHeaderStyles = css`
	header {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: start;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		padding-bottom: 0.8em;
		margin: 1em;
		margin-bottom: 0;
	}
	h2 {
		margin: 0;
	}
	th-icon {
		font-size: 1.6em;
	}
	a,
	a:visited,
	a:hover,
	a:active {
		color: inherit;
		text-decoration: none;
	}
	a {
		transition: all 0.2s;
		display: flex;
		place-items: center;
		place-content: center;
		padding: 0.3em;
	}
	.github-link {
		margin-right: 2.4em;
	}
	a:hover {
		color: var(--color-site-2);
		transform: scale(1.1);
	}
	@media (min-width: 50em) {
		a {
			padding-right: 0;
		}
	}
	@media (min-width: 60em) {
		header {
			margin: 1em 2em;
			margin-bottom: 0;
		}
	}
`;

export const ContentHeader = customElement(({ adoptStyleSheet }) => {
	adoptStyleSheet(theme);
	adoptStyleSheet(contentHeaderStyles);
	return html`
		<header>
			<h3>
				<slot></slot>
			</h3>
		</header>
	`;
});

const contentHeaderStyles = css`
	h3 {
		margin: 0;
	}
`;
