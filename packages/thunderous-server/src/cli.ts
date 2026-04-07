import { build } from './build';

const args = process.argv.slice(2);

if (args[0] === 'dev') {
	// Parse port from command line arguments
	process.env.PORT = process.env.PORT ?? '3000';
	args.forEach((arg, i) => {
		if (arg.startsWith('--port')) {
			let port: string | undefined;
			if (arg.includes('=')) {
				port = arg.split('=')[1];
			} else {
				port = args[i + 1];
			}
			if (port !== '' && port !== undefined) {
				process.env.PORT = port;
			}
		}
	});

	// Vite handles HMR, port finding, and file watching
	import('./dev')
		.then(({ dev }) => dev())
		.catch((error) => {
			console.error('\x1b[31mFailed to start server:\x1b[0m', error);
			process.exit(1);
		});
} else if (args[0] === 'build') {
	try {
		build();
	} catch (error) {
		console.error('\x1b[31mBuild failed:\x1b[0m', error);
		process.exit(1);
	}
} else {
	console.log('Usage:');
	console.log('  --dev    Start the development server');
	console.log('  --build  Build the static site');
}
