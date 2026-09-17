import { NextResponse } from "next/server";
import { getSession, type SessionUser } from "./session";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireUser(): Promise<
  { ok: true; user: SessionUser } | { ok: false; response: NextResponse }
> {
  const user = await getSession();
  if (!user) {
    return { ok: false, response: jsonError("Sign in to continue.", 401) };
  }
  return { ok: true, user };
}
