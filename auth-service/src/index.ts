import express from "express";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// CORS middleware - allow requests from any origin
app.use(
  (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ): void => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }
    next();
  },
);

// Simple request logging
app.use(
  (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ): void => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  },
);

// Mount auth routes at the root to handle requests from the gateway
app.use("/", authRoutes);

// User routes untuk admin dashboard
app.use("/api/v1/users", userRoutes);
app.use("/api/users", userRoutes);
app.use("/users", userRoutes);

// Admin routes - multiple paths for compatibility
app.use("/api/v1/admin", adminRoutes);
app.use("/api/admin", adminRoutes);
app.use("/admin", adminRoutes);
app.use("/api/v1/auth/admin", adminRoutes);
app.use("/api/auth/admin", adminRoutes);
app.use("/auth/admin", adminRoutes);

// Root endpoint - helpful for debugging
app.get("/", (_: express.Request, res: express.Response): express.Response => {
  return res.json({
    service: "auth-service",
    status: "ok",
    endpoints: [
      "/health",
      "/api/v1/auth/register",
      "/api/v1/auth/login",
      "/api/v1/auth/refresh",
      "/api/v1/auth/logout",
      "/api/auth/register",
      "/api/auth/login",
      "/api/auth/refresh",
      "/api/auth/logout",
      "/api/v1/users",
      "/api/v1/users/count",
      "/api/v1/users/activity",
      "/api/v1/admin/users",
      "/api/v1/admin/users/stats",
      "/api/v1/admin/analytics/users",
      "/api/v1/admin/health",
      "/api/admin/users",
      "/api/admin/analytics/users",
      "/admin/users",
      "/admin/analytics/users",
      "/api/v1/auth/admin/users",
      "/api/v1/auth/admin/users/stats",
    ],
  });
});

// Health check endpoint at root level
app.get(
  "/health",
  (_: express.Request, res: express.Response): express.Response => {
    return res.json({ status: "ok", service: "auth-service" });
  },
);

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ): express.Response => {
    console.error("Error:", err);
    return res.status(err.status || 500).json({
      error: err.message || "Internal Server Error",
    });
  },
);

// Start server
app.listen(port, () => {
  console.log(`Auth service running at http://localhost:${port}`);
  console.log(`Database URL: ${process.env.DATABASE_URL || "Not set"}`);
});
