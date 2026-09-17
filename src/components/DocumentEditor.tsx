"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { Banner } from "./Banner";
import { EditorToolbar } from "./EditorToolbar";
import { SharePanel, type Person } from "./SharePanel";
import type { TiptapDoc } from "@/lib/tiptap-doc";

type DocumentPayload = {
  id: string;
  title: string;
  content: TiptapDoc;
  updatedAt: string;
  owner: Person;
  role: "owner" | "shared";
  shares: Person[];
};

export function DocumentEditor({ documentId }: { documentId: string }) {
  const [doc, setDoc] = useState<DocumentPayload | null>(null);
  const [title, setTitle] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "unsaved">("idle");
  const pendingContent = useRef<TiptapDoc | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(
    async (patch: { title?: string; content?: TiptapDoc }) => {
      setStatus("saving");
      setSaveError(null);
      try {
        const response = await fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = (await response.json()) as { error?: string; document?: { updatedAt: string; title: string } };
        if (!response.ok) {
          setSaveError(data.error || "Save failed.");
          setStatus("unsaved");
          return;
        }
        setStatus("saved");
        if (data.document) {
          setDoc((current) =>
            current
              ? { ...current, title: data.document!.title, updatedAt: data.document!.updatedAt }
              : current,
          );
        }
      } catch {
        setSaveError("Save failed. Check your connection.");
        setStatus("unsaved");
      }
    },
    [documentId],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Placeholder.configure({ placeholder: "Start writing…" }),
    ],
    editorProps: {
      attributes: {
        class: "ajaia-editor",
      },
    },
    onUpdate: ({ editor: instance }) => {
      pendingContent.current = instance.getJSON() as TiptapDoc;
      setStatus("unsaved");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        if (pendingContent.current) {
          void persist({ content: pendingContent.current });
        }
      }, 900);
    },
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const response = await fetch(`/api/documents/${documentId}`);
      const data = (await response.json()) as { error?: string; document?: DocumentPayload };
      if (cancelled) return;
      if (!response.ok || !data.document) {
        setLoadError(data.error || "Could not open this document.");
        return;
      }
      setDoc(data.document);
      setTitle(data.document.title);
      editor?.commands.setContent(data.document.content);
    }
    if (editor) void load();
    return () => {
      cancelled = true;
    };
  }, [documentId, editor]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  async function saveNow() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const content = (editor?.getJSON() as TiptapDoc) ?? pendingContent.current;
    const patch: { title?: string; content?: TiptapDoc } = {};
    if (doc?.role === "owner" && title.trim() && title.trim() !== doc.title) {
      patch.title = title;
    }
    if (content) patch.content = content;
    await persist(patch);
  }

  async function saveTitle() {
    if (!doc || doc.role !== "owner") return;
    if (title.trim() === doc.title) return;
    await persist({ title });
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-xl py-16">
        <Banner message={loadError} />
        <Link href="/docs" className="mt-4 inline-block text-sm text-teal-800 hover:underline">
          Back to documents
        </Link>
      </div>
    );
  }

  if (!doc) {
    return <p className="py-16 text-center text-sm text-stone-500">Opening document…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link href="/docs" className="text-sm text-stone-500 hover:text-stone-800">
            ← Docs
          </Link>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={() => void saveTitle()}
            disabled={doc.role !== "owner"}
            className="min-w-0 flex-1 border-none bg-transparent text-xl font-semibold text-stone-900 outline-none disabled:text-stone-700"
            aria-label="Document title"
          />
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              doc.role === "owner" ? "bg-teal-100 text-teal-900" : "bg-amber-100 text-amber-900"
            }`}
          >
            {doc.role === "owner" ? "Owned" : `Shared by ${doc.owner.name}`}
          </span>
          <span className="text-xs text-stone-500">
            {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : status === "unsaved" ? "Unsaved" : "Ready"}
          </span>
          <button
            type="button"
            onClick={() => void saveNow()}
            className="rounded-lg bg-teal-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Save
          </button>
        </div>
      </div>
      <Banner message={saveError} />
      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <EditorToolbar editor={editor} />
          <EditorContent editor={editor} />
        </div>
        {doc.role === "owner" ? <SharePanel documentId={doc.id} initialShares={doc.shares} /> : (
          <aside className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-600 shadow-sm">
            You can edit this shared document. Only {doc.owner.name} can rename, delete, or change who has access.
          </aside>
        )}
      </div>
    </div>
  );
}
