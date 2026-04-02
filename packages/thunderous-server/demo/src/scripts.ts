import { customElement, html } from 'thunderous';

export const MyComponent = customElement(({ clientOnlyCallback }) => {
	console.log('MyComponent initialized.');
	clientOnlyCallback(() => {
		console.log('MyComponent has been mounted on the client side.');
	});
	return html`<p>This is a demo component from scripts.ts!</p>`;
});
