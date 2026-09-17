"use client";

import { useEffect, useState } from "react";
import { DocsBoard, type DocSummary } from "@/components/DocsBoard";
import { SignOutButton } from "@/components/SignOutButton";
import { UploadButton } from "@/components/UploadButton";
import { Banner } from "@/components/Banner";

type Me = { id: string; name: string; email: string };

export default function DocsPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [owned, setOwned] = useState<DocSummary[] | null>(null);
  const [shared, setShared] = useState<DocSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [meRes, docsRes] = await Promise.all([fetch("/api/auth/me"), fetch("/api/documents")]);
      if (cancelled) return;
      if (!meRes.ok) {
        window.location.href = "/";
        return;
      }
      const meData = (await meRes.json()) as { user: Me };
      const docsData = (await docsRes.json()) as { error?: string; owned?: DocSummary[]; shared?: DocSummary[] };
      if (!docsRes.ok) {
        setError(docsData.error || "Could not load documents.");
        return;
      }
      setMe(meData.user);
      setOwned(docsData.owned ?? []);
      setShared(docsData.shared ?? []);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-800">Ajaia Docs</p>
          <h1 className="mt-1 text-3xl font-semibold text-stone-900">Documents</h1>
          <p className="mt-1 text-sm text-stone-600">
            {me ? (
              <>
                Signed in as <span className="font-medium text-stone-800">{me.name}</span> ({me.email})
              </>
            ) : (
              "Loading…"
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <SignOutButton />
          <UploadButton />
        </div>
      </header>
      <Banner message={error} />
      {owned ? <DocsBoard owned={owned} shared={shared} /> : <p className="text-sm text-stone-500">Loading documents…</p>}
    </main>
  );
}
