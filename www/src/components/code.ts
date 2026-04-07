import { html, css, customElement, createEffect } from 'thunderous';
import { theme } from '../styles/theme';
import { highlight } from '../styles/highlight';

export const Code = customElement(({ adoptStyleSheet }) => {
	adoptStyleSheet(theme);
	adoptStyleSheet(codeStyles);
	return html`<code><slot></slot></code>`;
});

const codeStyles = css`
	code {
		background-color: rgba(255, 255, 255, 0.05);
		border-radius: 0.5em;
		padding: 0.2em;
	}
`;

export const CodeBlock = customElement(({ adoptStyleSheet, attrSignals, connectedCallback, elementRef, refs }) => {
	adoptStyleSheet(theme);
	adoptStyleSheet(highlight);
	adoptStyleSheet(codeBlockStyles);
	const [lang] = attrSignals.lang;
	connectedCallback(() => {
		const code = refs.code;
		if (code === null) return;

		// Trim leading and trailing whitespace
		elementRef.innerHTML = elementRef.innerHTML.trim();

		// Move slotted code snippet into the shadow DOM where we can encapsulate the styles
		code.replaceChildren(...elementRef.childNodes);

		createEffect(() => {
			if (lang() === null) {
				code.className = 'no-highlight hljs';
			} else {
				code.className = `language-${lang()}`;
			}
		});
	});
	return html` <pre><code ref="code"></code></pre> `;
});

const codeBlockStyles = css`
	pre {
		background-color: rgba(255, 255, 255, 0.05);
		border-radius: 0.5em;
		margin: 0;
		overflow-x: auto;
		white-space: initial;
	}
	code {
		padding: 1em;
		display: block;
		white-space: pre;
	}
`;
