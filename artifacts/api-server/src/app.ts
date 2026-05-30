import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import * as pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app: Express = express();

const isProd = process.env.NODE_ENV === "production";

const pinoMiddleware = (pinoHttp as any).default || pinoHttp;
app.use(
  pinoMiddleware({
    logger,
    serializers: {
      req(req: any) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
      res(res: any) { return { statusCode: res.statusCode }; },
    },
  }),
);

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: isProd ? undefined : false,
  }),
);

const allowedOrigins = isProd
  ? (process.env.ALLOWED_ORIGINS ?? "").split(",").filter(Boolean)
  : ["*"];

app.use(
  cors({
    origin: isProd
      ? (origin, cb) => {
          if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
          cb(new Error("CORS: Origin not allowed"));
        }
      : "*",
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

const globalLimiter = rateLimit({
  windowMs: 60_000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — slow down" },
});

const aiLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AI rate limit reached — wait 60 seconds" },
});

app.use(globalLimiter);
app.use("/api/projects/:id/ai", aiLimiter);
app.use("/api/ai", aiLimiter);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    name: "AIOS API Server",
    version: "1.0.0",
    endpoints: ["/health", "/api/ai/route", "/api/projects", "/api/notifications", "/api/agent/status", "/api/subscription"],
  });
});

app.get("/health", (_req: Request, res: Response) => {
  const mem = process.memoryUsage();
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV ?? "development",
    uptime: Math.floor(process.uptime()),
    memory: {
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
    },
  });
});

app.use("/api", router);

app.use("*", (_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled server error");
  if (err.message.startsWith("CORS:")) {
    res.status(403).json({ error: err.message });
    return;
  }
  res.status(500).json({
    error: isProd ? "Internal server error" : err.message,
  });
});

export default app;
