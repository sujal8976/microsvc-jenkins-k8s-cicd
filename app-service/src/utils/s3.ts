import AWS from "aws-sdk";

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_S3_REGION || "us-east-1",
});

export const uploadToS3 = async (
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> => {
  try {
    const params = {
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    };

    await s3.upload(params).promise();
    const url = `https://${bucket}.s3.amazonaws.com/${key}`;
    return url;
  } catch (error) {
    console.error("S3 upload error:", error);
    throw error;
  }
};

export const getS3Url = (bucket: string, key: string): string => {
  return `https://${bucket}.s3.amazonaws.com/${key}`;
};

export default s3;
