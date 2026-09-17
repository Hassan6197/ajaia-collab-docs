import { NextResponse } from "next/server";
import { canEdit, canManage, canView, documentRole } from "@/lib/access";
import { jsonError, requireUser } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { parseDocumentContent } from "@/lib/tiptap-doc";
import { validateContent, validateTitle } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

async function loadAccessible(id: string, userId: string) {
  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
  if (!document) return { error: jsonError("Document not found.", 404) } as const;
  const role = documentRole({
    ownerId: document.ownerId,
    userId,
    sharedUserIds: document.shares.map((share) => share.userId),
  });
  if (!canView(role)) return { error: jsonError("You do not have access to this document.", 403) } as const;
  return { document, role };
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const result = await loadAccessible(id, auth.user.id);
  if ("error" in result) return result.error;

  return NextResponse.json({
    document: {
      id: result.document.id,
      title: result.document.title,
      content: parseDocumentContent(result.document.content),
      updatedAt: result.document.updatedAt.toISOString(),
      createdAt: result.document.createdAt.toISOString(),
      owner: result.document.owner,
      role: result.role,
      shares: result.document.shares.map((share) => share.user),
    },
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const result = await loadAccessible(id, auth.user.id);
  if ("error" in result) return result.error;
  if (!canEdit(result.role)) return jsonError("You cannot edit this document.", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be JSON.", 400);
  }

  const record = body as Record<string, unknown>;
  const data: { title?: string; content?: string } = {};

  if ("title" in record) {
    if (!canManage(result.role)) {
      return jsonError("Only the owner can rename this document.", 403);
    }
    const titleResult = validateTitle(record.title);
    if (!titleResult.ok) return jsonError(titleResult.error, 400);
    data.title = titleResult.title;
  }

  if ("content" in record) {
    const contentResult = validateContent(record.content);
    if (!contentResult.ok) return jsonError(contentResult.error, 400);
    data.content = JSON.stringify(contentResult.content);
  }

  if (!Object.keys(data).length) {
    return jsonError("Nothing to update.", 400);
  }

  const updated = await prisma.document.update({
    where: { id },
    data,
    include: { owner: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({
    document: {
      id: updated.id,
      title: updated.title,
      content: parseDocumentContent(updated.content),
      updatedAt: updated.updatedAt.toISOString(),
      owner: updated.owner,
      role: result.role,
    },
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const result = await loadAccessible(id, auth.user.id);
  if ("error" in result) return result.error;
  if (!canManage(result.role)) {
    return jsonError("Only the owner can delete this document.", 403);
  }
  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
