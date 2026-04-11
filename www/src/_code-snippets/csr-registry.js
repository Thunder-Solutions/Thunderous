import { viewRegistry } from 'thunderous-csr';

// Look up the registered tag name dynamically
const tagName = viewRegistry.getTagName(View);  // Returns 't-view'
