import { derived, css, html, customElement, onServerDefine } from 'thunderous';

onServerDefine((tagName, htmlString) => {
	console.log(`Server defined: ${tagName}`);
	console.log(htmlString);
});

const MyElement = customElement<{ count: number }>(
	({ attrSignals, propSignals, customCallback, internals, adoptStyleSheet }) => {
		const [count, setCount] = propSignals.count;
		setCount(0);
		const [heading] = attrSignals.heading;

		const redValue = derived(() => {
			const value = count() * 10;
			return value > 255 ? 255 : value;
		});

		// internals.setFormValue(String(count()));

		const increment = customCallback(() => {
			setCount(count() + 1);
			internals.setFormValue(String(count()));
		});

		adoptStyleSheet(css`
			:host {
				display: grid;
				gap: 0.5rem;
				padding: 1rem;
				margin: 1rem 0;
				background-color: rgb(${redValue}, 0, 0);
				color: white;
				font-size: 2rem;
				font-family: sans-serif;
			}
			h1 {
				margin: 0;
			}
			button {
				font: inherit;
				padding: 0.5rem;
			}
		`);

		return html`
			<div><h1>${heading}</h1></div>
			<button onclick="${increment}">increment</button>
			<output>count: ${count}</output>
			<div>
				<slot></slot>
			</div>
			<span>this is a scoped element:</span>
			<nested-element></nested-element>
		`;
	},
	{
		formAssociated: true,
		observedAttributes: ['heading'],
		attributesAsProperties: [['count', Number]],
	},
);

MyElement.define('my-element');
