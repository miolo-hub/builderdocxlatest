# PropTrack CRM

Real estate marketing CRM — inventory, clients, payments, documents, WhatsApp automation, and agent commissions.

Built on the **PRD-recommended stack**:

| Layer | Technology |
|-------|------------|
| Frontend | **React** (Next.js 16) + **Tailwind CSS** |
| Backend | **Node.js** REST API (Next.js Route Handlers) |
| Database | **PostgreSQL** (Neon) + **Prisma** |
| Auth | **JWT** (jose) + **bcrypt** + **RBAC** |
| Files | **Cloudflare R2** (S3-compatible) |
| WhatsApp | Bot engine (simulator → Meta BSP ready) |

## Modules

- **Projects & inventory** — units, status grid, construction %
- **Clients** — 360° profile, stages, timeline
- **Deals & payments** — schedules, record payments, overdue list
- **Documents** — R2 vault, WhatsApp delivery
- **Agents & commissions** — per-deal commission records
- **Dashboard** — revenue, overdue, agent leaderboard
- **WhatsApp simulator** — OTP, payments, documents, construction updates

## Quick start

```bash
npm install
cp .env.example .env.local   # fill DATABASE_URL, R2, JWT_SECRET
npm run db:push
npm run db:seed-all
npm run dev
```

Open http://localhost:3000/portal/login

## Demo logins

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@prestige.demo | admin123 |
| Sales Agent | sales@prestige.demo | sales123 |
| Accounts | accounts@prestige.demo | accounts123 |
| Documents | docs@prestige.demo | docs123 |

## Vercel deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md). Required env: `DATABASE_URL`, `JWT_SECRET`, R2 vars, `SIGNED_URL_SECRET`.

Health check: `/api/health`

## Roadmap (from PRD)

- Phase 2: Meta WhatsApp BSP webhooks, EOD reports, PDF receipts
- Phase 3: Broadcast, escalation rules, scheduled reports
- Phase 4: Visual floor map, accounting integrations
