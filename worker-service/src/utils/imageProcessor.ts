import sharp from "sharp";
import { IMAGE_SIZES } from "../types";

interface ResizeResult {
  buffer: Buffer;
  width: number;
  height: number;
  size: string;
}

export const resizeImage = async (
  imageBuffer: Buffer,
  width: number,
  height: number
): Promise<ResizeResult> => {
  try {
    const resized = await sharp(imageBuffer)
      .resize(width, height, {
        fit: "cover",
        position: "center",
      })
      .toBuffer({ resolveWithObject: true });

    return {
      buffer: resized.data,
      width: resized.info.width,
      height: resized.info.height,
      size: `${(resized.data.length / 1024).toFixed(2)}KB`,
    };
  } catch (error) {
    console.error("Image resize error:", error);
    throw error;
  }
};

export const getImageDimensions = async (
  imageBuffer: Buffer
): Promise<{ width: number; height: number }> => {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  } catch (error) {
    console.error("Error getting image dimensions:", error);
    throw error;
  }
};

export const processImageResolutions = async (
  imageBuffer: Buffer
): Promise<{ [key: string]: ResizeResult }> => {
  const results: { [key: string]: ResizeResult } = {};

  for (const [key, dimensions] of Object.entries(IMAGE_SIZES)) {
    results[key] = await resizeImage(
      imageBuffer,
      dimensions.width,
      dimensions.height
    );
  }

  // Get original dimensions
  const originalDimensions = await getImageDimensions(imageBuffer);
  results.original = {
    buffer: imageBuffer,
    ...originalDimensions,
    size: `${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB`,
  };

  return results;
};
