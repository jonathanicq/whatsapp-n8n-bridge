/**
 * Route aggregation
 */

import { Router } from "express";
import healthRoutes from "./health";
import whatsappRoutes from "./whatsapp";
import queueRoutes from "./queue";

const router = Router();

/**
 * Health check routes
 */
router.use("/health", healthRoutes);

/**
 * WhatsApp routes
 */
router.use("/whatsapp", whatsappRoutes);

/**
 * Message queue routes
 */
router.use("/queue", queueRoutes);

export default router;
