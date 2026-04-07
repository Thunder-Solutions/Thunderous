import { createSignal, customElement, html } from 'thunderous';

const MyElement = customElement(() => {
  const [count, setCount] = createSignal(0);

  // ...

  return html`<output>${count}</output>`;
});