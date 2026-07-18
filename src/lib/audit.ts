import { prisma } from "@/lib/db";

export async function logAudit(params: {
  userId?: string | null;
  action: string;
  detail?: string;
  ip?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        detail: params.detail,
        ip: params.ip ?? null,
      },
    });
  } catch (err) {
    // Audit logging is best-effort: a broken audit write (e.g. a stale session
    // referencing a since-deleted user) must never block the underlying action.
    console.error("logAudit failed", err);
  }
}
