import app from "./app.js";
import { logger } from "./lib/logger.js";

// Export the app for Vercel serverless functions
export default app;

// Only start a traditional server if NOT running on Vercel (i.e., local dev)
if (!process.env["VERCEL"]) {
  const rawPort = process.env["PORT"] ?? "3000";
  const port = Number(rawPort);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  app.listen(port, () => {
    logger.info({ port }, "Server listening");
  }).on("error", (err: Error) => {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  });
}
