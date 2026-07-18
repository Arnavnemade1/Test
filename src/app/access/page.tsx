"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { TextField } from "@/components/Field";

export default function AccessPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/access/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid token");
      router.push("/vault");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid token");
      setStatus("error");
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <GlassCard strong className="w-full max-w-md p-8">
        <h1 className="mb-1 text-xl font-semibold">Redeem access token</h1>
        <p className="mb-6 text-sm text-white/50">
          Paste the single-use token your admin gave you. It works exactly once.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <TextField
            label="Access token"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="e.g. 8f3c9d2a-…"
            autoFocus
          />
          {status === "error" && <p className="text-sm text-red-300">{error}</p>}
          <Button type="submit" disabled={status === "loading"} className="w-full">
            {status === "loading" ? "Verifying…" : "Enter vault"}
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-white/40">
          Don&apos;t have a token yet?{" "}
          <Link href="/" className="text-white/70 underline underline-offset-2">
            Request access
          </Link>
        </p>
      </GlassCard>
    </main>
  );
}
