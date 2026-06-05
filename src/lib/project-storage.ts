import fs from "fs";
import path from "path";
import {
  buildProjectBrochureKey,
  buildProjectLogoKey,
  isR2Configured,
  isR2ObjectKey,
  uploadToR2,
} from "./r2";
import { createSignedUrl } from "./signed-url";

export async function storeProjectBrochure(
  builderId: string,
  projectId: string,
  fileName: string,
  bytes: Buffer,
  mimeType: string
): Promise<string> {
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");

  if (isR2Configured()) {
    const key = buildProjectBrochureKey(builderId, projectId, safeName);
    await uploadToR2(key, bytes, mimeType);
    return key;
  }

  const rel = `/uploads/projects/${builderId}/${projectId}/${Date.now()}-${safeName}`;
  const fullPath = path.join(process.cwd(), "public", rel.replace(/^\//, ""));
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, bytes);
  return rel;
}

export async function storeProjectLogo(
  builderId: string,
  projectId: string,
  fileName: string,
  bytes: Buffer,
  mimeType: string
): Promise<string> {
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");

  if (isR2Configured()) {
    const key = buildProjectLogoKey(builderId, projectId, safeName);
    await uploadToR2(key, bytes, mimeType);
    return key;
  }

  const rel = `/uploads/projects/${builderId}/${projectId}/logo/${Date.now()}-${safeName}`;
  const fullPath = path.join(process.cwd(), "public", rel.replace(/^\//, ""));
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, bytes);
  return rel;
}

export function resolveProjectAssetUrl(filePath: string | null | undefined): string | null {
  if (!filePath) return null;
  if (filePath.startsWith("/uploads/")) return filePath;
  if (isR2ObjectKey(filePath)) return createSignedUrl(filePath, 3600);
  return filePath;
}

export function parseWebsiteUrl(raw: unknown): string | null | undefined {
  if (raw === undefined) return undefined;
  const val = String(raw).trim();
  if (!val) return null;
  try {
    const url = new URL(val);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}
