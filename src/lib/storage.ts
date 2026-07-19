// Storage backend for encrypted file blobs.
//
// In production (Vercel) this uses Vercel Blob, since serverless functions get an
// ephemeral, per-invocation filesystem — anything written to local disk vanishes
// between requests. Locally, without BLOB_READ_WRITE_TOKEN set, it falls back to
// writing under ./storage/ so the app is easy to run and test without cloud
// credentials. The blobs are already AES-encrypted ciphertext by the time they
// reach this module, so "public" Vercel Blob access (an unguessable URL) doesn't
// expose plaintext — only the owning user's session can ever trigger a decrypt.
import { randomUUID } from "crypto";
import path from "path";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import { put, del } from "@vercel/blob";

const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

function localDir() {
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.STORAGE_DIR || "./storage");
}

/** Stores ciphertext and returns an opaque locator to save as `storageUrl`. */
export async function putObject(ciphertext: Buffer): Promise<string> {
  const key = `${randomUUID()}.enc`;

  if (useBlob) {
    const blob = await put(key, ciphertext, {
      access: "public",
      contentType: "application/octet-stream",
      addRandomSuffix: true,
    });
    return blob.url;
  }

  const dir = localDir();
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, key);
  await writeFile(filePath, ciphertext);
  return filePath;
}

export async function getObject(locator: string): Promise<Buffer> {
  if (useBlob) {
    const res = await fetch(locator);
    if (!res.ok) throw new Error(`Failed to fetch blob: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }

  return readFile(locator);
}

export async function deleteObject(locator: string): Promise<void> {
  if (useBlob) {
    await del(locator).catch(() => {});
    return;
  }

  await unlink(locator).catch(() => {});
}
