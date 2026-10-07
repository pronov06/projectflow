/**
 * Serverless entry point (Vercel Functions). Exports the Express app as the request handler
 * instead of calling `listen()`; `server.ts` remains the entry point for Node/Docker hosting.
 */
import { createApp } from './app';

const app = createApp();

export default app;
