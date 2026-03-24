import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Initialize S3 client using S3-compatible storage (e.g. DigitalOcean Spaces). Server-only — never use NEXT_PUBLIC_ for keys.
export const s3Client = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT,
  region: process.env.DO_SPACES_REGION,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY || "",
    secretAccessKey: process.env.DO_SPACES_SECRET || "",
  },
});

export async function uploadToS3(file: Buffer, filename: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.DO_SPACES_BUCKET,
    Key: `uploads/${filename}`,
    Body: file,
    ContentType: contentType,
    ACL: "public-read",
  });

  await s3Client.send(command);
  
  // Return the public URL
  const endpoint = process.env.DO_SPACES_ENDPOINT || '';
  const bucket = process.env.DO_SPACES_BUCKET || '';
  return `${endpoint.replace(/https:\/\//, 'https://')}/${bucket}/uploads/${filename}`;
} 