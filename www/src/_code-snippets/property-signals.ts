const MyElement = customElement<{ count: number }>(({ propSignals }) => {

  // The signal and property are defined automatically when the proxy is accessed
  const [count, setCount] = propSignals.count;
  setCount(0);

  // As of v2.2.0, you can also initialize the signal immediately
  const [count, setCount] = propSignals.count.init(0);

  // setCount() will also update the DOM property,
  // eg. `document.querySelector('my-element').count`

  return html`<output>${count}</output>`;
});
