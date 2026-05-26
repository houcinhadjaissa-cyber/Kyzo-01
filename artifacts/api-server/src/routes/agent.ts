import { Router } from "express";
import { randomUUID } from "crypto";

const router = Router();

export interface AgentFix {
  id: string;
  issue: string;
  severity: "critical" | "high" | "medium" | "low";
  category: "security" | "performance" | "type_error" | "config" | "dependency";
  description: string;
  solution: string;
  status: "detected" | "researching" | "applied" | "verified" | "failed";
  projectId?: string;
  projectName?: string;
  autoApplied: boolean;
  createdAt: string;
  resolvedAt?: string;
}

export interface AgentStatus {
  mode: "active" | "paused";
  isScanning: boolean;
  lastScanAt: string;
  totalFixesApplied: number;
  totalIssuesDetected: number;
  uptime: number;
  health: "nominal" | "degraded" | "error";
}

const fixes: AgentFix[] = [
  {
    id: "fix_001",
    issue: "Missing CSRF protection",
    severity: "high",
    category: "security",
    description: "POST endpoints lacked CSRF token validation allowing cross-site request forgery attacks.",
    solution: "Added CSRF middleware with double-submit cookie pattern on all state-changing endpoints.",
    status: "verified",
    autoApplied: true,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 3 * 60 * 60 * 1000 + 45000).toISOString(),
  },
  {
    id: "fix_002",
    issue: "Verbose error messages in production",
    severity: "medium",
    category: "security",
    description: "Stack traces were being exposed in production error responses, leaking internal details.",
    solution: "Wrapped error handler to return generic messages in production while logging full traces server-side.",
    status: "applied",
    autoApplied: true,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 58 * 60 * 1000).toISOString(),
  },
  {
    id: "fix_003",
    issue: "Dependency with known vulnerability",
    severity: "high",
    category: "dependency",
    description: "Package 'lodash@4.17.20' has a known prototype pollution vulnerability (CVE-2021-23337).",
    solution: "Updated lodash to 4.17.21 and pinned version in package.json.",
    status: "researching",
    autoApplied: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
];

const agentStatus: AgentStatus = {
  mode: "active",
  isScanning: false,
  lastScanAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  totalFixesApplied: 47,
  totalIssuesDetected: 52,
  uptime: 99.7,
  health: "nominal",
};

router.get("/agent/status", (_req, res) => {
  res.json(agentStatus);
});

router.get("/agent/fixes", (req, res) => {
  const { status, limit } = req.query as { status?: string; limit?: string };
  let result = [...fixes];
  if (status) result = result.filter(f => f.status === status);
  if (limit) result = result.slice(0, parseInt(limit));
  res.json(result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

router.get("/agent/fixes/:id", (req, res) => {
  const fix = fixes.find(f => f.id === req.params["id"]);
  if (!fix) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fix);
});

router.post("/agent/scan", (_req, res) => {
  agentStatus.isScanning = true;
  agentStatus.lastScanAt = new Date().toISOString();
  const jobId = `scan_${randomUUID().slice(0, 8)}`;
  setTimeout(() => {
    agentStatus.isScanning = false;
    agentStatus.lastScanAt = new Date().toISOString();
    agentStatus.totalIssuesDetected += Math.floor(Math.random() * 3);
  }, 5000);
  res.json({ jobId, status: "running", startedAt: new Date().toISOString() });
});

router.post("/agent/pause", (_req, res) => {
  agentStatus.mode = "paused";
  res.json(agentStatus);
});

router.post("/agent/resume", (_req, res) => {
  agentStatus.mode = "active";
  res.json(agentStatus);
});

router.post("/agent/fixes/:id/approve", (req, res) => {
  const fix = fixes.find(f => f.id === req.params["id"]);
  if (!fix) { res.status(404).json({ error: "Not found" }); return; }
  fix.status = "applied";
  fix.resolvedAt = new Date().toISOString();
  agentStatus.totalFixesApplied += 1;
  res.json(fix);
});

export default router;
