import { createClient } from "redis";
import { ResizeJob } from "../types";

const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = parseInt(process.env.REDIS_PORT || "6379");

export const redisClient = createClient({
  socket: {
    host: redisHost,
    port: redisPort,
  },
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("Redis connected successfully");
  } catch (error) {
    console.error("Redis connection failed:", error);
    process.exit(1);
  }
};

export const popResizeJob = async (): Promise<ResizeJob | null> => {
  try {
    const jobData = await redisClient.rPop("resize-queue");
    if (!jobData) {
      return null;
    }

    return JSON.parse(jobData) as ResizeJob;
  } catch (error) {
    console.error("Error popping job:", error);
    return null;
  }
};

export const setJobStatus = async (
  jobId: string,
  status: string
): Promise<void> => {
  try {
    await redisClient.set(`job:${jobId}`, JSON.stringify({ status }), {
      EX: 86400, // 24 hours
    });
  } catch (error) {
    console.error("Error setting job status:", error);
  }
};
