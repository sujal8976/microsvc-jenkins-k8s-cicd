import express, { Request, Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import ImageMetadata from "../models/ImageMetadata";
import { uploadToS3 } from "../utils/s3";
import { pushResizeJob } from "../utils/redis";
import { authenticateJWT } from "../middleware/auth";

const router = express.Router();

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

// Configure multer for temporary file storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

// POST /images/upload
router.post(
  "/upload",
  authenticateJWT,
  upload.single("image"),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const imageId = uuidv4();
      const originalName = req.file.originalname;
      const bucket = process.env.AWS_S3_BUCKET || "images";

      // Upload original image to S3
      const originalKey = `originals/${userId}/${imageId}${path.extname(
        originalName
      )}`;
      const originalUrl = await uploadToS3(
        bucket,
        originalKey,
        req.file.buffer,
        req.file.mimetype
      );

      // Create metadata document with pending status
      const metadata = new ImageMetadata({
        _id: imageId,
        userId,
        originalName,
        status: "pending",
        sizes: {
          original: {
            url: originalUrl,
            width: 0, // Will be updated by worker
            height: 0,
            size: `${(req.file.size / 1024).toFixed(2)}KB`,
          },
        },
        uploadedAt: new Date(),
      });

      await metadata.save();

      // Push resize job to Redis
      const jobId = await pushResizeJob(
        imageId,
        userId,
        originalKey,
        originalName
      );

      res.status(202).json({
        message: "Image upload accepted for processing",
        imageId,
        jobId,
        status: "pending",
      });
    } catch (error) {
      console.error("Upload error:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("Upload error details:", {
        message: errorMsg,
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        error: "Upload failed",
        details: process.env.NODE_ENV === "development" ? errorMsg : undefined,
      });
    }
  }
);

// GET /images
router.get("/", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const images = await ImageMetadata.find({ userId }).sort({
      uploadedAt: -1,
    });

    res.status(200).json({
      images: images.map((img) => ({
        id: img._id,
        originalName: img.originalName,
        status: img.status,
        uploadedAt: img.uploadedAt,
        processedAt: img.processedAt,
      })),
    });
  } catch (error) {
    console.error("Fetch images error:", error);
    res.status(500).json({ error: "Failed to fetch images" });
  }
});

// GET /images/:id
router.get("/:id", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const image = await ImageMetadata.findOne({ _id: req.params.id, userId });
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    res.status(200).json({
      id: image._id,
      originalName: image.originalName,
      status: image.status,
      sizes: image.status === "complete" ? image.sizes : null,
      uploadedAt: image.uploadedAt,
      processedAt: image.processedAt,
      errorMessage: image.errorMessage,
    });
  } catch (error) {
    console.error("Fetch image error:", error);
    res.status(500).json({ error: "Failed to fetch image" });
  }
});

// GET /images/:id/status
router.get(
  "/:id/status",
  authenticateJWT,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const image = await ImageMetadata.findOne({ _id: req.params.id, userId });
      if (!image) {
        return res.status(404).json({ error: "Image not found" });
      }

      res.status(200).json({
        id: image._id,
        status: image.status,
        errorMessage: image.errorMessage,
      });
    } catch (error) {
      console.error("Fetch status error:", error);
      res.status(500).json({ error: "Failed to fetch status" });
    }
  }
);

export default router;
