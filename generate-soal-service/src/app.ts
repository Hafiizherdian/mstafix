import express from "express";
import cors from "cors";
import questionRoutes from "./routes/question.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();

// Konfigurasi dasar
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cors());

// Routes
app.use("/api/v1", questionRoutes);
app.use("/api/v1/admin", adminRoutes);

// Error handling sederhana
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  },
);

export default app;
