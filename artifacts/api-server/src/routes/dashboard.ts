import { Router } from "express";
import { randomUUID } from "crypto";

const router = Router();

router.get("/dashboard", (req, res) => {
  res.json({
    totalProjects: 3,
    liveProjects: 1,
    totalDeployments: 3,
    activeWorkflows: 3,
    avgSecurityScore: 91,
    tokensUsedToday: 847320,
    costToday: 0.17,
    recentActivity: [
      {
        id: randomUUID(),
        type: "project_created",
        projectId: "proj_003",
        projectName: "AI Chatbot",
        summary: "New project started from prompt",
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: randomUUID(),
        type: "workflow_run",
        summary: "Auto Security Scan finished — all clear",
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: randomUUID(),
        type: "deployment_live",
        projectId: "proj_001",
        projectName: "E-Commerce Store",
        summary: "Live on Vercel",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  });
});

export default router;
