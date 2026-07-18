import { getSession } from "@/lib/auth";
import { AdminDashboard } from "@/components/AdminDashboard";

export default async function AdminPage() {
  const session = await getSession();
  return <AdminDashboard adminEmail={session?.email ?? ""} />;
}
