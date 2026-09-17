import { EMPTY_DOC, type TiptapDoc } from "./tiptap-doc";

type Mark = { type: string };

type TextNode = {
  type: "text";
  text: string;
  marks?: Mark[];
};

function textNode(text: string, marks?: Mark[]): TextNode {
  return marks?.length ? { type: "text", text, marks } : { type: "text", text };
}

export function parseInlineMarkdown(input: string): TextNode[] {
  const nodes: TextNode[] = [];
  const pattern = /(\*\*[^*]+?\*\*|\*[^*]+?\*|__[^_]+?__|<u>[\s\S]+?<\/u>)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input))) {
    if (match.index > lastIndex) {
      nodes.push(textNode(input.slice(lastIndex, match.index)));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(textNode(token.slice(2, -2), [{ type: "bold" }]));
    } else if (token.startsWith("*")) {
      nodes.push(textNode(token.slice(1, -1), [{ type: "italic" }]));
    } else if (token.startsWith("__")) {
      nodes.push(textNode(token.slice(2, -2), [{ type: "underline" }]));
    } else {
      nodes.push(textNode(token.slice(3, -4), [{ type: "underline" }]));
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < input.length) {
    nodes.push(textNode(input.slice(lastIndex)));
  }

  return nodes.filter((node) => node.text.length > 0);
}

function paragraph(text: string) {
  const content = parseInlineMarkdown(text);
  return content.length ? { type: "paragraph", content } : { type: "paragraph" };
}

function heading(level: 1 | 2 | 3, text: string) {
  const content = parseInlineMarkdown(text);
  return { type: "heading", attrs: { level }, content };
}

function listItem(text: string) {
  return {
    type: "listItem",
    content: [paragraph(text)],
  };
}

export function plainTextToDoc(text: string): TiptapDoc {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\0/g, "");
  const lines = normalized.split("\n");
  const content = lines.map((line) => {
    if (!line) return { type: "paragraph" };
    return { type: "paragraph", content: [textNode(line)] };
  });
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

export function markdownToDoc(markdown: string): TiptapDoc {
  const lines = markdown.replace(/\r\n/g, "\n").replace(/\0/g, "").split("\n");
  const content: unknown[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i += 1;
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(line);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3;
      content.push(heading(level, headingMatch[2]));
      i += 1;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(listItem(lines[i].replace(/^\s*[-*]\s+/, "")));
        i += 1;
      }
      content.push({ type: "bulletList", content: items });
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(listItem(lines[i].replace(/^\s*\d+\.\s+/, "")));
        i += 1;
      }
      content.push({ type: "orderedList", content: items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,3})\s+/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      paragraphLines.push(lines[i]);
      i += 1;
    }
    content.push(paragraph(paragraphLines.join(" ")));
  }

  return {
    type: "doc",
    content: content.length ? content : EMPTY_DOC.content ? [...EMPTY_DOC.content] : [{ type: "paragraph" }],
  };
}

export function fileToDocument(extension: string, text: string): TiptapDoc {
  if (extension === ".md") return markdownToDoc(text);
  return plainTextToDoc(text);
}
