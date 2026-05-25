import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import workflowsRouter from "./workflows";
import deploymentsRouter from "./deployments";
import modelsRouter from "./models";
import activityRouter from "./activity";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(workflowsRouter);
router.use(deploymentsRouter);
router.use(modelsRouter);
router.use(activityRouter);
router.use(dashboardRouter);

export default router;
