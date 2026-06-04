import { DOCUMENT_TYPE_LABELS } from "./constants";
import { readStore } from "./store";
import type { DocumentRecord, DocumentType } from "./types";

/** Customer-facing docs: newest first, one entry per type (latest upload wins). */
export function getCustomerAccessibleDocs(customerId: string): DocumentRecord[] {
  const store = readStore();
  const sorted = store.documents
    .filter((d) => d.customerId === customerId && d.visibility === "customer")
    .sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

  const latestByType = new Map<DocumentType, DocumentRecord>();
  for (const doc of sorted) {
    if (!latestByType.has(doc.type)) {
      latestByType.set(doc.type, doc);
    }
  }

  return Array.from(latestByType.values()).sort((a, b) =>
    DOCUMENT_TYPE_LABELS[a.type].localeCompare(DOCUMENT_TYPE_LABELS[b.type])
  );
}

export function formatDocListLine(doc: DocumentRecord, index: number): string {
  const date = new Date(doc.documentDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${index + 1}. 📄 ${DOCUMENT_TYPE_LABELS[doc.type]} (${date})`;
}

export function matchCustomerDoc(
  customerId: string,
  input: string
): DocumentRecord | null {
  const docs = getCustomerAccessibleDocs(customerId);
  const lower = input.toLowerCase().trim();

  const num = parseInt(input, 10);
  if (!isNaN(num) && num >= 1 && num <= docs.length) {
    return docs[num - 1];
  }

  for (const d of docs) {
    const label = DOCUMENT_TYPE_LABELS[d.type].toLowerCase();
    if (
      lower === label ||
      lower.includes(label) ||
      label.includes(lower) ||
      d.title.toLowerCase().includes(lower)
    ) {
      return d;
    }
  }

  return null;
}
