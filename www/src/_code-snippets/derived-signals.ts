import { derived, createSignal } from 'thunderous';

const [count, setCount] = createSignal(0);

const timesTen = derived(() => count() * 10);

console.log(timesTen()); // 0

setCount(10);

console.log(timesTen()); // 100