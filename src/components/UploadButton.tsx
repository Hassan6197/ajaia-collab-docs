"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ALLOWED_UPLOAD_LABEL, MAX_UPLOAD_BYTES } from "@/lib/constants";
import { Banner } from "./Banner";

export function UploadButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setPending(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/documents/upload", { method: "POST", body });
      const data = (await response.json()) as { error?: string; document?: { id: string } };
      if (!response.ok || !data.document) {
        setError(data.error || "Upload failed.");
        return;
      }
      router.push(`/docs/${data.document.id}`);
    } catch {
      setError("Could not upload the file.");
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md,text/plain,text/markdown"
        className="hidden"
        onChange={(event) => void onFile(event.target.files?.[0])}
      />
      <button
        type="button"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-60"
      >
        {pending ? "Uploading…" : "Upload .txt / .md"}
      </button>
      <p className="max-w-xs text-right text-xs text-stone-500">
        Creates a new document from file contents. Allowed: {ALLOWED_UPLOAD_LABEL}. Max {MAX_UPLOAD_BYTES / 1024} KB.
      </p>
      <Banner message={error} />
    </div>
  );
}
