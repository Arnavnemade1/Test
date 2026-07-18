// Access tokens are shown to the admin exactly once at approval time. We only ever
// persist a SHA-256 hash of the token — like a password — so a database leak alone
// cannot be used to impersonate an approved user.
import { randomBytes, createHash } from "crypto";

export function generateAccessToken(): string {
  // 32 bytes -> 43-char base64url token
  return randomBytes(32).toString("base64url");
}

export function hashAccessToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
