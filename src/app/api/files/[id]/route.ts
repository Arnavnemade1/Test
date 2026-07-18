import { NextRequest, NextResponse } from "next/server";
import { readFile, unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { decryptBuffer } from "@/lib/crypto";
import { logAudit } from "@/lib/audit";

function storageDir() {
  return path.resolve(process.cwd(), process.env.STORAGE_DIR || "./storage");
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const record = await prisma.fileObject.findUnique({ where: { id } });

  // Files are only ever decryptable by their owner — not even the admin session can
  // read another user's content, which keeps a single compromised account from
  // exposing every user's uploads.
  if (!record || record.ownerId !== session.sub) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ciphertext = await readFile(path.join(storageDir(), record.storagePath));
  const plaintext = decryptBuffer({
    ciphertext,
    iv: record.iv,
    authTag: record.authTag,
    encryptedKey: record.encryptedKey,
  });

  await logAudit({ userId: session.sub, action: "FILE_DOWNLOADED", detail: record.originalName });

  return new NextResponse(new Uint8Array(plaintext), {
    headers: {
      "Content-Type": record.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(record.originalName)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const record = await prisma.fileObject.findUnique({ where: { id } });
  if (!record || record.ownerId !== session.sub) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await unlink(path.join(storageDir(), record.storagePath)).catch(() => {});
  await prisma.fileObject.delete({ where: { id } });
  await logAudit({ userId: session.sub, action: "FILE_DELETED", detail: record.originalName });

  return NextResponse.json({ ok: true });
}
