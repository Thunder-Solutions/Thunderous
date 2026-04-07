import { customElement, css } from 'thunderous';

const myStyleSheet = css`
  :host {
    display: block;
    font-family: sans-serif;
  }
`;

const MyElement = customElement(({ adoptStyleSheet }) => {

  adoptStyleSheet(myStyleSheet);

  // ...
});