"use client";

import { FormEvent, useState } from "react";
import { Banner } from "./Banner";

export type Person = { id: string; name: string; email: string };

export function SharePanel({
  documentId,
  initialShares,
}: {
  documentId: string;
  initialShares: Person[];
}) {
  const [shares, setShares] = useState(initialShares);
  const [email, setEmail] = useState("alan@ajaia.dev");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onShare(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { error?: string; shares?: Person[] };
      if (!response.ok || !data.shares) {
        setError(data.error || "Could not share.");
        return;
      }
      setShares(data.shares);
      setSuccess(`Shared with ${email.trim().toLowerCase()}. They can open it after signing in.`);
    } catch {
      setError("Could not share this document.");
    } finally {
      setPending(false);
    }
  }

  async function onRevoke(targetEmail: string) {
    setError(null);
    setSuccess(null);
    const response = await fetch(`/api/documents/${documentId}/share`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail }),
    });
    const data = (await response.json()) as { error?: string; shares?: Person[] };
    if (!response.ok || !data.shares) {
      setError(data.error || "Could not update sharing.");
      return;
    }
    setShares(data.shares);
  }

  return (
    <aside className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-stone-900">Share</h2>
      <p className="mt-1 text-xs text-stone-500">
        Owners can grant access to another seeded user. Shared users can edit the body, not rename, delete, or reshare.
      </p>
      <form onSubmit={onShare} className="mt-3 flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="user@ajaia.dev"
          className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none ring-teal-700/30 focus:ring-2"
          required
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-teal-800 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {pending ? "Sharing…" : "Share"}
        </button>
      </form>
      <div className="mt-3 space-y-2">
        <Banner message={error} />
        <Banner message={success} tone="success" />
      </div>
      <ul className="mt-3 space-y-2">
        {shares.length === 0 ? (
          <li className="text-sm text-stone-500">Not shared with anyone yet.</li>
        ) : (
          shares.map((person) => (
            <li key={person.id} className="flex items-center justify-between gap-2 text-sm">
              <span>
                <span className="font-medium text-stone-800">{person.name}</span>
                <span className="text-stone-500"> · {person.email}</span>
              </span>
              <button
                type="button"
                className="text-xs text-stone-500 hover:text-red-700"
                onClick={() => void onRevoke(person.email)}
              >
                Remove
              </button>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}
