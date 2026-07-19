# VaultBox

An admin-gated encrypted file/image vault. Next.js (App Router) front-to-back,
Postgres + Vercel Blob for storage, glassmorphism + Framer Motion UI.

## How it works

- **No self-serve accounts.** Visitors submit a "Request Access" form. The single
  admin account reviews requests in `/admin` and approves or denies each one.
- **Single-use access tokens.** Approving a request mints a random token, shown to
  the admin exactly once (only its SHA-256 hash is stored). The admin relays it to
  the user out-of-band. The user redeems it once at `/access`, which starts a
  session cookie — the token itself cannot be reused.
- **Hybrid RSA + AES encryption.** Every uploaded file gets a fresh random
  AES-256-GCM key. That key is wrapped with the server's RSA-2048 public key
  (RSA-OAEP/SHA-256) before being stored — RSA alone can't encrypt arbitrary-size
  file bytes efficiently, so this "envelope encryption" pattern is the standard way
  to combine the two. The RSA private key never leaves the server and only the
  file's owner can trigger a decrypt (not even the admin can read other users'
  file contents).
- **Durable storage for serverless.** Metadata lives in Postgres (Vercel
  Postgres/Neon). Encrypted file blobs go to Vercel Blob when
  `BLOB_READ_WRITE_TOKEN` is set, falling back to a local `./storage/` directory
  otherwise — Vercel functions get an ephemeral, per-invocation filesystem, so
  local disk alone can't survive a real deployment there.
- **Full audit trail.** Every login, request decision, token redemption, upload,
  download, and deletion is recorded and viewable in the admin dashboard.

## Local setup

```bash
npm install
cp .env.example .env
# point POSTGRES_PRISMA_URL / POSTGRES_URL_NON_POOLING at any Postgres instance,
# e.g.: docker run -d -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=vaultbox -p 5432:5432 postgres:16-alpine
# then edit ADMIN_EMAIL / ADMIN_PASSWORD / SESSION_SECRET
npm run setup          # runs migrations, generates the RSA keypair, seeds the admin
npm run dev
```

Then visit `http://localhost:3000`:

- `/` — request access
- `/access` — redeem a token
- `/admin/login` — sign in with the admin credentials from `.env`

Without `BLOB_READ_WRITE_TOKEN` set, uploaded files are written to `./storage/`
locally — no Vercel Blob account needed for local dev.

## Deploying to Vercel

1. Add the **Vercel Postgres** (Neon) integration to the project — this
   auto-populates `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING`.
2. Create a **Blob store** (Project Settings → Storage) — this auto-populates
   `BLOB_READ_WRITE_TOKEN`.
3. Run `npm run generate:keys` locally and copy the printed `RSA_PUBLIC_KEY` /
   `RSA_PRIVATE_KEY` values into the project's environment variables (the
   `./keys` directory is gitignored and never reaches the deployment).
4. Set `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` as env vars too.
5. Run migrations against the new database once:
   `npx prisma migrate deploy` (with `POSTGRES_PRISMA_URL` /
   `POSTGRES_URL_NON_POOLING` in your shell env, e.g. via `vercel env pull .env`),
   then `npm run seed:admin` the same way.
6. Deploy. `vercel.json` pins the framework to Next.js.

## Notable env vars (see `.env.example`)

- `POSTGRES_PRISMA_URL` / `POSTGRES_URL_NON_POOLING` — pooled/direct Postgres
  connections (Prisma needs both: pooled for queries, direct for migrations).
- `SESSION_SECRET` — signs session cookies (HS256 JWT). Use a long random value.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — seeded once by `npm run seed:admin`.
- `RSA_PUBLIC_KEY` / `RSA_PRIVATE_KEY` (or the `_PATH` variants for local files) —
  the hybrid-encryption keypair, from `npm run generate:keys`.
- `BLOB_READ_WRITE_TOKEN` — enables Vercel Blob storage; omit it locally to use
  `STORAGE_DIR` instead.

`keys/` and `storage/` are gitignored — they're local secrets and data, never
commit them.

## Stack

Next.js 16 (App Router, TypeScript) · Prisma + Postgres · Vercel Blob ·
Tailwind CSS · Framer Motion · Node `crypto` (RSA-OAEP + AES-256-GCM) ·
`jose` (JWT sessions) · `bcryptjs` (admin password hashing)
