import { css, customElement, html } from 'thunderous';

export const ErrorMessage = customElement(({ attrSignals, adoptStyleSheet }) => {
	const [heading] = attrSignals['heading'];
	adoptStyleSheet(styles);
	return html`
		<div>
			<h1>${heading}</h1>
			<slot></slot>
		</div>
	`;
});

const styles = css`
	:host {
		display: flex;
		place-content: center;
		place-items: center;
		text-align: center;
		padding: 2em;
		padding-bottom: 4em;
		height: 100%;
		box-sizing: border-box;
	}
	h1 {
		font-size: 4em;
		margin: 0;
	}
`;
