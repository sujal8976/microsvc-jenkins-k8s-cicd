import mongoose, { Schema, Document } from "mongoose";
import { ImageMetadata as IImageMetadata } from "../types";

const imageSizeSchema = new Schema({
  url: { type: String, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  size: { type: String, required: true },
});

const imageMetadataSchema = new Schema<IImageMetadata>({
  _id: { type: String, required: true }, // Allow UUID strings as _id
  userId: { type: String, required: true, index: true },
  originalName: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "processing", "complete", "failed"],
    default: "pending",
  },
  sizes: {
    thumbnail: imageSizeSchema,
    small: imageSizeSchema,
    medium: imageSizeSchema,
    large: imageSizeSchema,
    original: imageSizeSchema,
  },
  uploadedAt: { type: Date, default: Date.now },
  processedAt: Date,
  errorMessage: String,
});

const ImageMetadata = mongoose.model<IImageMetadata>(
  "ImageMetadata",
  imageMetadataSchema
);
export default ImageMetadata;
