import express, { Express } from "express";
import path from "path";
import dotenv from "dotenv";
import connectDB from "./config/database";
import { connectRedis } from "./utils/redis";
import imageRoutes from "./routes/images";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3002;
const frontendPath = path.join(
  __dirname,
  process.env.NODE_ENV === "production" ? "../public" : "../../frontend/build"
);

// Middleware
app.use(express.json());
app.use(express.static(frontendPath));

// Database and Redis connections
connectDB();
connectRedis();

// API Routes
app.use("/api/images", imageRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "App service is running" });
});

// Serve frontend for all other routes
app.get("/*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// test comment
app.listen(PORT, () => {
  console.log(`App service listening on port ${PORT}`);
});
