// Colyseus/Schema serialization polyfills for all tests
require('./src/server/utils/arrayschema-registry-fix');
require('./src/server/utils/comprehensive-metadata-fix');
const { applyComprehensiveSchemaFixes } = require('./src/server/utils/comprehensive-schema-fix');
require('./src/server/utils/early-metadata-init');
require('./src/server/utils/encoder-patch');
require('./src/server/utils/metadata-schema-fix');

applyComprehensiveSchemaFixes();

// Add any other global test setup here
