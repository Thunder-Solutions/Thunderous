import { customElement, html, css, createSignal } from 'thunderous';
import { theme } from '../theme';

export const Feature = customElement(({ adoptStyleSheet, attrSignals }) => {
	const [getHref] = attrSignals['href'] ?? createSignal('');
	const [getButtonText] = attrSignals['buttontext'] ?? createSignal('Learn More');

	adoptStyleSheet(theme);
	adoptStyleSheet(stylesheet);

	return html`
		<div class="feature">
			<slot></slot>
			${getHref() !== '' ? html`<a href=${getHref()}>${getButtonText()}</a>` : ''}
		</div>
	`;
});

const stylesheet = css`
	:host {
		display: block;
		font-size: 2rem;
	}

	::slotted(*) {
		margin: 0;
		color: var(--color-neutral-2);
	}

	.feature {
		text-align: center;
		position: relative;
		overflow: hidden;
		padding: 2em 3em;
		border-radius: 20px;
		border: 1px solid var(--color-surface-2-2);
		background:
			linear-gradient(135deg, rgba(99, 102, 241, 0.22), rgba(14, 165, 233, 0.16)),
			linear-gradient(180deg, var(--color-surface-2), var(--color-surface-2-1));
		backdrop-filter: blur(18px) saturate(160%);
		-webkit-backdrop-filter: blur(18px) saturate(160%);
		box-shadow: var(--shadow-2);
		isolation: isolate;
		margin: 1em auto;
		max-width: 20em;
	}

	.feature::before,
	.feature::after {
		content: '';
		position: absolute;
		inset: auto;
		border-radius: 999px;
		filter: blur(10px);
		opacity: 0.8;
		z-index: -1;
		pointer-events: none;
	}

	.feature::before {
		top: -60px;
		right: -40px;
		width: 180px;
		height: 180px;
		background: radial-gradient(circle, rgba(125, 211, 252, 0.35), transparent 65%);
	}

	.feature::after {
		bottom: -70px;
		left: -30px;
		width: 160px;
		height: 160px;
		background: radial-gradient(circle, rgba(196, 181, 253, 0.28), transparent 65%);
	}

	.feature p {
		margin: 0;
		font-size: 1rem;
		line-height: 1.75;
		letter-spacing: 0.01em;
		color: var(--color-neutral-2);
		text-wrap: pretty;
	}

	.feature a {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5em;
		margin: 1.5em 0 0.5em;
		padding: 0.85em 1.25em;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--color-surface-2-2) 85%, white 15%);
		background:
			linear-gradient(135deg, var(--color-brand-2), var(--color-brand-2-1)),
			linear-gradient(180deg, var(--color-surface-2), var(--color-surface-2-1));
		box-shadow:
			0 10px 30px color-mix(in srgb, var(--color-brand-2-1) 28%, transparent),
			inset 0 1px 0 color-mix(in srgb, white 35%, transparent);
		color: var(--color-neutral-2);
		font-weight: 700;
		line-height: 1;
		letter-spacing: 0.01em;
		text-decoration: none;
		white-space: nowrap;
		transition:
			transform 180ms ease,
			box-shadow 180ms ease,
			filter 180ms ease,
			border-color 180ms ease,
			color 180ms ease;
	}

	.feature a:hover,
	.feature a:focus-visible {
		transform: translateY(-2px);
		filter: brightness(1.05);
		border-color: color-mix(in srgb, var(--color-brand-2) 55%, var(--color-surface-2-2));
		box-shadow:
			0 16px 36px color-mix(in srgb, var(--color-brand-2-1) 36%, transparent),
			inset 0 1px 0 color-mix(in srgb, white 45%, transparent);
		color: var(--color-neutral-2);
	}

	.feature a:active {
		transform: translateY(0);
		box-shadow:
			0 8px 20px color-mix(in srgb, var(--color-brand-2-1) 22%, transparent),
			inset 0 1px 0 color-mix(in srgb, white 25%, transparent);
	}

	.feature a:focus-visible {
		outline: 2px solid color-mix(in srgb, var(--color-brand-2) 65%, white 35%);
		outline-offset: 4px;
	}

	.feature a::after {
		content: '→';
		font-size: 0.95em;
		transition: transform 180ms ease;
	}

	.feature a:hover::after,
	.feature a:focus-visible::after {
		transform: translateX(3px);
	}
`;
