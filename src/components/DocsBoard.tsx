"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banner } from "./Banner";

export type DocSummary = {
  id: string;
  title: string;
  updatedAt: string;
  owner: { name: string; email: string };
};

function formatUpdated(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function DocCard({
  doc,
  kind,
  onDelete,
}: {
  doc: DocSummary;
  kind: "owned" | "shared";
  onDelete?: (id: string) => void;
}) {
  return (
    <article className="flex items-start justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              kind === "owned" ? "bg-teal-100 text-teal-900" : "bg-amber-100 text-amber-900"
            }`}
          >
            {kind === "owned" ? "Owned" : "Shared with me"}
          </span>
          {kind === "shared" ? (
            <span className="text-xs text-stone-500">from {doc.owner.name}</span>
          ) : null}
        </div>
        <Link href={`/docs/${doc.id}`} className="block truncate text-base font-semibold text-stone-900 hover:underline">
          {doc.title}
        </Link>
        <p className="mt-1 text-xs text-stone-500">Updated {formatUpdated(doc.updatedAt)}</p>
      </div>
      {onDelete ? (
        <button
          type="button"
          onClick={() => onDelete(doc.id)}
          className="shrink-0 text-xs font-medium text-stone-500 hover:text-red-700"
        >
          Delete
        </button>
      ) : null}
    </article>
  );
}

export function DocsBoard({
  owned,
  shared,
}: {
  owned: DocSummary[];
  shared: DocSummary[];
}) {
  const router = useRouter();
  const [ownedDocs, setOwnedDocs] = useState(owned);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function createDoc() {
    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled document" }),
      });
      const data = (await response.json()) as { error?: string; document?: { id: string } };
      if (!response.ok || !data.document) {
        setError(data.error || "Could not create a document.");
        return;
      }
      router.push(`/docs/${data.document.id}`);
    } catch {
      setError("Could not create a document.");
    } finally {
      setCreating(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    const response = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error || "Could not delete.");
      return;
    }
    setOwnedDocs((current) => current.filter((doc) => doc.id !== id));
  }

  return (
    <div className="space-y-8">
      <Banner message={error} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-600">
          Owned documents are yours to share or delete. Shared documents can be opened and edited, not renamed or reshared.
        </p>
        <button
          type="button"
          onClick={() => void createDoc()}
          disabled={creating}
          className="rounded-lg bg-teal-800 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {creating ? "Creating…" : "New document"}
        </button>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Owned by you</h2>
        {ownedDocs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-300 bg-white/60 p-6 text-sm text-stone-500">
            You do not own any documents yet. Create one or upload a file.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {ownedDocs.map((doc) => (
              <DocCard key={doc.id} doc={doc} kind="owned" onDelete={onDelete} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Shared with me</h2>
        {shared.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-300 bg-white/60 p-6 text-sm text-stone-500">
            Nothing has been shared with you yet. Log in as Alan to see Ada&apos;s seeded Product brief.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {shared.map((doc) => (
              <DocCard key={doc.id} doc={doc} kind="shared" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
