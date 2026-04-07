import { createRegistry, customElement, html } from 'thunderous';

// create a global custom element registry
const registry = createRegistry();

const MyElement = customElement(() => {
  return html`<div>My Element</div>`;
});

// register the custom element with the registry
MyElement.register(registry);
