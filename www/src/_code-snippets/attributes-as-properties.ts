const MyElement = customElement<{ count: number }>(({ propSignals }) => {
  const [count, setCount] = propSignals.count.init(0);

  // setCount() will update both the DOM property, AND the HTML attribute.

  return html`<output>${count}</output>`;
}, { attributesAsProperties: [['count', Number]] });