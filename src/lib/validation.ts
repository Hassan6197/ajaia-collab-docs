import {
  ALLOWED_UPLOAD_EXTENSIONS,
  MAX_CONTENT_BYTES,
  MAX_UPLOAD_BYTES,
  TITLE_MAX,
  TITLE_MIN,
} from "./constants";
import { isTiptapDoc, type TiptapDoc } from "./tiptap-doc";

export function validateTitle(title: unknown): { ok: true; title: string } | { ok: false; error: string } {
  if (typeof title !== "string") {
    return { ok: false, error: "Title is required." };
  }
  const trimmed = title.trim();
  if (trimmed.length < TITLE_MIN) {
    return { ok: false, error: "Title cannot be empty." };
  }
  if (trimmed.length > TITLE_MAX) {
    return { ok: false, error: `Title must be ${TITLE_MAX} characters or fewer.` };
  }
  return { ok: true, title: trimmed };
}

export function validateContent(content: unknown): { ok: true; content: TiptapDoc } | { ok: false; error: string } {
  if (!isTiptapDoc(content)) {
    return { ok: false, error: "Document content is invalid." };
  }
  const serialized = JSON.stringify(content);
  if (serialized.length > MAX_CONTENT_BYTES) {
    return { ok: false, error: "Document is too large to save." };
  }
  return { ok: true, content };
}

export function validateEmail(email: unknown): { ok: true; email: string } | { ok: false; error: string } {
  if (typeof email !== "string" || !email.trim()) {
    return { ok: false, error: "Email is required." };
  }
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  return { ok: true, email: normalized };
}

export function getUploadExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot < 0) return "";
  return filename.slice(dot).toLowerCase();
}

export function validateUploadFile(
  filename: string,
  byteLength: number,
): { ok: true; extension: string } | { ok: false; error: string } {
  if (!filename.trim()) {
    return { ok: false, error: "Choose a file to upload." };
  }
  const extension = getUploadExtension(filename);
  if (!(ALLOWED_UPLOAD_EXTENSIONS as readonly string[]).includes(extension)) {
    return {
      ok: false,
      error: `Only ${ALLOWED_UPLOAD_EXTENSIONS.join(" and ")} files are supported (max ${MAX_UPLOAD_BYTES / 1024} KB).`,
    };
  }
  if (byteLength <= 0) {
    return { ok: false, error: "The file is empty." };
  }
  if (byteLength > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `File is too large. Maximum size is ${MAX_UPLOAD_BYTES / 1024} KB.`,
    };
  }
  return { ok: true, extension };
}

export function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").trim() || "Imported document";
  return base.slice(0, TITLE_MAX);
}
