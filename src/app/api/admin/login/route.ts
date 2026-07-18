import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.role !== "ADMIN" || !user.passwordHash) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    await logAudit({ action: "ADMIN_LOGIN_FAILED", detail: email, ip: req.headers.get("x-forwarded-for") });
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  await createSession({ sub: user.id, role: user.role, email: user.email });
  await logAudit({ userId: user.id, action: "ADMIN_LOGIN", ip: req.headers.get("x-forwarded-for") });

  return NextResponse.json({ ok: true });
}
