import { customElement, html, css } from 'thunderous';

export const MyComponent = customElement(({ clientOnlyCallback, adoptStylesheet }) => {
	clientOnlyCallback(() => {
		console.log('MyComponent has been mounted on the client side.');
	});
	adoptStylesheet(stylesheet);
	return html`
		<div class="my-component">
			<p>
				This is an example component. Refer to the <a href="https://thunderous.dev">documentation</a> for more
				information on how to use Thunderous.
			</p>
			<slot></slot>
		</div>
	`;
});

const stylesheet = css`
	.my-component {
		--bg-1: rgba(255, 255, 255, 0.72);
		--bg-2: rgba(255, 255, 255, 0.5);
		--border: rgba(255, 255, 255, 0.35);
		--text: #eaf2ff;
		--muted: #b8c7e6;
		--link: #7dd3fc;
		--link-hover: #c4b5fd;
		--shadow: 0 18px 50px rgba(15, 23, 42, 0.35);

		position: relative;
		overflow: hidden;
		padding: 1.25rem 1.5rem;
		border-radius: 20px;
		border: 1px solid var(--border);
		background: linear-gradient(135deg, rgba(99, 102, 241, 0.22), rgba(14, 165, 233, 0.16)),
			linear-gradient(180deg, var(--bg-1), var(--bg-2));
		backdrop-filter: blur(18px) saturate(160%);
		-webkit-backdrop-filter: blur(18px) saturate(160%);
		box-shadow: var(--shadow);
		isolation: isolate;
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
		position: relative;
		color: var(--link);
		font-weight: 600;
		text-decoration: none;
		transition:
			color 180ms ease,
			text-shadow 180ms ease,
			transform 180ms ease;
	}

	.my-component a::after {
		content: '';
		position: absolute;
		left: 0;
		bottom: -2px;
		width: 100%;
		height: 2px;
		border-radius: 999px;
		background: linear-gradient(90deg, var(--link), var(--link-hover));
		transform: scaleX(0.35);
		transform-origin: left;
		transition: transform 220ms ease;
		opacity: 0.9;
	}

	.my-component a:hover,
	.my-component a:focus-visible {
		color: var(--link-hover);
		text-shadow: 0 0 18px rgba(196, 181, 253, 0.45);
	}

	.my-component a:hover::after,
	.my-component a:focus-visible::after {
		transform: scaleX(1);
	}

	.my-component a:focus-visible {
		outline: 2px solid rgba(125, 211, 252, 0.55);
		outline-offset: 4px;
		border-radius: 4px;
	}

	@media (prefers-color-scheme: light) {
		.my-component {
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
`;
