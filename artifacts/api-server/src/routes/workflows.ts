import { Router } from "express";
import { randomUUID } from "crypto";

const router = Router();

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: "manual" | "schedule" | "webhook" | "event";
  steps: number;
  enabled: boolean;
  lastRunAt?: string;
  lastRunStatus?: "success" | "failed" | "running";
  createdAt: string;
}

const workflows: Workflow[] = [
  {
    id: "wf_001",
    name: "Auto Security Scan",
    description: "Scans all projects for vulnerabilities after each deployment",
    trigger: "event",
    steps: 4,
    enabled: true,
    lastRunAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    lastRunStatus: "success",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "wf_002",
    name: "Daily Performance Report",
    description: "Generates AI-written performance insights and emails a summary",
    trigger: "schedule",
    steps: 6,
    enabled: true,
    lastRunAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    lastRunStatus: "success",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "wf_003",
    name: "SEO Auto-Optimizer",
    description: "Analyzes content and injects optimized meta tags and schema markup",
    trigger: "schedule",
    steps: 8,
    enabled: false,
    lastRunAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    lastRunStatus: "failed",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "wf_004",
    name: "GitHub → Deploy",
    description: "Automatically deploys to Vercel on every push to main branch",
    trigger: "webhook",
    steps: 3,
    enabled: true,
    lastRunAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lastRunStatus: "success",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

router.get("/workflows", (req, res) => {
  res.json(workflows);
});

router.post("/workflows", (req, res) => {
  const { name, description = "", trigger } = req.body as { name: string; description?: string; trigger: Workflow["trigger"] };
  const wf: Workflow = {
    id: `wf_${randomUUID().slice(0, 8)}`,
    name,
    description,
    trigger,
    steps: 1,
    enabled: true,
    createdAt: new Date().toISOString(),
  };
  workflows.unshift(wf);
  res.status(201).json(wf);
});

router.get("/workflows/:id", (req, res) => {
  const wf = workflows.find((w) => w.id === req.params["id"]);
  if (!wf) { res.status(404).json({ error: "Not found" }); return; }
  res.json(wf);
});

router.delete("/workflows/:id", (req, res) => {
  const idx = workflows.findIndex((w) => w.id === req.params["id"]);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  workflows.splice(idx, 1);
  res.status(204).send();
});

router.post("/workflows/:id/run", (req, res) => {
  const wf = workflows.find((w) => w.id === req.params["id"]);
  if (!wf) { res.status(404).json({ error: "Not found" }); return; }
  wf.lastRunAt = new Date().toISOString();
  wf.lastRunStatus = "running";
  setTimeout(() => {
    wf.lastRunStatus = "success";
  }, 3000);
  res.json({
    runId: `run_${randomUUID().slice(0, 8)}`,
    workflowId: wf.id,
    status: "running",
    startedAt: new Date().toISOString(),
    logs: ["Initializing workflow...", "Connecting to AI model...", "Executing step 1 of " + wf.steps],
  });
});

export default router;
