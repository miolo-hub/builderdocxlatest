# Deploying BuilderDocs on Vercel

## 1. Environment variables (required)

In **Vercel → your project → Settings → Environment Variables**, add every variable from `.env.example` / your local `.env.local`:

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes | Neon connection string (use the **pooler** URL, same as local) |
| `R2_ENDPOINT` | Yes | Cloudflare R2 S3 endpoint |
| `R2_ACCESS_KEY_ID` | Yes | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | Yes | R2 secret |
| `R2_BUCKET_NAME` | Yes | e.g. `builder` |
| `SIGNED_URL_SECRET` | Yes | Random string for download links |

Apply to **Production**, **Preview**, and **Development**, then **Redeploy**.

## 2. Seed Neon (one time)

Vercel has no persistent `data/` folder. Customers and portal users must exist in **Neon**.

From your machine (with `.env.local` pointing at the same Neon DB):

```bash
npm run db:push
npm run db:seed-users
npm run db:seed
```

## 3. Demo login on production

| Email | Password |
|-------|----------|
| `docs@prestige.demo` | `docs123` |
| `admin@prestige.demo` | `admin123` |
| `sales@prestige.demo` | `sales123` |

## 4. Verify deployment

Open:

```
https://YOUR-APP.vercel.app/api/health
```

You should see `"ok": true` and `"database": "ok"`. If not, fix the missing env vars and redeploy.

## 5. Limitations on Vercel

- **Audit logs & document metadata** still use `data/store.json`, which does **not** persist on serverless. Uploads to R2 work; customer list and login use Neon.
- For full production, migrate documents/audit to Neon as well.
