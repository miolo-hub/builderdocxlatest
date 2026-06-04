import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

let client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!client) {
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error("R2 credentials not configured");
    }
    client = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return client;
}

export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}

export function getR2Bucket(): string {
  return process.env.R2_BUCKET_NAME ?? "builder";
}

/** R2 object keys use this prefix (not local /uploads/ paths). */
export function isR2ObjectKey(filePath: string): boolean {
  return filePath.startsWith("documents/");
}

export function buildObjectKey(
  builderId: string,
  customerId: string,
  fileName: string
): string {
  const safe = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `documents/${builderId}/${customerId}/${Date.now()}-${safe}`;
}

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function getFromR2(
  key: string
): Promise<{ body: Uint8Array; contentType: string } | null> {
  try {
    const res = await getR2Client().send(
      new GetObjectCommand({
        Bucket: getR2Bucket(),
        Key: key,
      })
    );
    if (!res.Body) return null;
    const bytes = await res.Body.transformToByteArray();
    return {
      body: bytes,
      contentType: res.ContentType ?? "application/octet-stream",
    };
  } catch (err: unknown) {
    const code =
      err && typeof err === "object" && "name" in err
        ? (err as { name: string }).name
        : "";
    if (code === "NoSuchKey" || code === "NotFound") return null;
    throw err;
  }
}

export async function existsInR2(key: string): Promise<boolean> {
  try {
    await getR2Client().send(
      new HeadObjectCommand({
        Bucket: getR2Bucket(),
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}
