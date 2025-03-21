import { createSignal, css, customElement, derived, html } from 'thunderous';
import { theme } from '../_styles/theme';

export const DocPage = customElement(({ adoptStyleSheet, customCallback, connectedCallback, disconnectedCallback }) => {
	adoptStyleSheet(theme);
	adoptStyleSheet(styles);
	const [navOpen, setNavOpen] = createSignal(false);
	const navOpenClass = derived(() => (navOpen() ? 'open' : ''));
	const toggleNav = customCallback(() => {
		setNavOpen(!navOpen());
	});
	const openIfDesktop = () => {
		if (window.innerWidth >= 50 * 16) {
			setNavOpen(true);
		} else {
			setNavOpen(false);
		}
	};
	connectedCallback(() => {
		openIfDesktop();
		window.addEventListener('resize', openIfDesktop);
	});
	disconnectedCallback(() => {
		window.removeEventListener('resize', openIfDesktop);
	});
	return html`
		<th-page>
			<div class="doc-page">
				<button class="nav-toggle ${navOpenClass}" title="Menu" onclick="${toggleNav}">
					<svg class="bars-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
						<!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
						<path
							d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z"
						/>
					</svg>
					<svg class="x-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
						<!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
						<path
							d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"
						/>
					</svg>
				</button>
				<header inert="${derived(() => (navOpen() ? null : ''))}">
					<h1 class="site-heading">
						<th-invisible-link href="/">
							<img class="logo" src="/thunder-solutions-logo-light.svg" alt="Thunder Solutions Logo" />
							<span>Thunderous</span>
						</th-invisible-link>
					</h1>
					<nav>
						<ul>
							<li>
								<th-link href="/docs" class="link">Quick Start</th-link>
							</li>
							<li>
								<h3>Overview</h3>
								<ul>
									<li>
										<th-link href="/docs/defining-custom-elements" class="link">Defining Custom Elements</th-link>
									</li>
									<li>
										<th-link href="/docs/rendering" class="link">Rendering</th-link>
									</li>
									<li>
										<th-link href="/docs/lifecycle-methods" class="link">Lifecycle Methods</th-link>
									</li>
									<li>
										<th-link href="/docs/root-and-internals" class="link">Root and Element Internals</th-link>
									</li>
									<li>
										<th-link href="/docs/adopted-style-sheets" class="link">Adopted Style Sheets</th-link>
									</li>
									<li>
										<th-link href="/docs/event-binding" class="link">Event Binding</th-link>
									</li>
									<li>
										<th-link href="/docs/refs" class="link">Refs</th-link>
									</li>
									<li>
										<th-link href="/docs/registries" class="link">Registries</th-link>
									</li>
									<li>
										<th-link href="/docs/server-side-rendering" class="link">SSR</th-link>
									</li>
								</ul>
							</li>
							<li>
								<h3>Signals</h3>
								<ul>
									<li>
										<th-link href="/docs/signals" class="link">Signals Overview</th-link>
									</li>
									<li>
										<th-link href="/docs/binding-signals" class="link">Binding Signals</th-link>
									</li>
									<li>
										<th-link href="/docs/attribute-signals" class="link">Attribute Signals</th-link>
									</li>
									<li>
										<th-link href="/docs/property-signals" class="link">Property Signals</th-link>
									</li>
									<li>
										<th-link href="/docs/derived-signals" class="link">Derived Signals</th-link>
									</li>
									<li>
										<th-link href="/docs/effects" class="link">Effects</th-link>
									</li>
									<li>
										<th-link href="/docs/debugging-signals" class="link">Debugging Signals</th-link>
									</li>
								</ul>
							</li>
							<li>
								<h3>Major Releases</h3>
								<ul>
									<li>
										<th-link href="/docs/releases/2.0.0" class="link">2.0.0</th-link>
									</li>
									<li>
										<th-link href="/docs/releases/1.0.0" class="link">1.0.0</th-link>
									</li>
									<li>
										<th-link href="/docs/releases" class="link">View All Releases</th-link>
									</li>
								</ul>
							</li>
						</ul>
					</nav>
				</header>
				<div class="backdrop ${navOpenClass}" onclick="${toggleNav}"></div>
				<div class="main-container">
					<main>
						<slot></slot>
					</main>
					<th-footer></th-footer>
				</div>
			</div>
		</th-page>
	`;
});

const styles = css`
	.doc-page {
		height: 100%;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
	}
	.nav-toggle {
		height: 3em;
		width: 3em;
		position: fixed;
		top: 1.15em;
		right: 1em;
		cursor: pointer;
		background: none;
		border: none;
		color: var(--color-site-1-c);
		z-index: 1;
	}
	.nav-toggle:not(.open) .x-icon {
		display: none;
	}
	.nav-toggle.open .bars-icon {
		display: none;
	}
	svg {
		fill: currentColor;
	}
	header[inert] {
		left: -100%;
	}
	header {
		display: flex;
		position: absolute;
		flex-direction: column;
		align-items: end;
		background-color: var(--color-site-1-1);
		color: white;
		padding: 1em;
		padding-right: 2em;
		z-index: 1;
		height: 100%;
		box-sizing: border-box;
		top: 0;
		left: 0;
		transition: left 0.3s;
	}
	.backdrop {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 0;
	}
	.backdrop.open {
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
	}
	.main-container {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: minmax(0, 1fr) auto;
		min-height: 100vh;
	}
	header,
	main {
		overflow: auto;
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.1) var(--color-site-1-1);
	}
	.site-heading {
		margin: 0;
		font-size: 1.5em;
		display: flex;
		align-items: center;
		gap: 0.3em;
		border-bottom: 1px solid rgba(255, 255, 255, 0.15);
		padding-bottom: 0.5em;
		width: 100%;
		max-width: 9em;
	}
	.logo {
		height: 1.2em;
		width: 1.2em;
		object-fit: contain;
	}
	main {
		background-color: var(--color-site-1);
	}
	ul {
		list-style: none;
	}
	ul,
	li,
	h3 {
		margin: 0;
		padding: 0;
	}
	ul {
		display: grid;
		gap: 0.5em;
		padding: 1em 0;
	}
	li > ul {
		padding-left: 1em;
	}
	.link::part(a) {
		box-sizing: border-box;
	}
	main {
		grid-row-end: span 2;
	}
	@media (min-width: 50em) {
		.doc-page {
			grid-template-columns: minmax(16em, 1fr) minmax(0, 2fr);
			grid-template-rows: minmax(0, 1fr) auto;
		}
		header {
			position: static;
			border-right: 0.2em solid var(--color-site-1);
		}
		.nav-toggle {
			display: none;
		}
		.backdrop {
			display: none;
		}
	}
`;
