import { customElement, html, css, createSignal } from 'thunderous';

const MyElement = customElement(({ adoptStyleSheet }) => {
  const [count, setCount] = createSignal(0);
  const increment = () => setCount(count() + 1);
  adoptStyleSheet(myStyleSheet);
  return html`
    <button onclick="${increment}">Increment</button>
    <output>${count}</output>
  `;
});

const myStyleSheet = css`
  :host {
    display: block;
    font-family: sans-serif;
  }
`;

MyElement.define('my-element');
