import { globSync } from 'node:fs';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import { ViteEjsPlugin } from 'vite-plugin-ejs';

export default defineConfig({
	root: 'src',
	build: {
		outDir: resolve(__dirname, 'dist'),
		emptyOutDir: true,
		rollupOptions: {
			input: globSync('**/*.html', { cwd: resolve(__dirname, 'src') }).map((f) => resolve(__dirname, 'src', f)),
		},
	},
	plugins: [ViteEjsPlugin()],
	server: {
		open: true,
	},
});
