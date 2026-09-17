import { NextResponse } from "next/server";
import { requireUser } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const users = await prisma.user.findMany({
    where: { id: { not: auth.user.id } },
    select: { id: true, email: true, name: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ users });
}
