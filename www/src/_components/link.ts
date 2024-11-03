import { css, customElement, html } from 'thunderous';
import { theme } from '../_styles/theme';

export const Link = customElement(({ attrSignals, adoptStyleSheet }) => {
	adoptStyleSheet(theme);
	adoptStyleSheet(linkStyles);
	const [href] = attrSignals.href;
	return html`<a href="${href}" part="a"><slot></slot></a>`;
});

const linkStyles = css`
	a {
		display: inline-block;
		color: var(--color-link-1);
		text-decoration: none;
		border-bottom: 1px solid transparent;
		transition: border-bottom-color 0.3s;
	}
	a:hover {
		border-bottom-color: currentColor;
	}
`;

export const InvisibleLink = customElement(({ attrSignals, adoptStyleSheet }) => {
	adoptStyleSheet(invisibleLinkStyles);
	const [href] = attrSignals.href;
	return html`<a href="${href}"><slot></slot></a>`;
});

const invisibleLinkStyles = css`
	:host {
		display: contents;
	}
	a,
	a:visited,
	a:hover,
	a:active {
		display: contents;
		color: inherit;
		text-decoration: none;
	}
`;

export const LinkButton = customElement(({ attrSignals, adoptStyleSheet }) => {
	adoptStyleSheet(linkButtonStyles);
	const [href] = attrSignals.href;
	return html`<a href="${href}" part="a"><slot></slot></a>`;
});

const linkButtonStyles = css`
	a {
		display: inline-block;
		padding: 1em 2em;
		background-color: var(--color-link-1);
		color: var(--color-link-1-c);
		text-decoration: none;
		border: 0.4em solid var(--color-link-1-1);
		border-radius: 1em;
		box-shadow: 0 0 2em 0.2em rgba(0, 0, 100, 0.2);
		transition: all 0.3s;
	}
	a:hover {
		background-color: var(--color-link-1);
		box-shadow: 0 0 2em 0.5em rgba(68, 198, 255, 0.2);
	}
	a:active {
		background-color: var(--color-link-1);
	}
`;
