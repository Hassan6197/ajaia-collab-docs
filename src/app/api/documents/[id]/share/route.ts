import { NextResponse } from "next/server";
import { canManage, documentRole } from "@/lib/access";
import { jsonError, requireUser } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { validateEmail } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

async function requireOwner(id: string, userId: string) {
  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      shares: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
  if (!document) return { error: jsonError("Document not found.", 404) } as const;
  const role = documentRole({
    ownerId: document.ownerId,
    userId,
    sharedUserIds: document.shares.map((share) => share.userId),
  });
  if (!canManage(role)) {
    return { error: jsonError("Only the owner can manage sharing.", 403) } as const;
  }
  return { document };
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const result = await requireOwner(id, auth.user.id);
  if ("error" in result) return result.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be JSON.", 400);
  }

  const emailResult = validateEmail((body as Record<string, unknown>).email);
  if (!emailResult.ok) return jsonError(emailResult.error, 400);

  if (emailResult.email === auth.user.email) {
    return jsonError("You already own this document.", 400);
  }

  const target = await prisma.user.findUnique({ where: { email: emailResult.email } });
  if (!target) {
    return jsonError("No user exists with that email. Share with a seeded account.", 404);
  }

  try {
    await prisma.share.create({
      data: { documentId: id, userId: target.id },
    });
  } catch {
    return jsonError("That user already has access.", 409);
  }

  const shares = await prisma.share.findMany({
    where: { documentId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({
    shares: shares.map((share) => share.user),
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const result = await requireOwner(id, auth.user.id);
  if ("error" in result) return result.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be JSON.", 400);
  }

  const emailResult = validateEmail((body as Record<string, unknown>).email);
  if (!emailResult.ok) return jsonError(emailResult.error, 400);

  const target = await prisma.user.findUnique({ where: { email: emailResult.email } });
  if (!target) return jsonError("No user exists with that email.", 404);

  const deleted = await prisma.share.deleteMany({
    where: { documentId: id, userId: target.id },
  });
  if (deleted.count === 0) {
    return jsonError("That user does not have access.", 404);
  }

  const shares = await prisma.share.findMany({
    where: { documentId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ shares: shares.map((share) => share.user) });
}
