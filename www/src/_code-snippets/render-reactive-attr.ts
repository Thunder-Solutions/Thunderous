import { customElement, html, derived, createSignal } from 'thunderous';

const MyElement = customElement(() => {
  const [cond, setCond] = createSignal(true);

  return html`
    <button class="primary ${derived(() => cond() ? 'primary--active' : '')}">
      Click me
    </button>
  `;
});

// alternatively, for a cleaner template...

const MyElement2 = customElement(() => {
  const [cond, setCond] = createSignal(true);
  const activeClass = derived(() => cond() ? 'primary--active' : '');

  return html`
    <button class="primary ${activeClass}">
      Click me
    </button>
  `;
});
