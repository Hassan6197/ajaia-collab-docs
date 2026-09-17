export const EMPTY_DOC = {
  type: "doc",
  content: [{ type: "paragraph" }],
} as const;

export type TiptapDoc = {
  type: "doc";
  content?: unknown[];
};

export function isTiptapDoc(value: unknown): value is TiptapDoc {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return record.type === "doc" && (record.content === undefined || Array.isArray(record.content));
}

export function parseDocumentContent(raw: string): TiptapDoc {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (isTiptapDoc(parsed)) return parsed;
  } catch {
    // fall through
  }
  return EMPTY_DOC;
}
