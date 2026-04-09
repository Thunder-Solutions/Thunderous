# Create Thunderous

> [!CAUTION]
> This project is **experimental**. It may not be suitable for production use at this time, as it is subject to bugs and breaking changes.

**The official project scaffolding tool for the Thunderous stack.** Get a complete, production-ready project template with one command—no configuration needed.

## Quick Start

To run the interactive setup, just run:

```bash
npm init thunderous
```

The **project name** will be used in the `name` field of the generated `package.json`, the `name` property in `thunderous.config.ts`, and in the `<title>` tag of the shared `_layout.html` file.

> If you want to skip a few prompts, you can optionally [pass arguments](#command-line-options) to the command.

## What You Get

`create-thunderous` scaffolds a complete project with:

### The Full Thunderous Stack

- **thunderous** — Functional web components with signals-based reactivity
- **thunderous-server** — Static site generator with server-side rendering
- **thunderous-csr** — Client-side navigation for SPA-like UX

### Development Environment

- **TypeScript** — Fully configured with strict mode
- **Vite** — Lightning-fast dev server with HMR
- **ESLint** — Pre-configured for modern JavaScript/TypeScript
- **Prettier** — Code formatting ready to go

### Project Structure

```
my-app/
├── src/
│   ├── about/
│   │   ├── about-data.server.ts  # Example of a server-only file
│   │   ├── contact.html          # Example of file-based route
│   │   └── index.html            # Example of directory-based route
│   ├── components/
│   │   ├── crumbs.ts             # For breadcrumb navigation
│   │   ├── page.ts               # For shared page presentation
│   │   └── feature.ts            # The main example component
│   ├── index.html                # The home page with demo content
│   ├── _layout.html              # Shared layout with navigation
│   ├── global.css                # We recommend keeping this minimal!
│   └── theme.ts                  # A CSSStyleSheet for shared theming
├── types/
│   └── globals.d.ts
├── .gitignore
├── .prettierrc
├── eslint.config.mjs
├── thunderous.config.ts          # Thunderous Server configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Interactive Setup

When you run `npm init thunderous`, you'll be prompted for:

1. **Project name** — Used in `package.json`, `thunderous.config.ts`, `<title>`, and the parent folder name.
2. **Package manager** — Choose `pnpm` (default), `npm`, or `yarn`
3. **Git initialization** — Optional automatic `git init` and first commit

## Command Line Options

You can specify a directory name to create a new project:

```bash
# Create the project in a new directory:
npm init thunderous my-app

# Create the project in the current directory:
npm init thunderous .
```

> In both cases, the directory name will be used as the project name.

You can skip the package manager prompt by explicitly passing it via the `--package-manager` flag:

```bash
npm init thunderous my-app --package-manager pnpm
```

## Generated Project Scripts

After scaffolding, your project has these `package.json` scripts:

| Script       | Description                               |
| ------------ | ----------------------------------------- |
| `dev`        | Start development server (port 3000)      |
| `build`      | Generate production static site           |
| `start`      | Preview production build locally          |
| `lint`       | Run ESLint on all files                   |
| `lint:fix`   | Run ESLint and automatically fix problems |
| `format`     | Check code formatting with Prettier       |
| `format:fix` | Automatically fix formatting problems     |
| `typecheck`  | Validate the TypeScript types             |

## What Makes This Different?

Unlike other scaffolding tools, `create-thunderous` sets up a **complete architectural foundation**:

- **No bundler complexity** — Import maps handle dependencies, not webpack/rollup configs
- **Server-first rendering** — Pages render as HTML, not empty divs waiting for JS
- **Progressive enhancement** — Works without JavaScript, enhanced with it
- **Modern standards** — Leverages today's baseline features to keep framework overhead minimal

## Updating Your Project

The generated project is not a managed framework—it's just scaffolding for you to build on. That means you're free to:

- Upgrade individual packages independently
- Modify the build process
- Add any additional tooling you need
- Eject from any patterns you don't like

Check for updates to the Thunderous packages:

```bash
npm outdated
npm update thunderous thunderous-server thunderous-csr
```

## Related Packages

- **[thunderous](https://www.npmjs.com/package/thunderous)** — Core web component library
- **[thunderous-server](https://www.npmjs.com/package/thunderous-server)** — Static site generator
- **[thunderous-csr](https://www.npmjs.com/package/thunderous-csr)** — Client-side navigation

## License

MIT
