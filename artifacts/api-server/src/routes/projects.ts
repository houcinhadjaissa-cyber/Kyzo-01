import { Router } from "express";
import { randomUUID } from "crypto";

const router = Router();

interface Project {
  id: string;
  name: string;
  description: string;
  prompt: string;
  status: "idle" | "generating" | "ready" | "deploying" | "deployed" | "error";
  tech: string[];
  deployedUrl?: string;
  lastDeployedAt?: string;
  securityScore?: number;
  createdAt: string;
  updatedAt: string;
}

const projects: Project[] = [
  {
    id: "proj_001",
    name: "E-Commerce Store",
    description: "A full-stack online store with Stripe payments and inventory management",
    prompt: "Build me an e-commerce store with product listings, cart, checkout and Stripe payments",
    status: "deployed",
    tech: ["Next.js", "Supabase", "Stripe", "Tailwind"],
    deployedUrl: "https://mystore.vercel.app",
    lastDeployedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    securityScore: 94,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "proj_002",
    name: "SaaS Dashboard",
    description: "Analytics dashboard with user management, billing, and team features",
    prompt: "Create a SaaS analytics dashboard with charts, user management and Stripe billing",
    status: "ready",
    tech: ["React", "Node.js", "PostgreSQL", "Recharts"],
    securityScore: 88,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "proj_003",
    name: "AI Chatbot",
    description: "Customer support chatbot with GPT-4 and knowledge base integration",
    prompt: "Build an AI customer support chatbot with GPT-4 and custom knowledge base",
    status: "generating",
    tech: ["Next.js", "OpenAI", "Pinecone", "Vercel"],
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
];

router.get("/projects", (req, res) => {
  res.json(projects);
});

router.post("/projects", (req, res) => {
  const { name, prompt, tech = [] } = req.body as { name: string; prompt: string; tech?: string[] };
  const project: Project = {
    id: `proj_${randomUUID().slice(0, 8)}`,
    name,
    description: "",
    prompt,
    status: "idle",
    tech,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  projects.unshift(project);
  res.status(201).json(project);
});

router.get("/projects/:id", (req, res) => {
  const project = projects.find((p) => p.id === req.params["id"]);
  if (!project) return res.status(404).json({ error: "Not found" });
  res.json(project);
});

router.patch("/projects/:id", (req, res) => {
  const idx = projects.findIndex((p) => p.id === req.params["id"]);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  projects[idx] = { ...projects[idx]!, ...req.body, updatedAt: new Date().toISOString() };
  res.json(projects[idx]);
});

router.delete("/projects/:id", (req, res) => {
  const idx = projects.findIndex((p) => p.id === req.params["id"]);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  projects.splice(idx, 1);
  res.status(204).send();
});

router.post("/projects/:id/generate", (req, res) => {
  const project = projects.find((p) => p.id === req.params["id"]);
  if (!project) return res.status(404).json({ error: "Not found" });
  project.status = "generating";
  project.updatedAt = new Date().toISOString();
  setTimeout(() => {
    project.status = "ready";
    project.securityScore = Math.floor(80 + Math.random() * 20);
    project.updatedAt = new Date().toISOString();
  }, 8000);
  res.json({
    jobId: `job_${randomUUID().slice(0, 8)}`,
    projectId: project.id,
    status: "running",
    modelUsed: "deepseek-coder-v2",
    estimatedSeconds: 30,
    startedAt: new Date().toISOString(),
  });
});

router.post("/projects/:id/scan", (req, res) => {
  const project = projects.find((p) => p.id === req.params["id"]);
  if (!project) return res.status(404).json({ error: "Not found" });
  const score = project.securityScore ?? Math.floor(70 + Math.random() * 30);
  res.json({
    projectId: project.id,
    score,
    criticalIssues: score > 90 ? 0 : 1,
    highIssues: score > 85 ? 0 : 2,
    mediumIssues: Math.floor(Math.random() * 3),
    lowIssues: Math.floor(Math.random() * 5),
    findings: score > 90 ? [] : [
      {
        severity: "high",
        title: "Missing CSRF protection",
        description: "POST endpoints lack CSRF token validation",
        file: "src/api/routes.ts",
        line: 42,
      },
      {
        severity: "medium",
        title: "Verbose error messages",
        description: "Stack traces exposed in production error responses",
        file: "src/middleware/errors.ts",
        line: 18,
      },
    ],
    scannedAt: new Date().toISOString(),
  });
});

router.post("/projects/:id/deploy", (req, res) => {
  const project = projects.find((p) => p.id === req.params["id"]);
  if (!project) return res.status(404).json({ error: "Not found" });
  const { provider = "vercel" } = req.body as { provider: string };
  project.status = "deploying";
  project.updatedAt = new Date().toISOString();
  const deployment = {
    id: `dep_${randomUUID().slice(0, 8)}`,
    projectId: project.id,
    provider,
    status: "building" as const,
    branch: "main",
    createdAt: new Date().toISOString(),
  };
  setTimeout(() => {
    project.status = "deployed";
    project.deployedUrl = `https://${project.name.toLowerCase().replace(/\s+/g, "-")}.vercel.app`;
    project.lastDeployedAt = new Date().toISOString();
    project.updatedAt = new Date().toISOString();
  }, 6000);
  res.json(deployment);
});

router.get("/projects/:id/deployments", (req, res) => {
  res.json([
    {
      id: `dep_${randomUUID().slice(0, 8)}`,
      projectId: req.params["id"],
      provider: "vercel",
      status: "live",
      url: "https://project.vercel.app",
      branch: "main",
      duration: 47,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 47000).toISOString(),
    },
  ]);
});

export default router;
