import { createSignal, css, customElement, html } from 'thunderous';
import { theme } from '../theme';

export const Crumb = customElement(({ adoptStyleSheet, attrSignals }) => {
	const [getHref] = attrSignals['href'] ?? createSignal('');

	adoptStyleSheet(theme);
	adoptStyleSheet(stylesheet);

	return html`
		<span class="crumb">
			<a href="${getHref()}">
				<slot></slot>
			</a>
		</span>
	`;
});

const stylesheet = css`
	a {
		color: var(--color-brand-1);
		text-decoration: none;
		font-weight: 600;
		transition: color 180ms ease;
	}

	a:hover,
	a:focus-visible {
		color: var(--color-brand-1-1);
	}

	a:focus-visible {
		outline: 2px solid color-mix(in srgb, var(--color-brand-1) 50%, white 20%);
		outline-offset: 3px;
		border-radius: 0.25rem;
	}
	:host(:not(:last-child)) {
		.crumb::after {
			content: ' > ';
			display: inline-block;
			padding: 0 0.5em;
		}
	}
`;
