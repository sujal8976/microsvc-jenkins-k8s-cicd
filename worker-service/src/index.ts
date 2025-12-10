import dotenv from "dotenv";
import connectDB from "./config/database";
import { connectRedis, popResizeJob, setJobStatus } from "./utils/redis";
import { downloadFromS3, uploadToS3 } from "./utils/s3";
import { processImageResolutions } from "./utils/imageProcessor";
import ImageMetadata from "./models/ImageMetadata";
import path from "path";

dotenv.config();

const BUCKET = process.env.AWS_S3_BUCKET || "images";

const processJob = async () => {
  try {
    const job = await popResizeJob();
    if (!job) {
      return;
    }

    console.log(`Processing job: ${job.jobId} for image: ${job.imageId}`);

    // Update job status to processing
    await setJobStatus(job.jobId, "processing");

    // Update metadata to processing
    await ImageMetadata.findByIdAndUpdate(job.imageId, {
      status: "processing",
    });

    // Download original image from S3
    const imageBuffer = await downloadFromS3(BUCKET, job.originalPath);

    // Process all resolutions
    const resolutions = await processImageResolutions(imageBuffer);

    // Upload all resolutions to S3
    const sizeUrls: { [key: string]: any } = {};
    for (const [key, resolution] of Object.entries(resolutions)) {
      const fileExt = path.extname(job.originalName);
      const uploadKey = `${key}/${job.userId}/${job.imageId}${fileExt}`;

      const url = await uploadToS3(
        BUCKET,
        uploadKey,
        resolution.buffer,
        "image/jpeg"
      );

      sizeUrls[key] = {
        url,
        width: resolution.width,
        height: resolution.height,
        size: resolution.size,
      };
    }

    // Update metadata with all URLs
    await ImageMetadata.findByIdAndUpdate(job.imageId, {
      status: "complete",
      sizes: sizeUrls,
      processedAt: new Date(),
    });

    // Update job status to complete
    await setJobStatus(job.jobId, "complete");

    console.log(`Job completed: ${job.jobId}`);
  } catch (error) {
    console.error("Job processing error:", error);

    // Update job status to failed
    const job = await popResizeJob();
    if (job) {
      await setJobStatus(job.jobId, "failed");
      await ImageMetadata.findByIdAndUpdate(job.imageId, {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        processedAt: new Date(),
      });
    }
  }
};

const startWorker = async () => {
  await connectDB();
  await connectRedis();

  console.log("Worker service started");

  // Process jobs continuously
  setInterval(processJob, 2000); // Check for new jobs every 2 seconds
};

startWorker().catch((error) => {
  console.error("Worker startup error:", error);
  process.exit(1);
});
