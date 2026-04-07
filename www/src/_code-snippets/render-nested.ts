import { customElement, html } from 'thunderous';

const MyElement = customElement(() => {
  const cond = true;

  return html`
    <p>
      ${cond ? html`<span>True</span>` : html`<span>False</span>`}
    </p>
  `;
});