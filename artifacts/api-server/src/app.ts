// artifacts/api-server/src/app.ts - FIXED VERSION
import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp, { type StdSerializers } from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Fix #1: Safe pino-http usage with type-safe serializers
app.use(
  pinoHttp({
    logger,
    serializers: {
      req: (req: any) => ({
        id: (req as any).id,
        method: (req as any).method,
        url: (req as any).url?.split("?")[0],
      }),
      res: (res: any) => ({
        statusCode: (res as any).statusCode,
      }),
    } as StdSerializers,
  }),
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (required for Vercel)
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV 
  });
});

app.use("/api", router);

// 404 handler
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: (err?: any) => void) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ 
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message 
  });
});

export default app;
