import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";
import { jsonError } from "@/lib/http";
import { validateEmail } from "@/lib/validation";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be JSON.", 400);
  }

  const record = body as Record<string, unknown>;
  const emailResult = validateEmail(record.email);
  if (!emailResult.ok) return jsonError(emailResult.error, 400);

  const password = typeof record.password === "string" ? record.password : "";
  if (!password) return jsonError("Password is required.", 400);

  const user = await prisma.user.findUnique({ where: { email: emailResult.email } });
  if (!user) return jsonError("Email or password is incorrect.", 401);

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) return jsonError("Email or password is incorrect.", 401);

  await setSessionCookie({ id: user.id, email: user.email, name: user.name });
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
}
