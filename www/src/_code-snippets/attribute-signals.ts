const MyElement = customElement(({ attrSignals }) => {
  const [heading, setHeading] = attrSignals['my-heading'];

  // setHeading() will also update the `my-heading` attribute in the HTML.

  return html`<h2>${heading}</h2>`;
});