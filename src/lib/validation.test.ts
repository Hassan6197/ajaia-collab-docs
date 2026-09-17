import { describe, expect, it } from "vitest";
import { titleFromFilename, validateTitle, validateUploadFile } from "./validation";

describe("validateTitle", () => {
  it("rejects blank titles", () => {
    expect(validateTitle("   ")).toEqual({ ok: false, error: "Title cannot be empty." });
  });

  it("trims a valid title", () => {
    expect(validateTitle("  Brief  ")).toEqual({ ok: true, title: "Brief" });
  });
});

describe("validateUploadFile", () => {
  it("rejects unsupported types with a clear message", () => {
    const result = validateUploadFile("notes.docx", 100);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/\.txt and \.md/);
    }
  });

  it("rejects oversized files", () => {
    const result = validateUploadFile("notes.md", 300_000);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/too large/i);
    }
  });

  it("accepts a small markdown file", () => {
    expect(validateUploadFile("notes.md", 120)).toEqual({ ok: true, extension: ".md" });
  });
});

describe("titleFromFilename", () => {
  it("strips the extension and respects the title max", () => {
    expect(titleFromFilename("quarterly-plan.md")).toBe("quarterly-plan");
  });
});
