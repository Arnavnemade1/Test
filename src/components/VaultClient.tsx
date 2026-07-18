"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { formatBytes, formatDate } from "@/lib/format";

type VaultFile = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  isImage: boolean;
  createdAt: string;
};

export function VaultClient({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    const res = await fetch("/api/files");
    if (res.ok) setFiles((await res.json()).files);
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  async function uploadFile(file: globalThis.File) {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/files", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    for (const file of Array.from(fileList)) {
      await uploadFile(file);
    }
  }

  async function deleteFile(id: string) {
    const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
    if (res.ok) setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function downloadFile(f: VaultFile) {
    const res = await fetch(`/api/files/${f.id}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = f.originalName;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/access");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-12">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your vault</h1>
          <p className="text-sm text-white/50">Signed in as {userEmail}</p>
        </div>
        <Button variant="ghost" onClick={logout}>
          Sign out
        </Button>
      </header>

      <GlassCard
        strong
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`mb-8 flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed p-12 text-center transition-colors ${
          dragActive ? "border-[#a78bfa]/60 bg-white/[0.08]" : "border-white/15"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="text-sm font-medium text-white/80">
          {uploading ? "Encrypting & uploading…" : "Drop files here, or click to browse"}
        </p>
        <p className="text-xs text-white/40">
          Encrypted with AES-256-GCM, key wrapped via RSA-2048 · 25MB max per file
        </p>
        {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
      </GlassCard>

      {files.length === 0 ? (
        <p className="text-center text-sm text-white/40">No files yet — upload your first one above.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence>
            {files.map((f) => (
              <FileCard key={f.id} file={f} onDelete={deleteFile} onDownload={downloadFile} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </main>
  );
}

function FileCard({
  file,
  onDelete,
  onDownload,
}: {
  file: VaultFile;
  onDelete: (id: string) => void;
  onDownload: (f: VaultFile) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!file.isImage) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    fetch(`/api/files/${file.id}`)
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (!blob || cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file.id, file.isImage]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <GlassCard className="group overflow-hidden p-0">
        <div className="flex aspect-square items-center justify-center bg-black/20">
          {file.isImage ? (
            previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt={file.originalName} className="h-full w-full object-cover" />
            ) : (
              <div className="h-6 w-6 animate-pulse rounded-full bg-white/20" />
            )
          ) : (
            <span className="text-3xl">📄</span>
          )}
        </div>
        <div className="p-3">
          <p className="truncate text-xs font-medium text-white/90" title={file.originalName}>
            {file.originalName}
          </p>
          <p className="mt-0.5 text-[11px] text-white/40">
            {formatBytes(file.size)} · {formatDate(file.createdAt)}
          </p>
          <AnimatePresence>
            {confirming ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-3 flex gap-2"
              >
                <button
                  onClick={() => {
                    onDelete(file.id);
                    setConfirming(false);
                  }}
                  className="flex-1 rounded-lg bg-red-500/25 py-1.5 text-[11px] text-red-100 hover:bg-red-500/35"
                >
                  Confirm delete
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] text-white/70 hover:bg-white/20"
                >
                  Cancel
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-3 flex gap-2"
              >
                <button
                  onClick={() => onDownload(file)}
                  className="flex-1 rounded-lg bg-white/10 py-1.5 text-[11px] text-white/80 hover:bg-white/20"
                >
                  Download
                </button>
                <button
                  onClick={() => setConfirming(true)}
                  className="rounded-lg bg-red-500/15 px-2.5 py-1.5 text-[11px] text-red-200 hover:bg-red-500/25"
                >
                  Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassCard>
    </motion.div>
  );
}
