// Hybrid encryption for uploaded files: each file gets a fresh random AES-256-GCM key,
// which is then wrapped (encrypted) with the server's RSA-2048 public key (RSA-OAEP/SHA-256).
// This is the standard "envelope encryption" construction — RSA alone cannot encrypt
// arbitrary-size file data (it's bounded by key size and far too slow for bulk bytes), so
// RSA secures the symmetric key while AES-256-GCM secures the actual file content.
import { readFileSync } from "fs";
import path from "path";
import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  publicEncrypt,
  privateDecrypt,
  constants,
} from "crypto";

const AES_KEY_LENGTH = 32; // 256-bit
const IV_LENGTH = 12; // recommended for GCM

let cachedPublicKey: string | null = null;
let cachedPrivateKey: string | null = null;

function loadPublicKey(): string {
  if (!cachedPublicKey) {
    const p = path.resolve(process.cwd(), process.env.RSA_PUBLIC_KEY_PATH || "./keys/rsa_public.pem");
    cachedPublicKey = readFileSync(p, "utf8");
  }
  return cachedPublicKey;
}

function loadPrivateKey(): string {
  if (!cachedPrivateKey) {
    const p = path.resolve(process.cwd(), process.env.RSA_PRIVATE_KEY_PATH || "./keys/rsa_private.pem");
    cachedPrivateKey = readFileSync(p, "utf8");
  }
  return cachedPrivateKey;
}

export interface EncryptedPayload {
  ciphertext: Buffer;
  iv: string; // base64
  authTag: string; // base64
  encryptedKey: string; // base64, RSA-wrapped AES key
}

export function encryptBuffer(plaintext: Buffer): EncryptedPayload {
  const aesKey = randomBytes(AES_KEY_LENGTH);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv("aes-256-gcm", aesKey, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const encryptedKey = publicEncrypt(
    {
      key: loadPublicKey(),
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    aesKey,
  );

  return {
    ciphertext,
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    encryptedKey: encryptedKey.toString("base64"),
  };
}

export function decryptBuffer(params: {
  ciphertext: Buffer;
  iv: string;
  authTag: string;
  encryptedKey: string;
}): Buffer {
  const aesKey = privateDecrypt(
    {
      key: loadPrivateKey(),
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    Buffer.from(params.encryptedKey, "base64"),
  );

  const decipher = createDecipheriv("aes-256-gcm", aesKey, Buffer.from(params.iv, "base64"));
  decipher.setAuthTag(Buffer.from(params.authTag, "base64"));

  return Buffer.concat([decipher.update(params.ciphertext), decipher.final()]);
}
