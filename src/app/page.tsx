"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { TextField, TextAreaField } from "@/components/Field";

export default function LandingPage() {
  const [form, setForm] = useState({ name: "", email: "", reason: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/access-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  return (
    <main className="relative flex flex-1 flex-col items-center px-6 py-16">
      <nav className="mb-16 flex w-full max-w-5xl items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#7c9dff] to-[#a78bfa]" />
          <span className="text-lg font-semibold tracking-tight">VaultBox</span>
        </div>
        <div className="flex gap-3 text-sm">
          <Link href="/access" className="glass-input rounded-xl px-4 py-2 text-white/80 hover:text-white">
            Redeem token
          </Link>
          <Link href="/admin/login" className="glass-input rounded-xl px-4 py-2 text-white/80 hover:text-white">
            Admin
          </Link>
        </div>
      </nav>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-14 max-w-2xl text-center"
      >
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Your files, sealed under <span className="text-gradient">hybrid RSA + AES encryption</span>
        </h1>
        <p className="mt-5 text-balance text-base text-white/60 sm:text-lg">
          Every upload is encrypted with a unique AES-256 key, which is itself wrapped by
          a 2048-bit RSA key held only on the server. Access is admin-gated — request
          access below and you&apos;ll receive a single-use token once approved.
        </p>
      </motion.div>

      <div className="grid w-full max-w-5xl gap-6 md:grid-cols-[1.1fr_1fr]">
        <GlassCard strong className="p-8">
          <h2 className="mb-1 text-xl font-semibold">Request access</h2>
          <p className="mb-6 text-sm text-white/50">
            An admin reviews every request and issues a one-time access token by hand.
          </p>

          {status === "sent" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-sm text-emerald-200"
            >
              Request submitted. You&apos;ll be given an access token once an admin
              approves it — keep an eye out for it, it can only be redeemed once.
            </motion.div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <TextField
                label="Full name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ada Lovelace"
              />
              <TextField
                label="Email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="ada@example.com"
              />
              <TextAreaField
                label="Reason for access"
                required
                rows={3}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="What will you be storing?"
              />
              {status === "error" && <p className="text-sm text-red-300">{error}</p>}
              <Button type="submit" disabled={status === "loading"} className="w-full">
                {status === "loading" ? "Submitting…" : "Submit request"}
              </Button>
            </form>
          )}
        </GlassCard>

        <div className="flex flex-col gap-6">
          <GlassCard className="p-6">
            <h3 className="mb-2 text-sm font-semibold text-white/80">Envelope encryption</h3>
            <p className="text-sm text-white/50">
              Files are encrypted with AES-256-GCM. The per-file key is wrapped with the
              server&apos;s RSA-2048 public key (RSA-OAEP/SHA-256) so the raw key never
              touches disk in plaintext.
            </p>
          </GlassCard>
          <GlassCard className="p-6">
            <h3 className="mb-2 text-sm font-semibold text-white/80">Admin-gated access</h3>
            <p className="text-sm text-white/50">
              Nothing is self-serve. An admin approves every request and generates a
              single-use access token, redeemable exactly once at{" "}
              <Link href="/access" className="text-white/80 underline underline-offset-2">
                /access
              </Link>
              .
            </p>
          </GlassCard>
          <GlassCard className="p-6">
            <h3 className="mb-2 text-sm font-semibold text-white/80">Full audit trail</h3>
            <p className="text-sm text-white/50">
              Every login, upload, download, and deletion is written to an append-only
              audit log the admin can review at any time.
            </p>
          </GlassCard>
        </div>
      </div>
    </main>
  );
}
