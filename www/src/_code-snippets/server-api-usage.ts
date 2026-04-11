import { build, dev } from 'thunderous-server';

// Development server
await dev(); // Starts Vite dev server on port 3000

// Production build
build(); // Generates static site in outDir
