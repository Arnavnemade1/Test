import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requests = await prisma.accessRequest.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests });
}
