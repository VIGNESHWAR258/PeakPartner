# PeakPartner — Deployment Guide

## Architecture

| Component | Local Dev | Production |
|-----------|-----------|------------|
| Frontend  | `localhost:5173` (Vite dev server) | **Vercel** (free) |
| Backend   | `localhost:8080` (Spring Boot) | **Render.com** (free Docker web service) |
| Database  | Local PostgreSQL (`localhost:5432`) | **Supabase** PostgreSQL (free, 500MB) |

---

## 1. Supabase Setup (Production Database)

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up / log in
2. Click **"New Project"**
3. Fill in:
   - **Name**: `peakpartner`
   - **Database Password**: generate a strong password — **save this!**
   - **Region**: choose the closest to your users
4. Wait for the project to finish provisioning (~2 minutes)

### Get Your Credentials

Once the project is ready, go to **Project Settings → Database** and note:

| Setting | Where to find it |
|---------|-----------------|
| **Host** | `db.YOUR_PROJECT_REF.supabase.co` |
| **Port** | `5432` (or `6543` for connection pooling) |
| **Database** | `postgres` |
| **User** | `postgres` |
| **Password** | The one you set during project creation |

For the **JDBC URL**, construct it as:
```
jdbc:postgresql://db.YOUR_PROJECT_REF.supabase.co:5432/postgres
```

Also go to **Project Settings → API** to get:
- **Project URL** → `SUPABASE_URL`
- **anon/public key** → `SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

Go to **Project Settings → API → JWT Settings** to get:
- **JWT Secret** → `SUPABASE_JWT_SECRET`

### Important: Allow External Connections

Go to **Project Settings → Database → Connection Pooling** and ensure:
- Connection pooling is **enabled** (use port `6543` for pooled connections)
- Under **Database Settings**, make sure "Confirm" on the password

> **Tip**: For Render's free tier, use the **direct connection** (port `5432`) since the connection pool size is small anyway. If you see connection issues, switch to the **pooled connection** (port `6543`).

---

## 2. Deploy Backend to Render.com

### Option A: One-Click Blueprint

1. Push your code to GitHub
2. Go to [render.com](https://render.com) and sign up
3. Click **"New" → "Blueprint"**
4. Connect your GitHub repo
5. Render will detect the `render.yaml` file and auto-configure the service
6. Fill in the environment variables when prompted

### Option B: Manual Setup

1. Go to [render.com](https://render.com) and sign up
2. Click **"New" → "Web Service"**
3. Connect your GitHub repo
4. Configure:
   - **Name**: `peakpartner-api`
   - **Region**: Choose closest to your Supabase region
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Docker`
   - **Plan**: `Free`
5. Add these **Environment Variables**:

| Variable | Value |
|----------|-------|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `PORT` | `8080` |
| `DATABASE_URL` | `jdbc:postgresql://db.YOUR_REF.supabase.co:5432/postgres` |
| `DATABASE_USERNAME` | `postgres` |
| `DATABASE_PASSWORD` | Your Supabase DB password |
| `SUPABASE_URL` | `https://YOUR_REF.supabase.co` |
| `SUPABASE_ANON_KEY` | Your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |
| `SUPABASE_JWT_SECRET` | Your JWT secret |
| `JWT_SECRET` | Generate a random 256-bit key: `openssl rand -hex 32` |
| `CORS_ALLOWED_ORIGINS` | `https://your-app.vercel.app` (set after Vercel deploy) |

6. Click **"Create Web Service"**
7. Wait for the build to complete (~5-10 min for first build)
8. Your backend will be available at: `https://peakpartner-api.onrender.com`

> **Note**: Render free tier spins down after 15 min of inactivity. First request after sleep takes ~30-60s. This is normal for free tier.

---

## 3. Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click **"Add New" → "Project"**
3. Import your GitHub repo
4. Configure:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add **Environment Variables**:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://peakpartner-api.onrender.com/api` |
| `VITE_SUPABASE_URL` | `https://YOUR_REF.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

6. Click **"Deploy"**
7. Your frontend will be live at: `https://your-app.vercel.app`

### After Vercel Deploys — Update Render CORS

Go back to **Render Dashboard → peakpartner-api → Environment** and update:
```
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
```
Redeploy the backend service for the change to take effect.

---

## 4. Local Development (Unchanged)

Local development still uses your local PostgreSQL. Nothing changes in your workflow:

```bash
# Terminal 1: Start local PostgreSQL (if using Docker)
docker compose up db

# Terminal 2: Start backend
cd backend
./mvnw spring-boot:run
# or: ./mvnw spring-boot:run -Dspring-boot.run.profiles=local

# Terminal 3: Start frontend
cd frontend
npm run dev
```

The default profile is `local`, so it connects to `localhost:5432` automatically.

---

## 5. Environment Summary

### Local Development
```
Backend:  http://localhost:8080/api
Frontend: http://localhost:5173
Database: postgresql://localhost:5432/peakpartner
Profile:  local (default)
```

### Production
```
Backend:  https://peakpartner-api.onrender.com/api
Frontend: https://your-app.vercel.app
Database: Supabase PostgreSQL
Profile:  prod
```

---

## 6. Flyway Migrations

Flyway runs automatically on startup in both environments. Your existing migrations in `src/main/resources/db/migration/` will be applied to the Supabase database on first deployment.

If you need to run migrations manually against Supabase:
```bash
cd backend
DATABASE_URL=jdbc:postgresql://db.YOUR_REF.supabase.co:5432/postgres \
DATABASE_USERNAME=postgres \
DATABASE_PASSWORD=your-password \
SPRING_PROFILES_ACTIVE=prod \
./mvnw flyway:migrate
```

---

## 7. Troubleshooting

### Backend won't start on Render
- Check **Render Logs** for detailed error output
- Ensure all environment variables are set correctly
- Verify Supabase DB password has no special characters that need URL-encoding

### Database connection issues
- Supabase may require SSL. If you get SSL errors, update `DATABASE_URL` to:
  ```
  jdbc:postgresql://db.YOUR_REF.supabase.co:5432/postgres?sslmode=require
  ```
- Try using the pooled connection (port `6543`) if direct connection times out

### CORS errors in browser
- Ensure `CORS_ALLOWED_ORIGINS` on Render matches your exact Vercel URL (no trailing slash)
- Redeploy the backend after changing CORS config

### Render free tier cold starts
- First request after 15 min of inactivity takes 30-60s
- Consider adding a health check ping via [UptimeRobot](https://uptimerobot.com) (free) to keep it warm

### Vercel build fails
- Ensure `frontend/` is set as the root directory in Vercel settings
- Check that all `VITE_*` env vars are set in Vercel dashboard

---

## 8. Cost Summary

| Service | Plan | Cost | Limits |
|---------|------|------|--------|
| Vercel | Hobby | **Free** | 100GB bandwidth/month |
| Render | Free | **Free** | 750 hours/month, sleeps after 15 min |
| Supabase | Free | **Free** | 500MB DB, 1GB file storage, 50K auth users |

**Total: $0/month** for a fully functional production deployment.
