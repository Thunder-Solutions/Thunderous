import { HTMLCustomElement, customElement } from 'thunderous';

// Define properties for your custom element.
type MyElementProps = {
  foo: string;
  bar: number;
};

// Extend the native HTMLElementTagNameMap to include your custom element.
declare global {
  interface HTMLElementTagNameMap {

    // Pass your props to the HTMLCustomElement type.
    'my-element': HTMLCustomElement<MyElementProps>;
  }
}

const MyElement = customElement<MyElementProps>(({ propSignals }) => {
  const [foo] = propSignals.prop.init('');
  const [bar] = propSignals.prop.init(0);
  return html`
    <p>Foo: ${foo}</p>
    <p>Bar: ${bar}</p>
  `;
});

MyElement.define('my-element');

// Because we extended the HTMLElementTagNameMap,
// the below will automatically be typed accordingly.
const myElement = document.createElement('my-element');
myElement.foo = 'Hello';
myElement.bar = 42;
