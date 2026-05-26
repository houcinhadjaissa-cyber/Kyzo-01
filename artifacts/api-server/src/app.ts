// artifacts/api-server/src/app.ts - FINAL FIXED VERSION
import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import * as pinoHttp from "pino-http"; // ✅ Fix: Namespace import
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// ✅ Fix TS2349: Extract actual function from CJS module
const pinoMiddleware = (pinoHttp as any).default || pinoHttp;

app.use(
  pinoMiddleware({
    logger,
    serializers: {
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check (required for Vercel serverless)
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

// Global error handler
app.use((err: Error, req: Request, res: Response, next: (err?: any) => void) => {
  logger.error({ err }, "Unhandled server error");
  res.status(500).json({ 
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message 
  });
});

export default app;
