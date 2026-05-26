// Vercel serverless function entry point
// Re-exports the bundled Express app for serverless execution
import app from "../dist/index.mjs";
export default app;
