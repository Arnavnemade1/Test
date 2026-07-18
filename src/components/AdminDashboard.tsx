"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { formatBytes, formatDate } from "@/lib/format";

type AccessRequest = {
  id: string;
  name: string;
  email: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "DENIED";
  createdAt: string;
};

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "USER";
  createdAt: string;
  _count: { files: number };
};

type AuditLog = {
  id: string;
  action: string;
  detail: string | null;
  createdAt: string;
  user: { email: string } | null;
};

type Stats = { userCount: number; fileCount: number; pendingCount: number; totalBytes: number };

const TABS = ["Requests", "Users", "Audit Log"] as const;
type Tab = (typeof TABS)[number];

export function AdminDashboard({ adminEmail }: { adminEmail: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Requests");
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [issuedToken, setIssuedToken] = useState<{ email: string; token: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const [reqRes, userRes, logRes, statRes] = await Promise.all([
      fetch("/api/admin/requests"),
      fetch("/api/admin/users"),
      fetch("/api/admin/audit"),
      fetch("/api/admin/stats"),
    ]);
    if (reqRes.ok) setRequests((await reqRes.json()).requests);
    if (userRes.ok) setUsers((await userRes.json()).users);
    if (logRes.ok) setLogs((await logRes.json()).logs);
    if (statRes.ok) setStats(await statRes.json());
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function decide(req: AccessRequest, decision: "APPROVE" | "DENY") {
    setBusyId(req.id);
    try {
      const res = await fetch(`/api/admin/requests/${req.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (decision === "APPROVE") {
        setIssuedToken({ email: req.email, token: data.token });
      }
      await loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update request");
    } finally {
      setBusyId(null);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  const pending = requests.filter((r) => r.status === "PENDING");
  const decided = requests.filter((r) => r.status !== "PENDING");

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-12">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin dashboard</h1>
          <p className="text-sm text-white/50">Signed in as {adminEmail}</p>
        </div>
        <Button variant="ghost" onClick={logout}>
          Sign out
        </Button>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Active users" value={stats?.userCount ?? "—"} />
        <StatCard label="Files stored" value={stats?.fileCount ?? "—"} />
        <StatCard label="Pending requests" value={stats?.pendingCount ?? "—"} />
        <StatCard label="Storage used" value={stats ? formatBytes(stats.totalBytes) : "—"} />
      </div>

      <AnimatePresence>
        {issuedToken && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden"
          >
            <GlassCard strong className="border-emerald-400/30 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-emerald-200">
                    Access token generated for {issuedToken.email}
                  </h3>
                  <p className="mb-3 text-xs text-white/50">
                    Shown once — copy it now and send it to the user. It cannot be
                    retrieved again after you leave this page.
                  </p>
                  <code className="block break-all rounded-lg bg-black/40 px-4 py-3 text-sm text-emerald-200">
                    {issuedToken.token}
                  </code>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => navigator.clipboard.writeText(issuedToken.token)}
                >
                  Copy
                </Button>
              </div>
              <button
                onClick={() => setIssuedToken(null)}
                className="mt-4 text-xs text-white/40 hover:text-white/70"
              >
                Dismiss
              </button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-6 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm transition-colors ${
              tab === t ? "glass-strong text-white" : "text-white/50 hover:text-white/80"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {tab === "Requests" && (
          <motion.div
            key="requests"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <GlassCard className="p-6">
              <h2 className="mb-4 text-sm font-semibold text-white/80">
                Pending ({pending.length})
              </h2>
              {pending.length === 0 && (
                <p className="text-sm text-white/40">No pending requests.</p>
              )}
              <div className="space-y-3">
                {pending.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-col gap-3 rounded-xl border border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {r.name} <span className="text-white/40">— {r.email}</span>
                      </p>
                      <p className="mt-1 text-xs text-white/50">{r.reason}</p>
                      <p className="mt-1 text-[11px] text-white/30">{formatDate(r.createdAt)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        disabled={busyId === r.id}
                        onClick={() => decide(r, "APPROVE")}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        disabled={busyId === r.id}
                        onClick={() => decide(r, "DENY")}
                      >
                        Deny
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h2 className="mb-4 text-sm font-semibold text-white/80">Decided</h2>
              {decided.length === 0 && (
                <p className="text-sm text-white/40">No history yet.</p>
              )}
              <div className="space-y-2">
                {decided.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-xl border border-white/5 px-4 py-3 text-sm"
                  >
                    <span className="text-white/70">
                      {r.name} — {r.email}
                    </span>
                    <span
                      className={
                        r.status === "APPROVED" ? "text-emerald-300" : "text-red-300"
                      }
                    >
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {tab === "Users" && (
          <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GlassCard className="overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-white/40">
                  <tr>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Files</th>
                    <th className="px-6 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-white/5">
                      <td className="px-6 py-3">{u.email}</td>
                      <td className="px-6 py-3 text-white/60">{u.name ?? "—"}</td>
                      <td className="px-6 py-3 text-white/60">{u.role}</td>
                      <td className="px-6 py-3 text-white/60">{u._count.files}</td>
                      <td className="px-6 py-3 text-white/40">{formatDate(u.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          </motion.div>
        )}

        {tab === "Audit Log" && (
          <motion.div key="audit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GlassCard className="max-h-[520px] overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-[#0b0b16]/80 text-xs uppercase tracking-wide text-white/40 backdrop-blur">
                  <tr>
                    <th className="px-6 py-3">Time</th>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Action</th>
                    <th className="px-6 py-3">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-t border-white/5">
                      <td className="px-6 py-3 text-white/40">{formatDate(l.createdAt)}</td>
                      <td className="px-6 py-3 text-white/60">{l.user?.email ?? "—"}</td>
                      <td className="px-6 py-3 font-mono text-xs text-white/80">{l.action}</td>
                      <td className="px-6 py-3 text-white/50">{l.detail ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <GlassCard className="p-5">
      <p className="text-xs uppercase tracking-wide text-white/40">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </GlassCard>
  );
}
