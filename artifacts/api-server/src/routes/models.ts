import { Router } from "express";

const router = Router();

const models = [
  {
    id: "deepseek-coder-v2",
    name: "DeepSeek Coder V2",
    provider: "DeepSeek",
    tier: "powerful",
    contextWindow: 128000,
    costPer1kTokens: 0.0002,
    capabilities: ["code-generation", "debugging", "refactoring", "architecture"],
    recommended: true,
  },
  {
    id: "qwen-2.5-coder-32b",
    name: "Qwen 2.5 Coder 32B",
    provider: "Alibaba",
    tier: "balanced",
    contextWindow: 32000,
    costPer1kTokens: 0.0001,
    capabilities: ["code-generation", "debugging", "documentation"],
    recommended: false,
  },
  {
    id: "mistral-codestral",
    name: "Codestral",
    provider: "Mistral AI",
    tier: "fast",
    contextWindow: 32000,
    costPer1kTokens: 0.00005,
    capabilities: ["code-completion", "code-generation", "fill-in-middle"],
    recommended: false,
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    tier: "powerful",
    contextWindow: 200000,
    costPer1kTokens: 0.003,
    capabilities: ["code-generation", "architecture", "security-review", "documentation", "reasoning"],
    recommended: false,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    tier: "fast",
    contextWindow: 128000,
    costPer1kTokens: 0.00015,
    capabilities: ["code-generation", "debugging", "chat"],
    recommended: false,
  },
  {
    id: "llama-3.3-70b",
    name: "Llama 3.3 70B",
    provider: "Meta (via OpenRouter)",
    tier: "balanced",
    contextWindow: 131072,
    costPer1kTokens: 0.00007,
    capabilities: ["code-generation", "reasoning", "analysis"],
    recommended: false,
  },
];

router.get("/models", (req, res) => {
  res.json(models);
});

export default router;
