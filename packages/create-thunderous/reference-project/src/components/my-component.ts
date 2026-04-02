import { customElement, html, css } from 'thunderous';

export const MyComponent = customElement(({ clientOnlyCallback, adoptStyleSheet }) => {
	clientOnlyCallback(() => {
		console.log('MyComponent has been mounted on the client side.');
	});
	adoptStyleSheet(stylesheet);
	return html`
		<div class="my-component">
			<slot></slot>
			<a href="https://thunderous.dev">Learn More</a>
		</div>
	`;
});

const stylesheet = css`
	:host {
		display: block;
		font-size: 2rem;

		--bg-1: rgba(255, 255, 255, 0.72);
		--bg-2: rgba(255, 255, 255, 0.5);
		--border: rgba(255, 255, 255, 0.35);
		--text: #1e293b;
		--muted: #b8c7e6;
		--link: #7dd3fc;
		--link-hover: #c4b5fd;
		--shadow: 0 18px 50px rgba(15, 23, 42, 0.35);

		@media (prefers-color-scheme: light) {
			--bg-1: rgba(255, 255, 255, 0.88);
			--bg-2: rgba(240, 249, 255, 0.74);
			--border: rgba(99, 102, 241, 0.16);
			--text: #1e293b;
			--muted: #475569;
			--link: #2563eb;
			--link-hover: #7c3aed;
			--shadow: 0 18px 40px rgba(51, 65, 85, 0.14);
		}
	}

	::slotted(*) {
		margin: 0;
		color: var(--text);
	}

	.my-component {
		text-align: center;
		position: relative;
		overflow: hidden;
		padding: 1.25em 1.5em;
		border-radius: 20px;
		border: 1px solid var(--border);
		background:
			linear-gradient(135deg, rgba(99, 102, 241, 0.22), rgba(14, 165, 233, 0.16)),
			linear-gradient(180deg, var(--bg-1), var(--bg-2));
		backdrop-filter: blur(18px) saturate(160%);
		-webkit-backdrop-filter: blur(18px) saturate(160%);
		box-shadow: var(--shadow);
		isolation: isolate;
		margin: 1em auto;
		max-width: 20em;
	}

	.my-component::before,
	.my-component::after {
		content: '';
		position: absolute;
		inset: auto;
		border-radius: 999px;
		filter: blur(10px);
		opacity: 0.8;
		z-index: -1;
		pointer-events: none;
	}

	.my-component::before {
		top: -60px;
		right: -40px;
		width: 180px;
		height: 180px;
		background: radial-gradient(circle, rgba(125, 211, 252, 0.35), transparent 65%);
	}

	.my-component::after {
		bottom: -70px;
		left: -30px;
		width: 160px;
		height: 160px;
		background: radial-gradient(circle, rgba(196, 181, 253, 0.28), transparent 65%);
	}

	.my-component p {
		margin: 0;
		font-size: 1rem;
		line-height: 1.75;
		letter-spacing: 0.01em;
		color: var(--text);
		text-wrap: pretty;
	}

	.my-component a {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 1rem;
		padding: 0.85rem 1.25rem;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--border) 85%, white 15%);
		background:
			linear-gradient(135deg, var(--link), var(--link-hover)), linear-gradient(180deg, var(--bg-1), var(--bg-2));
		box-shadow:
			0 10px 30px color-mix(in srgb, var(--link-hover) 28%, transparent),
			inset 0 1px 0 color-mix(in srgb, white 35%, transparent);
		color: var(--text);
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

	.my-component a:hover,
	.my-component a:focus-visible {
		transform: translateY(-2px);
		filter: brightness(1.05);
		border-color: color-mix(in srgb, var(--link) 55%, var(--border));
		box-shadow:
			0 16px 36px color-mix(in srgb, var(--link-hover) 36%, transparent),
			inset 0 1px 0 color-mix(in srgb, white 45%, transparent);
		color: var(--text);
	}

	.my-component a:active {
		transform: translateY(0);
		box-shadow:
			0 8px 20px color-mix(in srgb, var(--link-hover) 22%, transparent),
			inset 0 1px 0 color-mix(in srgb, white 25%, transparent);
	}

	.my-component a:focus-visible {
		outline: 2px solid color-mix(in srgb, var(--link) 65%, white 35%);
		outline-offset: 4px;
	}

	.my-component a::after {
		content: '→';
		font-size: 0.95em;
		transition: transform 180ms ease;
	}

	.my-component a:hover::after,
	.my-component a:focus-visible::after {
		transform: translateX(3px);
	}
`;
