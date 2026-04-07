const [count, setCount] = createSignal(0, {
  debugMode: true,
  label: 'count signal',
});

setCount(1, {
  debugMode: true,
  label: 'start count',
});

const newCount = count({
  debugMode: true,
  label: 'new count',
});