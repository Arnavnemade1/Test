import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { generateAccessToken, hashAccessToken } from "@/lib/tokens";
import { logAudit } from "@/lib/audit";

const schema = z.object({ decision: z.enum(["APPROVE", "DENY"]) });
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7; // token must be redeemed within 7 days

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const request = await prisma.accessRequest.findUnique({ where: { id } });
  if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (request.status !== "PENDING") {
    return NextResponse.json({ error: "This request has already been decided." }, { status: 409 });
  }

  if (parsed.data.decision === "DENY") {
    await prisma.accessRequest.update({
      where: { id },
      data: { status: "DENIED", decidedAt: new Date(), decidedBy: admin.email },
    });
    await logAudit({ userId: admin.sub, action: "ACCESS_REQUEST_DENIED", detail: request.email });
    return NextResponse.json({ ok: true });
  }

  // APPROVE: create (or reuse) the user, mint a single-use access token.
  const user = await prisma.user.upsert({
    where: { email: request.email },
    update: {},
    create: { email: request.email, name: request.name, role: "USER" },
  });

  const rawToken = generateAccessToken();
  const tokenHash = hashAccessToken(rawToken);

  await prisma.$transaction([
    prisma.accessRequest.update({
      where: { id },
      data: { status: "APPROVED", decidedAt: new Date(), decidedBy: admin.email },
    }),
    prisma.accessToken.create({
      data: {
        tokenHash,
        requestId: id,
        userId: user.id,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    }),
  ]);

  await logAudit({ userId: admin.sub, action: "ACCESS_REQUEST_APPROVED", detail: request.email });

  // The raw token is returned exactly once — the server never stores it in plaintext.
  return NextResponse.json({ ok: true, token: rawToken, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) });
}
