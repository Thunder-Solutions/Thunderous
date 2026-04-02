import { customElement, html, css } from 'thunderous';

export const Page = customElement(
	({ adoptStyleSheet, propSignals }) => {
		adoptStyleSheet(stylesheet);
		const { prominent } = propSignals;
		const prominentClass = prominent ? 'prominent' : '';
		return html`
			<div class="page ${prominentClass}">
				<header>
					<slot name="header"></slot>
					<nav class="header-nav">
						<a href="/">Home</a>
						<a href="/about">About Us</a>
						<a href="/about/contact">Contact Us</a>
					</nav>
				</header>
				<main>
					<slot></slot>
				</main>
				<footer>
					<nav class="footer-nav">
						<a href="/">Home</a> | <a href="/about">About Us</a> | <a href="/about/contact">Contact Us</a>
					</nav>
					<slot name="footer"></slot>
					<small>&copy; ${new Date().getFullYear()} &mdash; Powered by <a href="https://thunderous.dev">Thunderous</a></small>
				</footer>
			</div>
		`;
	},
	{
		attributesAsProperties: [['prominent', Boolean]],
	},
);

const stylesheet = css`
	:host {
		display: block;
		height: 100%;
		width: 100%;

		--bg-1: rgba(255, 255, 255, 0.06);
		--bg-2: rgba(255, 255, 255, 0.03);
		--border: rgba(255, 255, 255, 0.1);
		--text: #e5eefc;
		--muted: #9fb0d1;
		--link: #8fb4ff;
		--link-hover: #2a4692;
		--shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
	}
	.page {
		display: grid;
		grid-template-rows: auto 1fr auto;
		box-sizing: border-box;
		min-width: 320px;
		min-height: 100vh;
		background:
			radial-gradient(circle at top left, rgba(99, 102, 241, 0.22), transparent 30%),
			radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.18), transparent 35%),
			linear-gradient(180deg, #0f172a 0%, #111827 45%, #0b1120 100%);
		color: #eaf2ff;
		font-family: 'Plus Jakarta Sans', Inter, ui-sans-serif, system-ui, sans-serif;
		font-size: 1rem;
		line-height: 1.6;
		font-weight: 400;
		letter-spacing: 0.01em;
		font-synthesis: none;
		text-rendering: optimizeLegibility;
		-moz-osx-font-smoothing: grayscale;
		-webkit-font-smoothing: antialiased;
	}
	.page.prominent {
		align-items: center;
	}
	.header-nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
		padding: 0.75rem 1rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--bg-1) 88%, transparent),
			color-mix(in srgb, var(--bg-2) 92%, transparent)
		);
		backdrop-filter: blur(18px) saturate(160%);
		-webkit-backdrop-filter: blur(18px) saturate(160%);
		box-shadow: var(--shadow);
	}

	.header-nav a {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.7rem 1rem;
		border-radius: 999px;
		color: var(--text);
		font-weight: 600;
		line-height: 1;
		letter-spacing: 0.01em;
		text-decoration: none;
		transition:
			transform 180ms ease,
			background 180ms ease,
			box-shadow 180ms ease,
			color 180ms ease;
	}

	.header-nav a::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background: linear-gradient(135deg, var(--link), var(--link-hover));
		opacity: 0;
		transform: scale(0.96);
		transition:
			opacity 180ms ease,
			transform 180ms ease;
		z-index: -1;
	}

	.header-nav a:hover,
	.header-nav a:focus-visible {
		color: var(--text);
		transform: translateY(-1px);
		box-shadow:
			0 10px 24px color-mix(in srgb, var(--link-hover) 22%, transparent),
			inset 0 1px 0 color-mix(in srgb, white 30%, transparent);
	}

	.header-nav a:hover::before,
	.header-nav a:focus-visible::before {
		opacity: 1;
		transform: scale(1);
	}

	.header-nav a:active {
		transform: translateY(0);
	}

	.header-nav a:focus-visible {
		outline: 2px solid color-mix(in srgb, var(--link) 65%, white 35%);
		outline-offset: 4px;
	}

	header {
		padding: 1em 1.5em;
	}
	main {
		padding: 3em 1.5em;
	}

	footer {
		display: grid;
		place-items: center;
		gap: 1.5rem;
		padding: 2rem 1.5rem;
		border-top: 1px solid var(--border);
		background: linear-gradient(180deg, var(--bg-2), transparent);
		color: var(--muted);
	}

	.footer-nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
		padding: 0;
		border: 0;
		border-radius: 0;
		background: none;
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
		box-shadow: none;
	}

	.footer-nav a {
		position: relative;
		display: inline-flex;
		align-items: center;
		padding: 0.35rem 0.2rem;
		border-radius: 0.5rem;
		color: var(--muted);
		font-weight: 500;
		text-decoration: none;
		transition:
			color 180ms ease,
			background-color 180ms ease;
	}

	.footer-nav a::before {
		content: none;
	}

	.footer-nav a:hover,
	.footer-nav a:focus-visible {
		color: var(--text);
		background: color-mix(in srgb, var(--bg-1) 70%, transparent);
		box-shadow: none;
		transform: none;
	}

	.footer-nav a:active {
		transform: none;
	}

	.footer-nav a:focus-visible {
		outline: 2px solid color-mix(in srgb, var(--link) 50%, white 20%);
		outline-offset: 3px;
	}

	footer small {
		display: block;
		color: var(--muted);
		font-size: 0.875rem;
		line-height: 1.6;
	}

	footer small a {
		color: var(--link);
		text-decoration: none;
		font-weight: 600;
		transition: color 180ms ease;
	}

	footer small a:hover,
	footer small a:focus-visible {
		color: var(--link-hover);
	}

	footer small a:focus-visible {
		outline: 2px solid color-mix(in srgb, var(--link) 50%, white 20%);
		outline-offset: 3px;
		border-radius: 0.25rem;
	}
`;
