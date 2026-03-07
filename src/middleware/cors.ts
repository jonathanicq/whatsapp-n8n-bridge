/**
 * CORS middleware configuration
 */

import cors from "cors";
import { isDevelopment } from "../config/environment";

/**
 * CORS configuration options
 */
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Development: allow all origins
    if (isDevelopment()) {
      return callback(null, true);
    }

    // Production: only allow specific origins
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://n8n.thecoordinates.xyz",
    ];

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  optionsSuccessStatus: 200,
};

/**
 * CORS middleware
 */
export const corsMiddleware = cors(corsOptions);
