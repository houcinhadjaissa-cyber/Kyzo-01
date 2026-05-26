import { Router } from "express";
import { randomUUID } from "crypto";

const router = Router();

export interface Notification {
  id: string;
  type: "generation_complete" | "generation_failed" | "deployment_live" | "deployment_failed" | "scan_complete" | "scan_critical" | "agent_fix" | "billing" | "system";
  title: string;
  body: string;
  projectId?: string;
  projectName?: string;
  read: boolean;
  deepLink?: string;
  createdAt: string;
}

export interface PushToken {
  token: string;
  platform: "ios" | "android" | "web";
  registeredAt: string;
}

const notifications: Notification[] = [
  {
    id: "notif_001",
    type: "deployment_live",
    title: "Deployment Live",
    body: "E-Commerce Store is now live on Vercel.",
    projectId: "proj_001",
    projectName: "E-Commerce Store",
    read: true,
    deepLink: "/project/proj_001",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "notif_002",
    type: "scan_complete",
    title: "Security Scan Complete",
    body: "SaaS Dashboard scored 88/100. 2 high-severity issues found.",
    projectId: "proj_002",
    projectName: "SaaS Dashboard",
    read: false,
    deepLink: "/project/proj_002",
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "notif_003",
    type: "agent_fix",
    title: "AIOS Auto-Healed",
    body: "Fixed: Missing CSRF protection on 3 endpoints. No action needed.",
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
];

const pushTokens: PushToken[] = [];

router.get("/notifications", (req, res) => {
  const unreadOnly = req.query["unreadOnly"];
  const result = unreadOnly === "true" ? notifications.filter(n => !n.read) : notifications;
  res.json(result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

router.get("/notifications/unread-count", (_req, res) => {
  res.json({ count: notifications.filter(n => !n.read).length });
});

router.post("/notifications/read-all", (_req, res) => {
  notifications.forEach(n => { n.read = true; });
  res.json({ success: true });
});

router.post("/notifications/push-token", (req, res) => {
  const { token, platform } = req.body as { token: string; platform: "ios" | "android" | "web" };
  const existing = pushTokens.findIndex(t => t.token === token);
  if (existing !== -1) {
    pushTokens[existing]!.registeredAt = new Date().toISOString();
  } else {
    pushTokens.push({ token, platform, registeredAt: new Date().toISOString() });
  }
  res.json({ success: true });
});

router.patch("/notifications/:id/read", (req, res) => {
  const notif = notifications.find(n => n.id === req.params["id"]);
  if (!notif) { res.status(404).json({ error: "Not found" }); return; }
  notif.read = true;
  res.json(notif);
});

router.delete("/notifications/:id", (req, res) => {
  const idx = notifications.findIndex(n => n.id === req.params["id"]);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  notifications.splice(idx, 1);
  res.status(204).send();
});

export function pushNotification(notif: Omit<Notification, "id" | "read" | "createdAt">) {
  const newNotif: Notification = {
    ...notif,
    id: `notif_${randomUUID().slice(0, 8)}`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifications.unshift(newNotif);
  return newNotif;
}

export default router;
