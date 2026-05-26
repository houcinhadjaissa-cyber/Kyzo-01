// artifacts/api-server/src/app.ts - FINAL FIXED VERSION
import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import * as pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app: Express = express();

// Extract actual function from CJS module
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

// Root welcome route
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    name: "Kyzo API Server",
    message: "🚀 Server is running!",
    endpoints: ["/health", "/api/ai/route", "/api/projects/:id/ai/message"],
  });
});

// Health check (required for Vercel serverless)
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV 
  });
});

app.use("/api", router);

// 404 handler
app.use("*", (_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: (err?: any) => void) => {
  logger.error({ err }, "Unhandled server error");
  res.status(500).json({ 
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message 
  });
});

export default app;
