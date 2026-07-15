const fs = require('fs');

const { ledgers } = require('./src/pages/__debug_dummy.js') || { ledgers: [] }; // We can't easily require tsx
