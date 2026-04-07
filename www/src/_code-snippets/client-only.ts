import { customElement, html } from 'thunderous';

const MyElement = customElement(({ clientOnlyCallback }) => {

  // This will be run in the constructor of the custom element.
  clientOnlyCallback(() => {
    console.log('This will only run on the client.');
  });

  return html`<div>My Element</div>`;
});


// ------ OR ------


import { clientOnlyCallback } from 'thunderous';

// This will run immediately, and may be awaited if necessary.
clientOnlyCallback(() => {
  console.log('This will only run on the client.');
});
