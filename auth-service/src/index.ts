import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/database";
import authRoutes from "./routes/auth";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Database connection
connectDB();

// Routes
app.use("/api/auth", authRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "Auth service is running" });
});

app.listen(PORT, () => {
  console.log(`Auth service listening on port ${PORT}`);
});

//test comment 