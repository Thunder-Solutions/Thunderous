import { createRegistry, customElement, html } from 'thunderous';
import { MyElement } from './my-element';
import { registry } from './registry';

const MyOtherElement = customElement(({ connectedCallback }) => {

  connectedCallback(() => {

    // get the defined tag name of the custom element
    const tagName = registry.getTagName(MyElement);

    console.log(tagName); // MY-ELEMENT
  });

  return html`<div>My Other Element</div>`;
});

// this may be defined in the consumer's project
MyElement.define('my-element');
