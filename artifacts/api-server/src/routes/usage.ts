import { Router } from "express";
import { db } from "@workspace/db";
import { usageLogsTable } from "@workspace/db";
import { sql, gte, eq } from "drizzle-orm";

const router = Router();

router.get("/usage", async (req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const allLogs = await db.select().from(usageLogsTable);

  const todayLogs = allLogs.filter((l) => l.createdAt >= todayStart);
  const monthLogs = allLogs.filter((l) => l.createdAt >= monthStart);

  const sum = (logs: typeof allLogs) => ({
    tokens: logs.reduce((a, l) => a + (l.totalTokens ?? 0), 0),
    cost: logs.reduce((a, l) => a + (l.estimatedCostUsd ?? 0), 0),
  });

  const byModel: Record<string, { tokens: number; costUsd: number }> = {};
  const byProject: Record<string, { tokens: number; costUsd: number }> = {};

  for (const log of allLogs) {
    if (!byModel[log.modelId]) byModel[log.modelId] = { tokens: 0, costUsd: 0 };
    byModel[log.modelId]!.tokens += log.totalTokens ?? 0;
    byModel[log.modelId]!.costUsd += log.estimatedCostUsd ?? 0;

    if (log.projectId) {
      if (!byProject[log.projectId]) byProject[log.projectId] = { tokens: 0, costUsd: 0 };
      byProject[log.projectId]!.tokens += log.totalTokens ?? 0;
      byProject[log.projectId]!.costUsd += log.estimatedCostUsd ?? 0;
    }
  }

  const totalSums = sum(allLogs);

  res.json({
    todayTokens: sum(todayLogs).tokens,
    todayCostUsd: sum(todayLogs).cost,
    monthTokens: sum(monthLogs).tokens,
    monthCostUsd: sum(monthLogs).cost,
    totalTokens: totalSums.tokens,
    totalCostUsd: totalSums.cost,
    byModel: Object.entries(byModel).map(([modelId, data]) => ({ modelId, ...data })),
    byProject: Object.entries(byProject).map(([projectId, data]) => ({ projectId, ...data })),
  });
});

export default router;
