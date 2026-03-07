/**
 * Route aggregation
 */

import { Router } from "express";
import healthRoutes from "./health";

const router = Router();

/**
 * Health check routes
 */
router.use("/health", healthRoutes);

export default router;
