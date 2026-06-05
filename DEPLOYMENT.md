# Deploying Vikraya on Vercel

## 1. Environment variables

In [Vercel](https://vercel.com) → your project → **Settings** → **Environment Variables**, add the same keys as `.env.local` (use **Production**, **Preview**, and **Development** as needed):

| Variable | Required for login | Notes |
|----------|-------------------|--------|
| `DATABASE_URL` | Yes | Neon connection string (`?sslmode=require`) |
| `JWT_SECRET` | Yes | Long random string (32+ chars) |
| `SIGNED_URL_SECRET` | Yes for document downloads | Long random string |
| `R2_ENDPOINT` | For uploads | Cloudflare R2 S3 API endpoint |
| `R2_ACCESS_KEY_ID` | For uploads | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | For uploads | R2 secret |
| `R2_BUCKET_NAME` | For uploads | e.g. `builder` |

Copy values from your local `.env.local`. Do not commit `.env.local` to git.

After saving variables, **Redeploy** (Deployments → ⋯ → Redeploy) so the new env is picked up.

## 2. Database schema and seed

Vercel does not run migrations automatically. From your machine (with the same `DATABASE_URL` as production):

```bash
npm run db:push
npm run db:seed-all
```

If you already had portal users without `password_hash`, run once:

```bash
npm run db:migrate-auth
```

## 3. Health check

Open:

```text
https://YOUR-APP.vercel.app/api/health
```

**Healthy response** (`200`, `"ok": true`):

```json
{
  "ok": true,
  "product": "Vikraya",
  "message": "Ready",
  "checks": {
    "database_url": "set",
    "jwt_secret": "set",
    "r2": "set",
    "database": "ok (4 users)"
  }
}
```

**Unhealthy** (`503`, `"ok": false`):

| `checks` field | Fix |
|----------------|-----|
| `database_url`: `missing` | Add `DATABASE_URL` in Vercel, redeploy |
| `jwt_secret`: `missing` | Add `JWT_SECRET`, redeploy |
| `database`: `error: ...` | Wrong URL, Neon paused, or schema not pushed |
| `database` missing / not `ok` | Run `npm run db:push` and `npm run db:seed-all` |

Login only requires `DATABASE_URL` + `JWT_SECRET` + seeded users. R2 is optional for health `ok` today but needed for document uploads.

## 4. Verify login

1. Health returns `"ok": true`.
2. Open `https://YOUR-APP.vercel.app/portal/login`.
3. Use a user from seed (passwords set in `prisma/seed-proptrack.mjs`), e.g. `admin@prestige.demo` / `admin123`.

Portal login page shows the yellow Vercel hint on any `*.vercel.app` host until health passes — that is expected.

## 5. Optional: Vercel CLI

```bash
npx vercel env pull .env.vercel.local
```

Use this to compare local vs deployed env names (not for committing secrets).
