# Thunderous

Thunderous is a library for writing web components in a functional style, reducing the boilerplate, while signals make it better for managing and sharing state.

Each component renders only once, then binds signals to DOM nodes for direct updates with _thunderous_ efficiency.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Documentation](#documentation)
- [Development](#development)
- [License](#license)

## Installation

Install Thunderous via npm:

```sh
npm install thunderous
```

## Usage

Thunderous makes it easy to define smaller components with less noise.

<!-- prettier-ignore-start -->
```ts
import { customElement, html, css, createSignal } from 'thunderous';

const myStyleSheet = css`
  :host {
    display: block;
    font-family: sans-serif;
  }
`;

const MyElement = customElement(({ refs, adoptStyleSheet }) => {
  const [count, setCount] = createSignal(0);
  const increment = () => setCount(count() + 1);
  adoptStyleSheet(myStyleSheet);
  return html`
    <button onclick="${increment}">Increment</button>
    <output>${count}</output>
  `;
});

MyElement.define('my-element');
```
<!-- prettier-ignore-end -->

## Documentation

Please consult the [documentation](https://thunderous.dev) to learn how to build web components with Thunderous.

## Contributing

### Local Server

To see it in action, start the demo server with:

```sh
npm run demo
```

The demo's `package.json` points to the parent directory with the `file:` prefix. To preview the updated library code, you must run `npm run build` at the top level.

Please open a corresponding issue for any pull request you'd like to raise.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
