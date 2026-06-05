import fs from "fs";
import path from "path";
import { buildProjectBrochureKey, isR2Configured, uploadToR2 } from "./r2";

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
