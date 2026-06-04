# BuilderDocs

A two-sided platform for real estate builders to upload and manage customer documents, with on-demand retrieval via a WhatsApp-style bot (simulator included for prototyping).

## What's included

| Deliverable | Route | Description |
|-------------|-------|-------------|
| **A) Builder Admin Portal** | `/portal/login` | Search customers, upload/tag documents, visibility, audit log |
| **B) WhatsApp Simulator** | `/simulator` | Full customer flow with OTP and PDF delivery |
| **C) Architecture diagram** | `/architecture` | ASCII system diagram and component breakdown |
| **D) Working prototype** | `/` | Shared data store — upload in portal, fetch in simulator |

## Deploy on Vercel

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** — you must copy all env vars into Vercel and run `npm run db:seed-users` once against your Neon database.

Check: `https://your-app.vercel.app/api/health` should return `"ok": true`.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@prestige.demo | admin123 |
| Sales | sales@prestige.demo | sales123 |
| Document Manager | docs@prestige.demo | docs123 |

## WhatsApp simulator

1. Open `/simulator`
2. Select **Vikram Patel** (+91 98765 43210)
3. Send **Hi** → **1** → OTP **482916** → **Sale Agreement**

## Features implemented

- Role-based portal login (admin, sales, document manager)
- Customer search by name, phone, unit, tower
- Document upload with types: Sale Agreement, Price Breakup, Allotment Letter, Payment Receipt, NOC, Possession Letter
- Visibility: customer-accessible vs internal-only
- OTP verification before document access
- HMAC signed URLs with expiry for downloads
- Audit trail (uploads, logins, OTP, downloads, notifications)
- WhatsApp notification trigger on upload (logged in audit)

## Storage

| Data | Location |
|------|----------|
| **Customers** | **Neon PostgreSQL** (`DATABASE_URL`) |
| Portal users, documents metadata, audit | `data/store.json` (local JSON) |
| Document files | **Cloudflare R2** (S3-compatible API) |

Setup database: `npm run db:push` then `npm run db:seed`

Configure R2 in `.env.local` (see `.env.example`). R2 bucket name: **`builder`** (`R2_BUCKET_NAME`). Verify with `npm run test:r2`. Restart the dev server after changing env vars.

Uploaded files are stored as: `documents/{builderId}/{customerId}/{timestamp}-{filename}`

## Production roadmap

- Replace `data/store.json` with PostgreSQL + Prisma
- WhatsApp: Meta Cloud API or Twilio webhooks → `POST /api/bot/message`
- SMS/OTP provider for real verification
- Multi-tenant builders with isolated data

## Tech stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- File-based JSON store (prototype)
