import { createClient } from "redis";
import { ResizeJob } from "../types";
import { v4 as uuidv4 } from "uuid";

const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = parseInt(process.env.REDIS_PORT || "6379");
const redisPassword = process.env.REDIS_PASSWORD || "redis-master";

export const redisClient = createClient({
  socket: {
    host: redisHost,
    port: redisPort,
  },
  password: redisPassword,
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

export const pushResizeJob = async (
  imageId: string,
  userId: string,
  originalPath: string,
  originalName: string
): Promise<string> => {
  const jobId = uuidv4();
  const job: ResizeJob = {
    jobId,
    imageId,
    userId,
    originalPath,
    originalName,
    timestamp: Date.now(),
  };

  await redisClient.lPush("resize-queue", JSON.stringify(job));
  await redisClient.set(`job:${jobId}`, JSON.stringify({ status: "pending" }), {
    EX: 86400, // 24 hours expiry
  });

  return jobId;
};

export const getJobStatus = async (jobId: string): Promise<string | null> => {
  const status = await redisClient.get(`job:${jobId}`);
  return status;
};

export const updateJobStatus = async (
  jobId: string,
  status: string
): Promise<void> => {
  await redisClient.set(`job:${jobId}`, JSON.stringify({ status }), {
    EX: 86400,
  });
};
