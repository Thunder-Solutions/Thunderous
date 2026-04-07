const MyElement = customElement(({ connectedCallback, refs }) => {

  console.log(refs.heading); // null

  connectedCallback(() => {
    console.log(refs.heading?.textContent); // hello world
  });

  return html`<h2 ref="heading">hello world</h2>`;
});