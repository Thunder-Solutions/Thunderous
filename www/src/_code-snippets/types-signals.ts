import { Signal, SignalGetter, SignalSetter, createSignal } from 'thunderous';

const signal: Signal<string> = createSignal('');

const foo: SignalGetter<string> = signal[0];
const setFoo: SignalSetter<string> = signal[1];
