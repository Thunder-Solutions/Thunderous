import { css, customElement, html } from 'thunderous';

export const Crumb = customElement(({ adoptStyleSheet, attrSignals }) => {
	const { href } = attrSignals;
	const [getHref] = href ?? [() => ''];
	adoptStyleSheet(stylesheet);
	return html`
		<span class="crumb">
			<a href=${getHref()}>
				<slot></slot>
			</a>
		</span>
	`;
});

const stylesheet = css`
	a {
		color: var(--link);
		text-decoration: none;
		font-weight: 600;
		transition: color 180ms ease;
	}

	a:hover,
	a:focus-visible {
		color: var(--link-hover);
	}

	a:focus-visible {
		outline: 2px solid color-mix(in srgb, var(--link) 50%, white 20%);
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
