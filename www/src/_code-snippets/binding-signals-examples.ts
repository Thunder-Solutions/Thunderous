const MyElement = customElement(() => {
  const [count, setCount] = createSignal(0);

  // ...

  return html`
    <div>${count()}</div> <!-- template never updates -->
    <div>${count}</div> <!-- template updates with the signal -->
  `;
});