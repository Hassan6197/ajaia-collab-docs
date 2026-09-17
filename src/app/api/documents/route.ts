import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { EMPTY_DOC } from "@/lib/tiptap-doc";
import { validateTitle } from "@/lib/validation";

function summarize(doc: {
  id: string;
  title: string;
  updatedAt: Date;
  createdAt: Date;
  owner: { id: string; name: string; email: string };
}) {
  return {
    id: doc.id,
    title: doc.title,
    updatedAt: doc.updatedAt.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    owner: doc.owner,
  };
}

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const [owned, shared] = await Promise.all([
    prisma.document.findMany({
      where: { ownerId: auth.user.id },
      include: { owner: { select: { id: true, name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.document.findMany({
      where: { shares: { some: { userId: auth.user.id } } },
      include: { owner: { select: { id: true, name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    owned: owned.map(summarize),
    shared: shared.map(summarize),
  });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: unknown = {};
  try {
    const text = await request.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    return jsonError("Request body must be JSON.", 400);
  }

  const titleResult = validateTitle((body as Record<string, unknown>).title ?? "Untitled document");
  if (!titleResult.ok) return jsonError(titleResult.error, 400);

  const document = await prisma.document.create({
    data: {
      title: titleResult.title,
      content: JSON.stringify(EMPTY_DOC),
      ownerId: auth.user.id,
    },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ document: summarize(document) }, { status: 201 });
}
