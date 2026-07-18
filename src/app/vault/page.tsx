import { getSession } from "@/lib/auth";
import { VaultClient } from "@/components/VaultClient";

export default async function VaultPage() {
  const session = await getSession();
  return <VaultClient userEmail={session?.email ?? ""} />;
}
