const MyElement = customElement(({ attrSignals }) => {
  const [heading, setHeading] = attrSignals['my-heading'];

  return html`<h2>${heading}</h2>`;
}, { observedAttributes: ['my-heading'] });