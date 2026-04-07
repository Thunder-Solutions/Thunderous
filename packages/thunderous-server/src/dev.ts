import { createServer } from 'vite';
import { resolve } from 'path';
import { config } from './config';
import { thunderousPlugin } from './vite-plugin';

export const dev = async () => {
	const server = await createServer({
		root: resolve(config.baseDir),
		plugins: [thunderousPlugin()],
		server: {
			port: Number(process.env.PORT ?? '3000'),
		},
	});

	await server.listen();
	server.printUrls();
};
