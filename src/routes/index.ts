/**
 * Route aggregation
 */

import { Router } from "express";
import healthRoutes from "./health";
import whatsappRoutes from "./whatsapp";

const router = Router();

/**
 * Health check routes
 */
router.use("/health", healthRoutes);

/**
 * WhatsApp routes
 */
router.use("/whatsapp", whatsappRoutes);

export default router;
