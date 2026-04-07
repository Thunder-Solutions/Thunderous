const MyElement = customElement(({
  adoptedCallback,
  connectedCallback,
  disconnectedCallback,
  attributeChangedCallback,
}) => {

  // ...

  return html`<div>My Element</div>`;
});