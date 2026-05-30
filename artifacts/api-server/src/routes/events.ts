import { Router, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { addSSEClient, removeSSEClient, getClientCount } from "../lib/realtime.js";

const router = Router();

router.get("/events", (req: Request, res: Response) => {
  const channel = (req.query["channel"] as string) ?? "global";

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const clientId = randomUUID();

  const write = (data: string) => {
    if (!res.writableEnded) res.write(data);
  };

  const close = () => {
    if (!res.writableEnded) res.end();
  };

  addSSEClient(clientId, channel, write, close);

  write(`event: connected\ndata: ${JSON.stringify({ clientId, channel, clients: getClientCount() })}\n\n`);

  const heartbeat = setInterval(() => {
    write(`: heartbeat\n\n`);
  }, 25_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeSSEClient(clientId);
  });
});

export default router;
