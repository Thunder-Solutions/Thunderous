import { customElement, html, createSignal } from 'thunderous';


// Thunderous functional component:
const FnElement = customElement(() => {
  const [count, setCount] = createSignal(0);
  const increment = () => setCount(count() + 1);
  return html`
    <button onclick="${increment}">Increment</button>
    <output>${count}</output>
  `;
});


// Traditional class component with Thunderous helpers:
class ClssElement extends HTMLElement {
  #shadowRoot = this.attachShadow({ mode: 'closed' });
  #count = createSignal(0);
  increment() {
    const [count, setCount] = this.#count;
    setCount(count() + 1);
  }
  constructor() {
    super();
    const [count] = this.#count;
    this.#shadowRoot.append(html`
      <button onclick="${this.increment}">Increment</button>
      <output>${count}</output>
    `);
  }
}
