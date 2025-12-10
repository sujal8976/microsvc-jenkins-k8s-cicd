import express, { Request, Response } from "express";
import User from "../models/User";
import {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/jwt";

const router = express.Router();

interface RegisterRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

interface RefreshRequest extends Request {
  body: {
    refreshToken: string;
  };
}

interface VerifyRequest extends Request {
  body: {
    token: string;
  };
}

// POST /auth/register
router.post("/register", async (req: RegisterRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const user = new User({ email: email.toLowerCase(), password });
    await user.save();

    const tokens = generateTokens(user._id.toString(), user.email);

    res.status(201).json({
      message: "User registered successfully",
      userId: user._id,
      email: user.email,
      ...tokens,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /auth/login
router.post("/login", async (req: LoginRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const tokens = generateTokens(user._id.toString(), user.email);

    res.status(200).json({
      message: "Login successful",
      userId: user._id,
      email: user.email,
      ...tokens,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /auth/refresh
router.post("/refresh", async (req: RefreshRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const tokens = generateTokens(decoded.userId, decoded.email);

    res.status(200).json({
      message: "Tokens refreshed",
      ...tokens,
    });
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(500).json({ error: "Token refresh failed" });
  }
});

// POST /auth/verify (internal endpoint)
router.post("/verify", (req: VerifyRequest, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token required", valid: false });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid token", valid: false });
    }

    res.status(200).json({
      valid: true,
      userId: decoded.userId,
      email: decoded.email,
    });
  } catch (error) {
    console.error("Verify error:", error);
    res.status(500).json({ error: "Verification failed", valid: false });
  }
});

export default router;
