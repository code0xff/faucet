import express from "express";

import actionRoutes from "./routes/actions";
import healthcheckRoutes from "./routes/healthcheck";

const router = express.Router();

router.use(healthcheckRoutes);
router.use(actionRoutes);

export default router;
