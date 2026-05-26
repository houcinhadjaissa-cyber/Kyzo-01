import { Router } from "express";

const router = Router();

export type Plan = "free" | "pro" | "enterprise";

interface Subscription {
  plan: Plan;
  status: "active" | "cancelled" | "expired";
  billingCycle: "monthly" | "yearly";
  currentPeriodEnd: string;
  usage: {
    aiTokensUsed: number;
    aiTokensLimit: number;
    projectsCount: number;
    projectsLimit: number;
    deploymentsThisMonth: number;
    deploymentsLimit: number;
  };
  features: string[];
}

const PLANS = {
  free: {
    name: "Free",
    price: 0,
    features: [
      "3 projects",
      "100K AI tokens/month",
      "10 deployments/month",
      "Basic security scanner",
      "Community support",
    ],
    limits: { projects: 3, tokens: 100000, deployments: 10 },
  },
  pro: {
    name: "Pro",
    price: 19,
    features: [
      "Unlimited projects",
      "5M AI tokens/month",
      "Unlimited deployments",
      "Advanced security scanner",
      "Self-healing agent",
      "Push notifications",
      "Priority support",
      "Version history (unlimited)",
    ],
    limits: { projects: -1, tokens: 5000000, deployments: -1 },
  },
  enterprise: {
    name: "Enterprise",
    price: 99,
    features: [
      "Everything in Pro",
      "Custom AI model fine-tuning",
      "Dedicated infrastructure",
      "SSO / SAML",
      "Audit logs export",
      "SLA guarantee",
      "Dedicated account manager",
    ],
    limits: { projects: -1, tokens: -1, deployments: -1 },
  },
};

const subscription: Subscription = {
  plan: "free",
  status: "active",
  billingCycle: "monthly",
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  usage: {
    aiTokensUsed: 42300,
    aiTokensLimit: 100000,
    projectsCount: 3,
    projectsLimit: 3,
    deploymentsThisMonth: 7,
    deploymentsLimit: 10,
  },
  features: PLANS.free.features,
};

router.get("/subscription", (_req, res) => {
  res.json(subscription);
});

router.get("/subscription/plans", (_req, res) => {
  res.json(PLANS);
});

router.post("/subscription/upgrade", (req, res) => {
  const { plan } = req.body as { plan: Plan };
  if (!["pro", "enterprise"].includes(plan)) {
    res.status(400).json({ error: "Invalid plan" });
    return;
  }
  subscription.plan = plan;
  subscription.features = PLANS[plan].features;
  subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const limits = PLANS[plan].limits;
  subscription.usage.projectsLimit = limits.projects;
  subscription.usage.aiTokensLimit = limits.tokens;
  subscription.usage.deploymentsLimit = limits.deployments;
  res.json({ success: true, subscription, checkoutUrl: "https://checkout.stripe.com/demo" });
});

export default router;
