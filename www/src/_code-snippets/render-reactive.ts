import { customElement, html, derived, createSignal } from 'thunderous';

const MyElement = customElement(() => {
  const [cond, setCond] = createSignal(true);
  const [list, setList] = createSignal([{ id: 1, text: 'Item 1' }, { id: 2, text: 'Item 2' }]);

  return html`
    <p>
      ${derived(() => cond() ? html`<span>True</span>` : html`<span>False</span>`)}
    </p>
    <ul>
      ${derived(() => list().map((item) => html`<li key="${item.id}">${item.text}</li>`))}
    </ul>
  `;
});
