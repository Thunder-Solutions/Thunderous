const MyElement = customElement(({ connectedCallback }) => {

  connectedCallback(() => {
    console.log('Connected!');
  });

  return html`<div>My Element</div>`;
});