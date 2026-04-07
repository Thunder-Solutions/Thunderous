const MyElement = customElement(({ root }) => {
  return html`
    <button class="primary">
      ${root.innerHTML}
    </button>
  `;
}, { attachShadow: false });
