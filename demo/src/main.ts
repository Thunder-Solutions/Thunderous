import {
	derived,
	css,
	html,
	customElement,
	createRegistry,
	onServerDefine,
	insertTemplates,
	clientOnlyCallback,
} from 'thunderous';

const mockHTML = /* html */ `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Document</title>
</head>
<body>
	<my-element heading="title A"></my-element>
	<button>toggle heading</button>
</body>
</html>
`;

onServerDefine((tagName, htmlString) => {
	console.log('onServerDefine:', tagName);
	console.log(insertTemplates(tagName, htmlString, mockHTML));
});

const globalRegistry = createRegistry();

const NestedElement = customElement(
	({ attrSignals }) => {
		const [text] = attrSignals.text;
		return html`<strong>${text}</strong>`;
	},
	{
		shadowRootOptions: { mode: 'open' },
	},
);

const registry = createRegistry({ scoped: true });
registry.define('nested-element', NestedElement);

const MyElement = customElement<{ count: number }>(
	({ attrSignals, propSignals, customCallback, internals, clientOnlyCallback, adoptStyleSheet }) => {
		const [count, setCount] = propSignals.count;
		setCount(0);
		const [heading] = attrSignals.heading;

		const redValue = derived(() => {
			const value = count() * 10;
			return value > 255 ? 255 : value;
		});

		clientOnlyCallback(() => {
			internals.setFormValue(String(count()));
		});

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
			<nested-element text="test"></nested-element>
		`;
	},
	{
		formAssociated: true,
		observedAttributes: ['heading'],
		attributesAsProperties: [['count', Number]],
		shadowRootOptions: { registry },
	},
).register(globalRegistry);

console.log('defined:', MyElement);
MyElement.define('my-element');

clientOnlyCallback(() => {
	requestAnimationFrame(() => {
		const tagName = globalRegistry.getTagName(MyElement);
		console.log(tagName);
	});

	const myElement = document.querySelector('my-element')!;

	document.querySelector('button')!.addEventListener('click', () => {
		const prev = myElement.getAttribute('heading');
		myElement.setAttribute('heading', prev === 'title A' ? 'title B' : 'title A');
	});
});
