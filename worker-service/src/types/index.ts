// Shared types across microservices

export interface User {
  _id: string;
  email: string;
  password: string;
  createdAt: Date;
}

export interface TokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ImageSize {
  url: string;
  width: number;
  height: number;
  size: string;
}

export interface ImageMetadata {
  _id: string;
  userId: string;
  originalName: string;
  status: "pending" | "processing" | "complete" | "failed";
  sizes: {
    thumbnail: ImageSize;
    small: ImageSize;
    medium: ImageSize;
    large: ImageSize;
    original: ImageSize;
  };
  uploadedAt: Date;
  processedAt?: Date;
  errorMessage?: string;
}

export interface ResizeJob {
  jobId: string;
  imageId: string;
  userId: string;
  originalPath: string;
  originalName: string;
  timestamp: number;
}

export interface ResizeJobResult {
  jobId: string;
  imageId: string;
  userId: string;
  status: "complete" | "failed";
  sizes?: {
    thumbnail: ImageSize;
    small: ImageSize;
    medium: ImageSize;
    large: ImageSize;
    original: ImageSize;
  };
  errorMessage?: string;
}

export const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150 },
  small: { width: 480, height: 480 },
  medium: { width: 1024, height: 1024 },
  large: { width: 1920, height: 1920 },
};
