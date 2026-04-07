import { readFileSync } from 'fs';
import hljs from 'highlight.js';
import { extname } from 'path';
import { raw } from 'thunderous-server';

export const snippetAsHTML = (file: string) => {
	const language = extname(file).slice(1);
	const code = readFileSync(`src/_code-snippets/${file}`, 'utf-8');
	return raw(hljs.highlight(code, { language }).value);
};
