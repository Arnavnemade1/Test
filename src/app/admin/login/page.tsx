"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { TextField } from "@/components/Field";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid credentials");
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
      setStatus("error");
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <GlassCard strong className="w-full max-w-md p-8">
        <h1 className="mb-1 text-xl font-semibold">Admin sign in</h1>
        <p className="mb-6 text-sm text-white/50">
          Manage access requests, users, and the audit log.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <TextField
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoFocus
          />
          <TextField
            label="Password"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {status === "error" && <p className="text-sm text-red-300">{error}</p>}
          <Button type="submit" disabled={status === "loading"} className="w-full">
            {status === "loading" ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </GlassCard>
    </main>
  );
}
