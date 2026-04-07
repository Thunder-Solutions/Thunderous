import { customElement, html } from 'thunderous';

const MyElement = customElement(() => {
  const list = [{ id: 1, text: 'Item 1' }, { id: 2, text: 'Item 2' }];

  return html`
    <ul>
      ${list.map((item) => html`<li key="${item.id}">${item.text}</li>`)}
    </ul>
  `;
});

