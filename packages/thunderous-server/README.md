# Thunderous Server

> [!CAUTION]
> This project is experimental. It may not be suitable for production use at this time, as it is subject to bugs and breaking changes.

**Thunderous Server is a web framework and static generator designed to support and supplement _plain old HTML_.**

**What it does NOT do:**

- No special file extensions
- No unusual mixed syntax
- No complex route config
- No compiler magic

**What it DOES:**

- HTML is enhanced to support server-side templating and layout composition.
- TypeScript is compiled for browser runtimes
- NPM dependencies are extracted to static assets and referenced via import maps

All you need to set up your app is a source folder (`src` by default) with an `index.html` file. Routing is achieved natively, through the folder structure

## Examples

**\_layout.html**:

```html
<!--
Since this file begins with an underscore, it will not be included
in the static output. Its contents may be used by other HTML files
that reference it, but it will never be served directly.
-->
<html>
  <head>
    <title>Thunderous Server</title>
  </head>
  <body>
    <!--
    <slot> tags are usually reserved for shadow DOM, but they are
    appropriate here since they serve a similar purpose. Any HTML
    file that includes this layout will insert its content into this
    slot.
    -->
    <slot></slot>
  </body>
</html>
```

**index.html**:

```html
<!--
This is a "processing instruction", and there's already support
in XML and the DOM spec. Browsers just parse them as comments,
but Thunderous Server will strip this away before it reaches
the browser anyway.
-->
<?layout href="_layout.html">

<ul>
  <!--
  This is evaluated in-place and replaced with the result.
  This is server-side only; you'll never see <script expr>
  in the source markup served to the browser.
  -->
  <script expr>
    list.map((item) => html` <li>test ${label} - ${item}</li> `);
  </script>
</ul>

<!--
Thunderous supports SSR web components by rendering declarative
shadow DOM in the source markup sent to the browser. When
MyComponent.define() is called on the server, it will inject
this element with <my-component>'s rendered output.
-->
<my-component></my-component>

<!--
This is ordinary client-only code that remains in the source markup
sent to the browser.
-->
<script>
  console.log('Hello from the browser!');
</script>

<!--
This is also client-only. Client-side modules are processed to
"vendorize" NPM dependencies. That is, imports are ejected as
assets the browser can see and use. This does NOT bundle; instead,
it generates an import map. It will only vendorize the dependencies
that are actually imported.
-->
<script type="module">
  console.log('Hello from a module!');
</script>

<!--
This runs on both the client and server. Isomorphic scripts are
always type="module". Since it runs on the client, it will also
vendorize NPM dependencies.
-->
<script isomorphic>
  import { MyComponent } from './scripts';
  MyComponent.define('my-component');
</script>

<!--
This runs on the server only. Server scripts are always modules.
Exported values are available in <script expr> tags.
-->
<script server>
  export default {
    label: 'Item',
    list: [1, 2, 3, 4, 5],
  };
</script>
```

## TODO

- [ ] Add support for named slots in layouts
- [ ] Create (or find existing) extension that supports:
  - [ ] TypeScript inside `<script>` tags
  - [ ] IDE navigation in `<script server>` and `<script expr>` tags (go to definition, find references, etc.)
  - [ ] Auto-imports for `<script server>`, `<script isomorphic>`, and `<script type="module">`
  - [ ] Lint against multiple `<script server>` tags to avoid export collisions
  - [ ] Typechecking to ensure the default export in `<script server>` is `Record<PropertyKey, unknown>`
  - [ ] OPTIONAL: Lint and autofix for trailing `;` in `<script expr>` tags  
         _e.g., `('hello';)` is an invalid expression, so `<script expr>'hello';</script>` is technically incorrect. That said, Thunderous Server does handle this currently by stripping it from the content before it's evaluated._

### Known Issues

- [ ] The dev server is not reliably hot-reloading changes
- [ ] The CSR views are not behaving as expected -- unclear if this is a bug in the server or the CSR package.
