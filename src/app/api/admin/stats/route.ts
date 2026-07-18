import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [userCount, fileCount, pendingCount, sizeAgg] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.fileObject.count(),
    prisma.accessRequest.count({ where: { status: "PENDING" } }),
    prisma.fileObject.aggregate({ _sum: { size: true } }),
  ]);

  return NextResponse.json({
    userCount,
    fileCount,
    pendingCount,
    totalBytes: sizeAgg._sum.size ?? 0,
  });
}
