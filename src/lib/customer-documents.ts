import { DOCUMENT_TYPE_LABELS } from "./constants";
import { getPrisma } from "./prisma";
import type { DocumentType } from "./types";

export async function getClientAccessibleDocs(clientId: string) {
  const docs = await getPrisma().document.findMany({
    where: { clientId, visibility: "customer" },
    orderBy: { createdAt: "desc" },
  });

  const latestByType = new Map<string, (typeof docs)[0]>();
  for (const doc of docs) {
    if (!latestByType.has(doc.type)) latestByType.set(doc.type, doc);
  }

  return Array.from(latestByType.values()).sort((a, b) =>
    (DOCUMENT_TYPE_LABELS[a.type as DocumentType] ?? a.type).localeCompare(
      DOCUMENT_TYPE_LABELS[b.type as DocumentType] ?? b.type
    )
  );
}

export function formatDocListLine(
  doc: { type: string; documentDate: Date },
  index: number
): string {
  const label =
    DOCUMENT_TYPE_LABELS[doc.type as DocumentType] ?? doc.type;
  const date = doc.documentDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${index + 1}. 📄 ${label} (${date})`;
}

export async function matchCustomerDoc(clientId: string, input: string) {
  const docs = await getClientAccessibleDocs(clientId);
  const lower = input.toLowerCase().trim();
  const num = parseInt(input, 10);
  if (!isNaN(num) && num >= 1 && num <= docs.length) return docs[num - 1];

  for (const d of docs) {
    const label = (
      DOCUMENT_TYPE_LABELS[d.type as DocumentType] ?? d.type
    ).toLowerCase();
    if (
      lower === label ||
      lower.includes(label) ||
      label.includes(lower) ||
      d.title.toLowerCase().includes(lower) ||
      lower.includes("agreement") && d.type === "sale_agreement" ||
      lower.includes("receipt") && d.type === "payment_receipt" ||
      lower.includes("noc") && d.type === "noc" ||
      lower.includes("brochure") && d.type === "brochure"
    ) {
      return d;
    }
  }
  return null;
}
