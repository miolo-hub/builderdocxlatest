import crypto from "crypto";

const SECRET = process.env.SIGNED_URL_SECRET ?? "builderdocs-dev-secret";

export function createSignedUrl(filePath: string, expiresInSeconds = 300): string {
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload = `${filePath}:${expires}`;
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  const params = new URLSearchParams({
    path: filePath,
    expires: String(expires),
    sig,
  });
  return `/api/files/download?${params.toString()}`;
}

export function verifySignedUrl(
  filePath: string,
  expires: number,
  sig: string
): boolean {
  if (expires < Math.floor(Date.now() / 1000)) return false;
  const payload = `${filePath}:${expires}`;
  const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  if (sig.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
