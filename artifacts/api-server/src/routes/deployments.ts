import { Router } from "express";
import { randomUUID } from "crypto";

const router = Router();

const deployments = [
  {
    id: "dep_001",
    projectId: "proj_001",
    provider: "vercel",
    status: "live",
    url: "https://mystore.vercel.app",
    branch: "main",
    duration: 52,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 52000).toISOString(),
  },
  {
    id: "dep_002",
    projectId: "proj_001",
    provider: "vercel",
    status: "live",
    url: "https://mystore.vercel.app",
    branch: "main",
    duration: 48,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 48000).toISOString(),
  },
  {
    id: "dep_003",
    projectId: "proj_002",
    provider: "railway",
    status: "failed",
    branch: "feature/billing",
    duration: 12,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 12000).toISOString(),
  },
];

router.get("/deployments", (req, res) => {
  res.json(deployments);
});

export default router;
