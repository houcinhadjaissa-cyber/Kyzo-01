import { Router } from "express";
import { randomUUID } from "crypto";

const router = Router();

const activityEvents = [
  {
    id: randomUUID(),
    type: "deployment_live",
    projectId: "proj_001",
    projectName: "E-Commerce Store",
    summary: "Deployed to Vercel in 52s",
    metadata: { provider: "vercel", duration: 52 },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: randomUUID(),
    type: "scan_completed",
    projectId: "proj_001",
    projectName: "E-Commerce Store",
    summary: "Security scan passed — score 94/100",
    metadata: { score: 94 },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 5 * 60 * 1000).toISOString(),
  },
  {
    id: randomUUID(),
    type: "project_generated",
    projectId: "proj_002",
    projectName: "SaaS Dashboard",
    summary: "AI generated 2,400 lines of code using DeepSeek Coder V2",
    metadata: { model: "deepseek-coder-v2", linesGenerated: 2400 },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: randomUUID(),
    type: "workflow_run",
    projectId: undefined,
    projectName: undefined,
    summary: "Auto Security Scan completed across 2 projects",
    metadata: { workflowId: "wf_001", projectsScanned: 2 },
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: randomUUID(),
    type: "project_created",
    projectId: "proj_003",
    projectName: "AI Chatbot",
    summary: "New project created from prompt",
    metadata: {},
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: randomUUID(),
    type: "model_switched",
    projectId: "proj_003",
    projectName: "AI Chatbot",
    summary: "Model switched to DeepSeek Coder V2 for complex generation",
    metadata: { model: "deepseek-coder-v2" },
    createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
  },
];

router.get("/activity", (req, res) => {
  const limit = parseInt(String(req.query["limit"] ?? "20"), 10);
  res.json(activityEvents.slice(0, limit));
});

export default router;
