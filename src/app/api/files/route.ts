import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { encryptBuffer } from "@/lib/crypto";
import { putObject } from "@/lib/storage";
import { logAudit } from "@/lib/audit";

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB per file

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const files = await prisma.fileObject.findMany({
    where: { ownerId: session.sub },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      originalName: true,
      mimeType: true,
      size: true,
      isImage: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ files });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!formData || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File exceeds 25MB limit" }, { status: 413 });
  }

  const plaintext = Buffer.from(await file.arrayBuffer());
  const encrypted = encryptBuffer(plaintext);
  const storageUrl = await putObject(encrypted.ciphertext);

  const record = await prisma.fileObject.create({
    data: {
      ownerId: session.sub,
      originalName: file.name.slice(0, 255),
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      storageUrl,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      encryptedKey: encrypted.encryptedKey,
      isImage: file.type.startsWith("image/"),
    },
  });

  await logAudit({
    userId: session.sub,
    action: "FILE_UPLOADED",
    detail: `${record.originalName} (${record.size} bytes)`,
  });

  return NextResponse.json({
    file: {
      id: record.id,
      originalName: record.originalName,
      mimeType: record.mimeType,
      size: record.size,
      isImage: record.isImage,
      createdAt: record.createdAt,
    },
  });
}
