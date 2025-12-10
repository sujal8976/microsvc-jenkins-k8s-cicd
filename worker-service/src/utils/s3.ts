import AWS from "aws-sdk";

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_S3_REGION || "us-east-1",
});

export const downloadFromS3 = async (
  bucket: string,
  key: string
): Promise<Buffer> => {
  try {
    const params = {
      Bucket: bucket,
      Key: key,
    };

    const data = await s3.getObject(params).promise();
    return data.Body as Buffer;
  } catch (error) {
    console.error("S3 download error:", error);
    throw error;
  }
};

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

export default s3;
