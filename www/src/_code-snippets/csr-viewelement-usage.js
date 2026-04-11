const view = document.getElementById('main');
console.log(view.status); // 'pending', 'ready', or 'error'

// Wait for navigation to finish
await view.finished;
console.log('Navigation complete!');
