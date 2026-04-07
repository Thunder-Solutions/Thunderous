import { createSignal } from 'thunderous';

const [count, setCount] = createSignal(0);

console.log(count()); // 0

setCount(1);

console.log(count()) // 1
