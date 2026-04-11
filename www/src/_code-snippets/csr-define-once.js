// BAD: Registering twice
import { View } from 'thunderous-csr';
View.define('t-view');
// ... later in another file
View.define('app-view');  // ❌ This breaks things!

// GOOD: Define once, at app initialization
// main.js - single registration
import { View } from 'thunderous-csr';
View.define('t-view');
