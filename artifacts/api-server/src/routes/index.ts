import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import projectsRouter from "./projects.js";
import workflowsRouter from "./workflows.js";
import deploymentsRouter from "./deployments.js";
import modelsRouter from "./models.js";
import activityRouter from "./activity.js";
import dashboardRouter from "./dashboard.js";
import aiRouter from "./ai.js";
import conversationsRouter from "./conversations.js";
import versionsRouter from "./versions.js";
import checklistRouter from "./checklist.js";
import usageRouter from "./usage.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(workflowsRouter);
router.use(deploymentsRouter);
router.use(modelsRouter);
router.use(activityRouter);
router.use(dashboardRouter);
router.use(aiRouter);
router.use(conversationsRouter);
router.use(versionsRouter);
router.use(checklistRouter);
router.use(usageRouter);

export default router;
