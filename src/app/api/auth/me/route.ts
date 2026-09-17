import { NextResponse } from "next/server";
import { requireUser } from "@/lib/http";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  return NextResponse.json({ user: auth.user });
}
