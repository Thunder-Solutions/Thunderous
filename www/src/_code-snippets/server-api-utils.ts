import { escapeHtml, raw, getMeta, setMeta } from 'thunderous-server';

// Escape HTML entities
escapeHtml('<script>alert("xss")</script>'); // &lt;script&gt;...

// Bypass escaping with raw()
html`<div>${raw('<em>Trusted HTML</em>')}</div>`;

// Set page metadata (affects title, breadcrumbs, etc.)
setMeta({ title: 'My Page', breadcrumbs: [{ name: 'Home', path: '/' }] });
