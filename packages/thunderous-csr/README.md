# Thunderous CSR (Client Side Rendering)

A package for creating client-side rendered applications with minimal overhead. It combines both MPA and SPA patterns to gain the benefits of both approaches.

## How it works

When a user first lands on any page, they should get the fully rendered HTML from the server. **This is the MPA pattern.**

> [!NOTE]
> You must bring your own server; Thunderous CSR does _not_ cover this. If you want a super easy way to get started, check out [`thunderous-server`](../thunderous-server).

When the user navigates to another page, the CSR package will intercept the navigation and apply partial updates as needed, instead of full page loads. **This is the SPA pattern.**

### Why do you need both?

Say you have two pages:

```html
<!-- page1.html -->
<html>
  <body>
    <h1>Page 1</h1>
    <a href="/page2">Go to Page 2</a>
  </body>
</html>
```

```html
<!-- page2.html -->
<html>
  <body>
    <h1>Page 2</h1>
    <a href="/page1">Go to Page 1</a>
  </body>
</html>
```

These are very similar pages, but they differ slightly. With a pure SPA approach, you would either need both pages' content in a single document to toggle visibility based on the current route, or bundle the templates with the JavaScript and render them on demand.

Thunderous CSR is simpler than that.

```js
// main.js
import { View } from 'thunderous-csr';
View.define('t-view'); // You can use any tag name you want
```

```html
<!-- page1.html -->
<html>
  <body>
    <!-- Notice the ID matches the ID in page2.html -->
    <t-view id="main-track">
      <h1>Page 1</h1>
      <a href="/page2">Go to Page 2</a>
    </t-view>
    <script type="module" src="./main.js"></script>
  </body>
</html>
```

```html
<!-- page2.html -->
<html>
  <body>
    <t-view id="main-track">
      <h1>Page 2</h1>
      <a href="/page1">Go to Page 1</a>
    </t-view>
    <script type="module" src="./main.js"></script>
  </body>
</html>
```

The `<t-view>` element is a custom element that will handle the navigation and partial updates. When navigating, it looks for a matching `<t-view>` element with the same ID at the destination, and swaps in its content.

> [!IMPORTANT]
> The ID attribute is _required_.

That's it! There's no additional link components or special attributes, and no complex route configuration. Since it leverages the [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation), it works for [any navigation method](https://github.com/WICG/navigation-api?tab=readme-ov-file#appendix-types-of-navigations), including but not limited to:

- Anchor tag clicks
- Programmatic navigation
- Browser back/forward buttons
- Direct URL entry

### How it handles misshapen HTML

- If the destination doesn't have a matching `<t-view>` element, then the given `<t-view>` will log a warning and remove itself from the DOM.
- If the full HTML response doesn't exactly match the client-rendered HTML after applying the partial update, then it will log a warning and render the entire `<body>` element.

## More features

The `<t-view>` element has three distinct states represented by CSS classes:

- `pending`
- `ready`
- `error`

`pending` and `ready` are pretty self-explanatory, but to clarify: the `error` state is when the view encounters an error during navigation. This does nothing special other than set the CSS class.

The `pending` state will show an overlay over the view to indicate that it is loading. By default, it's a simple semi-transparent overlay, but you can customize it by inserting your own HTML into the `loading-overlay` slot.

```html
<t-view id="main-track">
  <my-custom-spinner slot="loading-overlay"></my-custom-spinner>
  <h1>Page 1</h1>
  <a href="/page2">Go to Page 2</a>
</t-view>
```

Since this uses the built-in Navigation API, you may also take advantage of corresponding CSS features:

- [`@view-transition`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@view-transition)
- [`view-timeline`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/view-timeline)
- [`view-transition-name`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/view-transition-name)
- [`view-transition-class`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/view-transition-class)
- [`::view-transition`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::view-transition)
- [`::view-transition-group`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::view-transition-group)
- [`::view-transition-image-pair`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::view-transition-image-pair)
- [`::view-transition-old`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::view-transition-old)
- [`::view-transition-new`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::view-transition-new)

> [!CAUTION]
> Browser support for these features may be limited. Please check before using them in production.
