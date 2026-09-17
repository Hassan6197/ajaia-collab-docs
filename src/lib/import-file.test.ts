import { describe, expect, it } from "vitest";
import { fileToDocument, markdownToDoc, parseInlineMarkdown, plainTextToDoc } from "./import-file";

describe("parseInlineMarkdown", () => {
  it("applies bold, italic, and underline marks", () => {
    const nodes = parseInlineMarkdown("Hello **Ada** and *Alan* and __Grace__");
    expect(nodes).toEqual([
      { type: "text", text: "Hello " },
      { type: "text", text: "Ada", marks: [{ type: "bold" }] },
      { type: "text", text: " and " },
      { type: "text", text: "Alan", marks: [{ type: "italic" }] },
      { type: "text", text: " and " },
      { type: "text", text: "Grace", marks: [{ type: "underline" }] },
    ]);
  });
});

describe("markdownToDoc", () => {
  it("turns headings and both list types into TipTap JSON", () => {
    const doc = markdownToDoc(`# Title

Intro **line**.

- alpha
- beta

1. first
2. second
`);
    expect(doc.type).toBe("doc");
    expect(doc.content?.[0]).toMatchObject({ type: "heading", attrs: { level: 1 } });
    expect(doc.content?.[2]).toMatchObject({ type: "bulletList" });
    expect(doc.content?.[3]).toMatchObject({ type: "orderedList" });
    const bullet = doc.content?.[2] as { content: unknown[] };
    expect(bullet.content).toHaveLength(2);
  });
});

describe("plainTextToDoc", () => {
  it("keeps each line as a paragraph so reopening matches the file", () => {
    const doc = plainTextToDoc("one\ntwo\n\nthree");
    expect(doc.content).toHaveLength(4);
    expect(doc.content?.[0]).toMatchObject({
      type: "paragraph",
      content: [{ type: "text", text: "one" }],
    });
  });
});

describe("fileToDocument", () => {
  it("routes .md through the markdown parser", () => {
    const doc = fileToDocument(".md", "## Notes\n\n- item");
    expect(doc.content?.[0]).toMatchObject({ type: "heading", attrs: { level: 2 } });
    expect(doc.content?.[1]).toMatchObject({ type: "bulletList" });
  });
});
