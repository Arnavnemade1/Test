// Generates the RSA-2048 keypair used to wrap per-file AES keys (hybrid encryption).
// Run once via `npm run generate:keys`. Safe to re-run only if you intend to rotate keys
// (existing encrypted files would become undecryptable with a new keypair).

import { generateKeyPairSync } from "crypto";
import { existsSync, mkdirSync, writeFileSync, chmodSync } from "fs";
import path from "path";

const keysDir = path.resolve(process.cwd(), "keys");
const publicPath = path.join(keysDir, "rsa_public.pem");
const privatePath = path.join(keysDir, "rsa_private.pem");

if (existsSync(publicPath) && existsSync(privatePath)) {
  console.log("RSA keypair already exists at ./keys — skipping generation.");
  console.log("Delete ./keys/*.pem first if you intentionally want to rotate keys.");
  process.exit(0);
}

mkdirSync(keysDir, { recursive: true });

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

writeFileSync(publicPath, publicKey, { mode: 0o644 });
writeFileSync(privatePath, privateKey, { mode: 0o600 });
chmodSync(privatePath, 0o600);

console.log("Generated RSA-2048 keypair:");
console.log(`  public:  ${publicPath}`);
console.log(`  private: ${privatePath} (chmod 600)`);
console.log("");
console.log("For a Vercel deployment, set these as env vars (Project Settings → Environment");
console.log("Variables) so the deployed app doesn't depend on the gitignored ./keys files:");
console.log("");
console.log(`RSA_PUBLIC_KEY="${publicKey.replace(/\n/g, "\\n")}"`);
console.log(`RSA_PRIVATE_KEY="${privateKey.replace(/\n/g, "\\n")}"`);
