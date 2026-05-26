import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import workflowsRouter from "./workflows";
import deploymentsRouter from "./deployments";
import modelsRouter from "./models";
import activityRouter from "./activity";
import dashboardRouter from "./dashboard";
import aiRouter from "./ai";
import conversationsRouter from "./conversations";
import versionsRouter from "./versions";
import checklistRouter from "./checklist";
import usageRouter from "./usage";

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
