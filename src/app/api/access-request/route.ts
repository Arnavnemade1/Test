import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  reason: z.string().trim().min(1).max(1000),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { name, email, reason } = parsed.data;

  const existingPending = await prisma.accessRequest.findFirst({
    where: { email, status: "PENDING" },
  });
  if (existingPending) {
    return NextResponse.json(
      { error: "A request for this email is already pending review." },
      { status: 409 },
    );
  }

  await prisma.accessRequest.create({ data: { name, email, reason } });
  await logAudit({
    action: "ACCESS_REQUEST_CREATED",
    detail: email,
    ip: req.headers.get("x-forwarded-for"),
  });

  return NextResponse.json({ ok: true });
}
