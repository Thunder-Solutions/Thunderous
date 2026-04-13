# Thunderous CSR (Client-Side Rendering)

> [!CAUTION]
> This project is **experimental**. It may not be suitable for production use at this time, as it is subject to bugs and breaking changes.

**Thunderous CSR (Client-Side Rendering) brings SPA-like navigation to traditional multi-page apps (MPAs).**

It intercepts navigation and updates only select parts of the page, enabling smoother transitions and better performance.

The best part? **Your pages are still just HTML.** No router, no framework, no server needed.

## What Problem Does This Solve?

Traditional MPAs (Multi-Page Applications) have a major UX drawback: every navigation triggers a full page reload, causing:

- Flash of white screen
- Re-execution of all JavaScript
- Broken transient UI state (open dropdowns, playing videos, etc.)

SPAs (Single-Page Applications) solve this, but introduce complexity:

- Client-side routing libraries
- State management headaches
- Large JavaScript bundles
- SEO challenges

**Thunderous CSR gives you the best of both worlds:** the simplicity of MPAs with the smooth UX of SPAs.

## Quick Start

```bash
npm install thunderous-csr
```

```javascript
import { View } from 'thunderous-csr';
View.define('t-view'); // Register using any custom tag you want
```

```html
<!-- On every page that should have SPA-like navigation -->
<t-view id="main">
  <!-- Your page content -->
</t-view>
```

**That's it.** Navigation will be captured by the `<t-view>` element, which looks for itself on the incoming page and swaps its content.

> [!NOTE]
> Thunderous CSR only handles the client side. It expects HTML to be served separately. [Thunderous Server](../thunderous-server) makes it easy, but any server works, as long as the responses are valid HTML.

## How It Works

### The Core Concept: View Elements with IDs

Thunderous CSR uses the [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation)—a modern web platform feature—to intercept navigations. When you click a link:

1. The navigation is intercepted
2. The destination page is fetched in the background
3. The `<t-view>` element with a matching ID swaps its content
4. The URL updates using the History API

```html
<!-- page1.html -->
<body>
  <t-view id="content">
    <h1>Page 1</h1>
    <a href="/page2">Go to Page 2</a>
  </t-view>
</body>
```

```html
<!-- page2.html -->
<body>
  <t-view id="content">
    <h1>Page 2</h1>
    <a href="/page1">Back to Page 1</a>
  </t-view>
</body>
```

When navigating from Page 1 to Page 2, the `<t-view id="content">` on Page 1 gets its inner content replaced with the content from the matching view on Page 2.

### Why the ID Matters

The `id` attribute **must** be identical across pages for content swapping to work. This allows you to have multiple independent views on the same page:

```html
<body>
  <t-view id="sidebar">
    <!-- Sidebar content persists -->
  </t-view>
  <t-view id="main">
    <!-- Main content swaps on navigation -->
  </t-view>
</body>
```

## API Reference

### `View.define(tagName)`

Registers the View custom element with your preferred tag name.

```javascript
import { View } from 'thunderous-csr';
View.define('t-view'); // Standard
View.define('app-view'); // Your custom name
View.define('page-content'); // Whatever works for your app
```

### The `viewRegistry`

If you need to dynamically look up the tag name:

```javascript
import { viewRegistry } from 'thunderous-csr';
const tagName = viewRegistry.getTagName(View);
// Returns 't-view' (or whatever you registered)
```

See [Thunderous Registries](https://thunderous.dev/docs/registries) for more information.

### ViewElement Interface

Each `<t-view>` element exposes these read-only properties:

| Property   | Type                              | Description                        |
| ---------- | --------------------------------- | ---------------------------------- |
| `status`   | `'pending' \| 'ready' \| 'error'` | Current navigation state           |
| `finished` | `Promise<void>`                   | Resolves when navigation completes |

```javascript
const view = document.getElementById('main');
console.log(view.status); // 'pending', 'ready', or 'error'

// Wait for navigation to finish
await view.finished;
console.log('Navigation complete!');
```

## Features

### View States & CSS Classes

The View element automatically toggles CSS classes based on its state:

| State    | Class      | When Active                             |
| -------- | ---------- | --------------------------------------- |
| Loading  | `.pending` | During navigation, before content swaps |
| Complete | `.ready`   | After successful content swap           |
| Error    | `.error`   | If navigation fails                     |

```css
t-view.pending {
  opacity: 0.7;
}

t-view.ready {
  opacity: 1;
  transition: opacity 0.3s ease;
}

t-view.error {
  border: 2px solid red;
}
```

### Loading Overlay

By default, a semi-transparent overlay appears during navigation. Customize it with the `loading-overlay` slot:

```html
<t-view id="main">
  <div slot="loading-overlay" class="my-spinner">
    <img src="/spinner.svg" alt="Loading..." />
  </div>
  <!-- Main content -->
</t-view>
```

### Native Support

Since this uses the built-in [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API), you may also take advantage of its corresponding CSS features:

- [`@view-transition`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@view-transition)
- [`view-transition-name`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/view-transition-name)
- [`view-transition-class`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/view-transition-class)
- [`:active-view-transition`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:active-view-transition)
- [`:active-view-transition-type()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:active-view-transition-type)
- [`::view-transition`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::view-transition)
- [`::view-transition-group`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::view-transition-group)
- [`::view-transition-image-pair`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::view-transition-image-pair)
- [`::view-transition-old`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::view-transition-old)
- [`::view-transition-new`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::view-transition-new)

There are also several related events that you can listen to:

- [`navigate`](https://developer.mozilla.org/en-US/docs/Web/API/Navigation/navigate_event)
- [`navigateerror`](https://developer.mozilla.org/en-US/docs/Web/API/Navigation/navigateerror_event)
- [`navigatesuccess`](https://developer.mozilla.org/en-US/docs/Web/API/Navigation/navigatesuccess_event)
- [`currententrychange`](https://developer.mozilla.org/en-US/docs/Web/API/Navigation/currententrychange_event)
- [`pageswap`](https://developer.mozilla.org/en-US/docs/Web/API/Window/pageswap_event)
- [`pagehide`](https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event)
- [`pagereveal`](https://developer.mozilla.org/en-US/docs/Web/API/Window/pagereveal_event)
- [`pageshow`](https://developer.mozilla.org/en-US/docs/Web/API/Window/pageshow_event)

And of course it's worth reviewing the [Navigation Interface](https://developer.mozilla.org/en-US/docs/Web/API/Navigation) itself. That is, the methods and properties available on the global `navigation` object:

- [`activation`](https://developer.mozilla.org/en-US/docs/Web/API/Navigation/activation)
- [`canGoBack`](https://developer.mozilla.org/en-US/docs/Web/API/Navigation/canGoBack)
- [`canGoForward`](https://developer.mozilla.org/en-US/docs/Web/API/Navigation/canGoForward)
- [`currentEntry`](https://developer.mozilla.org/en-US/docs/Web/API/Navigation/currentEntry)
- [`entries()`](https://developer.mozilla.org/en-US/docs/Web/API/Navigation/entries)
- [`back()`](https://developer.mozilla.org/en-US/docs/Web/API/Navigation/back)
- [`forward()`](https://developer.mozilla.org/en-US/docs/Web/API/Navigation/forward)
- [`navigate()`](https://developer.mozilla.org/en-US/docs/Web/API/Navigation/navigate)
- [`traverseTo()`](https://developer.mozilla.org/en-US/docs/Web/API/Navigation/traverseTo)
- [`updateCurrentEntry()`](https://developer.mozilla.org/en-US/docs/Web/API/Navigation/updateCurrentEntry)
- [`NavigationEvent`](https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent)
  - [`destination`](https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent/destination)
  - [`canIntercept`](https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent/canIntercept)
  - [`downloadRequest`](https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent/downloadRequest)
  - [`navigationType`](https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent/navigationType)
  - [`userInitiated`](https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent/userInitiated)
  - [`info`](https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent/info)
  - [`signal`](https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent/signal)
  - [`formData`](https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent/formData)
  - [`sourceElement`](https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent/sourceElement)
  - [`hasUAVisualTransition`](https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent/hasUAVisualTransition)
  - [`intercept()`](https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent/intercept)
  - [`scroll()`](https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent/scroll)

> [!CAUTION]
> Browser support for these features may be limited. Please check the support tables on the linked MDN pages before using them in production.

## Common Anti-Patterns

### ❌ Don't: Define Different IDs on Different Pages

```html
<!-- page1.html -->
<t-view id="content">...</t-view>

<!-- page2.html -->
<t-view id="main">...</t-view>
<!-- ❌ Different ID! -->
```

**✅ Do:** Use identical IDs across pages:

```html
<!-- Both pages use the same ID -->
<t-view id="main">...</t-view>
```

### ❌ Don't: Nest Views in Other Views

```html
<!-- BAD: Confusing behavior, will cause errors -->
<main>
  <t-view id="main">
    <p>Main content</p>
    <aside>
      <t-view id="aside">
        <p>Side content</p>
      </t-view>
    </aside>
  </t-view>
</main>
```

**✅ Do:** Define all views in parallel scopes:

```html
<main>
  <t-view id="main">
    <p>Main content</p>
  </t-view>
  <aside>
    <t-view id="aside">
      <p>Side content</p>
    </t-view>
  </aside>
</main>
```

## FAQ

**Q: Does this work without JavaScript?**

A: Yes, sort of! Thunderous CSR is built with progressive enhancement in mind, so without JavaScript, users just get the standard MPA experience (full page loads). There will be no partial updates, but disabling JavaScript will not _break_ the page.

**Q: What browsers are supported?**

A: The Navigation API is considered baseline as of January 2026, so it's widely supported.

Not everyone supports the additional features _surrounding_ navigations, but the core functionality employed by Thunderous CSR is expected to work consistently across all major browsers.

**Q: How does this differ from HTMX or Turbo?**

A: HTMX uses attributes to define endpoints that fetch partial HTML, while Thunderous CSR selectively swaps content from whole-page responses.

Turbo uses a very similar approach, but it's more opinionated and requires global scripts. Thunderous CSR is a single web component you explicitly import and register yourself.

Out of these three, only Thunderous CSR operates on the baseline Navigation API, which also plugs into a whole cluster of emerging browser features surrounding it. While not all of them are fully supported yet, it's a solid foundation for future-facing apps.

**Q: Can I use this with React/Vue/Svelte?**

A: Technically yes, but Thunderous CSR's partial update model overlaps with the way those frameworks manage DOM updates. In most cases, if you're building the page around one of those frameworks, it's better to use that framework's own routing system instead.

One case where they can still work well together is a microfrontend architecture, where Thunderous CSR handles top-level navigation and React, Vue, or Svelte are mounted onto specific elements within each view.

**Q: Does this intercept form submissions?**

A: Yes. Thunderous CSR intercepts all navigations, including form submissions. It shouldn't change the handling of the form submission itself, but it does intercept the navigation that results from it.

**Q: What if the destination page has different CSS/JS?**

A: Thunderous CSR always swaps the head content, in addition to view content. Each view adds its own handler for navigation, while one global handler manages the overall navigation process. In that global handler, the head content is swapped first, and then it queues a validation to ensure the final rendered content reflects the same HTML you would get by loading the destination page directly. If the validation fails, it swaps the entire root HTML tag.

## Troubleshooting

### Issue: "View not found in destination document" warning

**Cause:** The destination page doesn't have a `<t-view>` with the matching ID.

**Fix:** Ensure all pages that participate in SPA navigation have matching view IDs. The view will be removed from the DOM when navigating to pages without a matching view.

**NOTE:** You may not need to fix this warning if it's expected (e.g., navigating to a page that doesn't have a view). The warning is informational to call attention to a view being removed from the DOM. It's your discretion whether it warrants attention.

### Issue: Full page reloads happening anyway

**Cause:** Server returns different HTML than expected, triggering fallback behavior.

**Fix:** Check that your server is serving consistent HTML structures. Check the logs for validation errors and verify there are no network errors.

## Related Packages

- **[thunderous](https://www.npmjs.com/package/thunderous)** — Web component authoring library
- **[thunderous-server](https://www.npmjs.com/package/thunderous-server)** — Static site generator and dev server (pairs perfectly with CSR)
- **[create-thunderous](https://www.npmjs.com/package/create-thunderous)** — Project scaffolding CLI (includes CSR by default)

## Roadmap

- [ ] Form submission design and review
- [ ] Scroll position restoration options
- [ ] Enhanced prefetching strategies

## License

MIT
