// Vercel Function: every request is rewritten here (see ../vercel.json).
// The Express app is pre-bundled by tsup into dist/vercel.js during the build step.
const mod = require('../dist/vercel.js');

module.exports = mod.default ?? mod;
