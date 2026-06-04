"use client";

import { useState } from "react";
import { DOCUMENT_TYPE_LABELS } from "@/lib/constants";
import type { DocumentType, DocumentVisibility } from "@/lib/types";

const TYPES = Object.entries(DOCUMENT_TYPE_LABELS) as [DocumentType, string][];

interface DocumentUploadFormProps {
  customerId: string;
  customerName: string;
  onUploaded: () => void;
}

export function DocumentUploadForm({
  customerId,
  customerName,
  onUploaded,
}: DocumentUploadFormProps) {
  const [type, setType] = useState<DocumentType>("sale_agreement");
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<DocumentVisibility>("customer");
  const [documentDate, setDocumentDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a file.");
      return;
    }
    setLoading(true);
    setMessage("");
    const form = new FormData();
    form.append("customerId", customerId);
    form.append("type", type);
    form.append("title", title || DOCUMENT_TYPE_LABELS[type]);
    form.append("visibility", visibility);
    form.append("documentDate", documentDate);
    form.append("notifyCustomer", String(notifyCustomer));
    form.append("file", file);

    const res = await fetch("/api/documents", { method: "POST", body: form });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json();
      setMessage(err.error ?? "Upload failed");
      return;
    }
    const data = await res.json();
    setMessage(
      data.notified
        ? "Uploaded! WhatsApp notification queued for customer."
        : "Document uploaded successfully."
    );
    setFile(null);
    setTitle("");
    onUploaded();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-5">
      <h3 className="font-semibold text-[var(--brand)]">Upload document</h3>
      <p className="text-sm text-[var(--muted)]">For {customerName}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Document type</span>
          <select
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value as DocumentType)}
          >
            {TYPES.map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Custom title (optional)</span>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={DOCUMENT_TYPE_LABELS[type]}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Document date</span>
          <input
            type="date"
            className="input"
            value={documentDate}
            onChange={(e) => setDocumentDate(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Visibility</span>
          <select
            className="input"
            value={visibility}
            onChange={(e) =>
              setVisibility(e.target.value as DocumentVisibility)
            }
          >
            <option value="customer">Customer-accessible</option>
            <option value="internal">Internal only</option>
          </select>
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">File (PDF, images)</span>
        <input
          type="file"
          className="input"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={notifyCustomer}
          onChange={(e) => setNotifyCustomer(e.target.checked)}
          disabled={visibility === "internal"}
        />
        Notify customer on WhatsApp when document is ready
      </label>

      {message && (
        <p
          className={`text-sm ${message.includes("failed") ? "text-red-600" : "text-green-700"}`}
        >
          {message}
        </p>
      )}

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Uploading…" : "Upload document"}
      </button>
    </form>
  );
}
