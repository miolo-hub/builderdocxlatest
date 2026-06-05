"use client";

import { useEffect, useState } from "react";

interface ProjectSettingsEditorProps {
  projectId: string;
  name: string;
  location: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  canEdit: boolean;
  onUpdated?: () => void;
}

export function ProjectSettingsEditor({
  projectId,
  name: initialName,
  location: initialLocation,
  websiteUrl: initialWebsiteUrl,
  logoUrl: initialLogoUrl,
  canEdit,
  onUpdated,
}: ProjectSettingsEditorProps) {
  const [name, setName] = useState(initialName);
  const [location, setLocation] = useState(initialLocation);
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsiteUrl ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState(initialLogoUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setName(initialName);
    setLocation(initialLocation);
    setWebsiteUrl(initialWebsiteUrl ?? "");
    setLogoPreview(initialLogoUrl);
    setLogoFile(null);
    setDirty(false);
  }, [initialName, initialLocation, initialWebsiteUrl, initialLogoUrl, projectId]);

  useEffect(() => {
    if (!logoFile) return;
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  if (!canEdit) {
    return (
      <div className="card space-y-3 p-4">
        <h3 className="text-sm font-semibold text-[var(--brand)]">Project details</h3>
        {logoPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoPreview}
            alt={`${initialName} logo`}
            className="h-16 w-16 rounded-lg border border-slate-200 object-contain bg-white"
          />
        )}
        {initialWebsiteUrl && (
          <p className="text-sm">
            <a
              href={initialWebsiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-700 hover:underline"
            >
              {initialWebsiteUrl}
            </a>
          </p>
        )}
        {!logoPreview && !initialWebsiteUrl && (
          <p className="text-sm text-[var(--muted)]">No website or logo set.</p>
        )}
      </div>
    );
  }

  async function save() {
    setSaving(true);
    setError("");

    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        location: location.trim(),
        websiteUrl: websiteUrl.trim(),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSaving(false);
      setError(data.error ?? "Failed to update project");
      return;
    }

    if (logoFile) {
      const form = new FormData();
      form.append("file", logoFile);
      const logoRes = await fetch(`/api/projects/${projectId}/logo`, {
        method: "POST",
        body: form,
      });
      const logoData = await logoRes.json();
      if (!logoRes.ok) {
        setSaving(false);
        setError(logoData.error ?? "Project saved but logo upload failed");
        return;
      }
      setLogoPreview(logoData.project?.logoUrl ?? logoPreview);
      setLogoFile(null);
    }

    setSaving(false);
    setDirty(false);
    onUpdated?.();
  }

  return (
    <div className="card space-y-4 p-4">
      <h3 className="text-sm font-semibold text-[var(--brand)]">Project details</h3>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Project name</span>
        <input
          className="input"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setDirty(true);
          }}
          required
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Location</span>
        <input
          className="input"
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
            setDirty(true);
          }}
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Project website</span>
        <input
          type="url"
          className="input"
          placeholder="https://example.com"
          value={websiteUrl}
          onChange={(e) => {
            setWebsiteUrl(e.target.value);
            setDirty(true);
          }}
        />
      </label>

      <div className="text-sm">
        <span className="mb-1 block font-medium">Project logo</span>
        {logoPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoPreview}
            alt="Project logo preview"
            className="mb-2 h-16 w-16 rounded-lg border border-slate-200 object-contain bg-white"
          />
        )}
        <input
          type="file"
          className="input"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          onChange={(e) => {
            setLogoFile(e.target.files?.[0] ?? null);
            setDirty(true);
          }}
        />
        <span className="mt-1 block text-xs text-[var(--muted)]">
          PNG, JPG, WebP, GIF, or SVG — shown on project cards and detail page.
        </span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        className="btn-primary text-sm"
        disabled={saving || !dirty}
        onClick={() => void save()}
      >
        {saving ? "Saving…" : "Save details"}
      </button>
    </div>
  );
}
