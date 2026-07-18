import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashAccessToken } from "@/lib/tokens";
import { createSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const schema = z.object({ token: z.string().trim().min(10).max(200) });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const tokenHash = hashAccessToken(parsed.data.token);
  const record = await prisma.accessToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.used || record.expiresAt < new Date() || !record.user) {
    return NextResponse.json({ error: "This access token is invalid, expired, or already used." }, { status: 401 });
  }

  await prisma.accessToken.update({
    where: { id: record.id },
    data: { used: true, usedAt: new Date() },
  });

  await createSession({ sub: record.user.id, role: record.user.role, email: record.user.email });
  await logAudit({
    userId: record.user.id,
    action: "TOKEN_REDEEMED",
    ip: req.headers.get("x-forwarded-for"),
  });

  return NextResponse.json({ ok: true });
}
