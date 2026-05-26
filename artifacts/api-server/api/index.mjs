// Vercel serverless function entry point

// 1. Tell Vercel to use the Node.js runtime (Required!)
export const config = {
  runtime: 'nodejs', // Changed from 'nodejs18.x' to just 'nodejs'
};

// 2. Import your bundled Express app
// Note: If you get an error about '.mjs', try changing '../dist/index.mjs' to '../dist/index.js'
// But usually, if your build output is .mjs, keep it as is.
import app from "../dist/index.mjs";

// 3. Export the app as the default handler
export default app;
