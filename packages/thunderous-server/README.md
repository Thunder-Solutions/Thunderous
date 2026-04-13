# Thunderous Server

> [!CAUTION]
> This project is **experimental**. It may not be suitable for production use at this time, as it is subject to bugs and breaking changes.

**Thunderous Server is a static site generator that enhances plain HTML.**

Think of it as "HTML with superpowers": you write standard HTML files, but you gain composable layouts, template expressions, and server-side scripts.

This isn't intended to serve as a _"framework"_ in the traditional sense, but rather a tool that makes it _more feasible to work without one_.

## Quick Start

Add Thunderous Server to an existing project:

```bash
npm install thunderous-server
```

Or [run `npm init thunderous`](https://www.npmjs.com/package/create-thunderous) to create a new project with the full Thunderous Stack.

## Philosophy: "Just HTML"

### What You Won't Find Here

- ❌ Special file extensions (Just plain `.html` files)
- ❌ Template syntax mixed into HTML
- ❌ Complex routing configuration
- ❌ Magic compiler transformations
- ❌ Framework-specific components

### What You Do Get

- ✅ Pure HTML files with enhanced capabilities
- ✅ Layout composition using standard `<slot>` elements
- ✅ Template expressions via `<script expr>`
- ✅ Server-only scripts via `<script server>`
- ✅ Shared server-and-client scripts via `<script isomorphic>`
- ✅ TypeScript support in all `<script>` tags
- ✅ No-bundle dependencies via generated `<script type="importmap">` tags
- ✅ Native browser behavior preserved

## Core Concepts

### 1. File-Based Routing

Routing works exactly like a static file server. Create an `about.html` file, and it's available at `/about`. Create a folder `blog/post-1.html`, and it's at `/blog/post-1`.

```
src/
├── index.html            # → /
├── about.html            # → /about
├── contact.html          # → /contact
└── blog/
    ├── index.html        # → /blog
    └── hello-world.html  # → /blog/hello-world
```

**Files starting with underscore (`_`) are excluded from the final output**—perfect for layouts.

### 2. Layouts via Processing Instructions

Use the `<?layout>` processing instruction at the top of any HTML file to wrap its content in a layout:

```html
<?layout href="_layout.html">

<p>This gets inserted into the layout's slot.</p>
```

**`_layout.html`:**

```html
<html>
  <head>
    <title>My Site</title>
  </head>
  <body>
    <header>Navigation here</header>
    <main>
      <slot><!-- Page content appears here --></slot>
    </main>
    <footer>© 2024</footer>
  </body>
</html>
```

> **Why processing instructions?**
>
> They're valid XML syntax that browsers treat as comments. Thunderous strips them during rendering, leaving clean HTML.
>
> This was inspired by [the declarative partial updates proposal](https://github.com/WICG/declarative-partial-updates/blob/main/patching-explainer.md#proposed-markup) to the HTML spec, and many other proposals also explore the use of processing instructions, so we may soon see native support for this kind of pattern.

### 3. Server-Side Expressions

The `<script expr>` tag evaluates JavaScript on the server and inserts the result:

```html
<ul>
  <script expr>
    items.map((item) => html`<li>${item.name}</li>`);
  </script>
</ul>
```

**Key points:**

- Runs **only on the server**—never reaches the browser
- Has access to exports from `<script server>`
- Uses the `html` template tag for safe interpolation

### 4. Server Scripts

Use `<script server>` to prepare data for your page:

```html
<script server>
  export default {
    title: 'My Page',
    items: ['Apple', 'Banana', 'Cherry'],
    fetchData: async () => {
      // Fetch from APIs, read files, etc.
      return { message: 'Hello from server!' };
    },
  };
</script>

<h1>
  <script expr>
    title;
  </script>
</h1>
```

**Important:** Only the **default export** is available to `<script expr>` tags. Export a plain object with your data.

### 5. Isomorphic Scripts

`<script isomorphic>` runs on **both server and client**:

```html
<script isomorphic>
  import { MyComponent } from './components/my-element';
  MyComponent.define('my-element');
</script>
```

**Use cases:**

- Defining web components that render server-side (declarative shadow DOM)
- Code that needs to exist in both environments
- Any imports that should be available to the browser

Since these run on the client too, their NPM imports get vendorized automatically.

### 6. Client Modules

Standard `<script type="module">` tags work as expected, but with a twist: **imports are automatically vendorized**.

```html
<script type="module">
  import { format } from 'date-fns';
  console.log(format(new Date(), 'yyyy-MM-dd'));
</script>
```

Thunderous will:

1. Extract the `date-fns` package to your output folder
2. Generate an import map so the browser can resolve it
3. Rewrite import specifiers to point to the vendored copy

**No bundler needed.** The browser loads modules natively via import maps.

### 7. TypeScript Support

Any `.ts` file is automatically transpiled to `.js`. This works for:

- Module imports in scripts
- Isomorphic scripts
- Server scripts

```html
<script isomorphic src="./components/counter.ts"></script>
```

## Configuration

Create a `thunderous.config.ts` in your project root:

```typescript
export default {
  name: 'My App',
  baseDir: 'src', // Where your HTML files live
  outDir: 'dist', // Build output directory
};
```

Thunderous walks up the directory tree to find this config, similar to how tools like Prettier or ESLint work.

## API

### Programmatic Usage

```typescript
import { build, dev } from 'thunderous-server';

// Development server
await dev(); // Starts Vite dev server on port 3000

// Production build
build(); // Generates static site in outDir
```

### Utilities

```typescript
import { escapeHtml, raw, getMeta, setMeta } from 'thunderous-server';

// Escape HTML entities
escapeHtml('<script>alert("xss")</script>'); // &lt;script&gt;...

// Bypass escaping with raw()
html`<div>${raw('<em>Trusted HTML</em>')}</div>`;

// Set page metadata (affects title, breadcrumbs, etc.)
setMeta({ title: 'My Page', breadcrumbs: [{ name: 'Home', path: '/' }] });
```

## Common Patterns

### Pattern: Dynamic Lists

```html
<script server>
  export default {
    products: [
      { id: 1, name: 'Widget', price: 19.99 },
      { id: 2, name: 'Gadget', price: 29.99 },
    ],
  };
</script>

<div class="product-list">
  <script expr>
    products.map(
      (p) => html`
        <article data-id="${p.id}">
          <h3>${p.name}</h3>
          <p>$${p.price.toFixed(2)}</p>
        </article>
      `,
    );
  </script>
</div>
```

### Pattern: Conditional Rendering

```html
<script server>
  export default { isLoggedIn: true, username: 'Alice' };
</script>

<nav>
  <script expr>
    isLoggedIn
      ? html`<span>Welcome, ${username}!</span>`
      : html`<a href="/login">Sign In</a>`;
  </script>
</nav>
```

### Pattern: Component SSR

```html
<script isomorphic>
  import { UserCard } from './components/user-card';
  UserCard.define('user-card');
</script>

<!-- This renders as declarative shadow DOM on the server -->
<user-card name="Alice" role="Admin"></user-card>
```

## Common Anti-Patterns

### ❌ Don't: Define Multiple `<script server>` Exports

```html
<!-- BAD: Only the last default export wins -->
<script server>
  export default { a: 1 };
</script>
<script server>
  export default { b: 2 }; // This overwrites the first!
</script>
```

**✅ Do:** Consolidate into a single `<script server>` block.

### ❌ Don't: Directly Access DOM in `<script server>` or `<script isomorphic>`

> \*Unless you bring your own DOM implementation (e.g., JSDOM) to the server environment.

```html
<!-- BAD: document doesn't exist on the server -->
<script server>
  export default {
    element: document.getElementById('app'), // ❌ Will error
  };
</script>
<!-- BAD: isomorphic scripts do run on the client, but they also
          run on the server where the problem occurs. -->
<script isomorphic>
  const app = document.getElementById('app'); // ❌ Will error
</script>
```

**✅ Do:** Conditionally run client-side code by checking if `typeof window !== 'undefined'`, or use regular `<script>` tags for DOM access.

> If you're using Thunderous, you can use [`clientOnlyCallback()`](https://thunderous.dev/docs/server-side-rendering) for this purpose.

### ❌ Don't: Forget the `html` Tag in Expressions

```html
<!-- BAD: Returns raw string, not trusted HTML -->
<script expr>
  '<div>' + content + '</div>'; // Will be escaped!
</script>

<!-- GOOD: -->
<script expr>
  html`<div>${content}</div>`; // Properly handled
</script>
```

## FAQ

**Q: Do I need a build step for development?**

A: Not really! `thunderous dev` starts a Vite-based dev server with hot module replacement. You only need `thunderous build` when you're ready to deploy static files.

**Q: Can I use React/Vue/Svelte components?**

A: You can mount any client-side framework after a page loads. Thunderous Server isn't opinionated about that, but it does provide built-in support for Thunderous web components if you choose to use them.

While Thunderous Server doesn't _currently\*_ support direct integrations with full-stack frameworks like Next.js, Nuxt, or SvelteKit, the HTML it generates may be used as a mount point for frameworks that manage their own server separately.

> \*Plugin support for third-party integrations is planned, but not yet available.

**Q: How do I handle form submissions?**

A: There is no special handling for form submissions. Use standard form actions to a backend API, or enhance with client-side JavaScript.

In fact, any pattern to generate endpoints or introduce any other non-native behavior is contrary to the principles of Thunderous Server. The path your code takes should be clear and easy to follow at every point on its journey from request to response.

That being said, you are free to use any patterns or libraries you want, but providing out-of-the-box tools for this purpose is not planned.

**Q: What about CSS preprocessors?**

A: Thunderous Server is compatible with any CSS preprocessor, but it doesn't handle the preprocessing itself. You can use your preferred tool (Sass, PostCSS, etc.) and output the result to your source folder.

As the CSS spec continues to evolve, the need for preprocessors is diminishing. Native CSS now supports variables, nesting, and even functions like `calc()`, `clamp()`, `color-mix()`, and so on. With the introduction of [CSS functions and mixins](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Custom_functions_and_mixins), the remaining gap is closing fast.

Thunderous Server is committed to keeping things simple and native, so we currently don't plan to add built-in support for preprocessors. If you need them, there are no restrictions on using them in your project.

## Troubleshooting

### Issue: "Cannot find module" in browser

**Cause:** Import maps weren't generated.

**Fix:** Ensure your script is `type="module"` or `isomorphic`. Check that the import is from an NPM package, not a local file (those should use relative paths).

### Issue: `<script expr>` shows `[object Object]`

**Cause:** Expression returned an object instead of an HTML-serializable value.

**Fix:** Ensure you return an `html` tagged template string or a primitive value.

## Related Packages

- **[thunderous](https://www.npmjs.com/package/thunderous)** — Web component authoring library
- **[thunderous-csr](https://www.npmjs.com/package/thunderous-csr)** — Client-side rendering for partial updates to HTML
- **[create-thunderous](https://www.npmjs.com/package/create-thunderous)** — Project scaffolding CLI

## License

MIT
