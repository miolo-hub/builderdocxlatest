import { readFileSync } from "fs";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";

function loadEnv() {
  try {
    const raw = readFileSync(".env.local", "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim();
    }
  } catch {
    console.error("Missing .env.local");
    process.exit(1);
  }
}

loadEnv();

const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const bucket = process.env.R2_BUCKET_NAME || "builder";

try {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log(`Bucket "${bucket}" exists.`);
  } catch {
    console.log(`HeadBucket skipped or denied — trying write to "${bucket}"...`);
  }
  const testKey = "_healthcheck.txt";
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: testKey,
      Body: "ok",
      ContentType: "text/plain",
    })
  );
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: testKey }));
  console.log(`R2 OK: wrote and deleted test object in "${bucket}".`);
} catch (e) {
  console.error("R2 test failed:", e.message || e);
  console.error(
    "Check: bucket exists in Cloudflare dashboard, R2_BUCKET_NAME matches, and API token has Object Read & Write for that bucket."
  );
  process.exit(1);
}
