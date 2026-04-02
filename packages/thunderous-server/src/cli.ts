import { build } from './build';
import { dev } from './dev';

const args = process.argv.slice(2);

if (args[0] === 'dev') {
	try {
		dev();
	} catch (error) {
		console.error('Failed to start server:', error);
		process.exit(1);
	}
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
