# Deployment Guide - 100% Free Hosting Stack (Option 1)

This project consists of two parts:
1. **Frontend**: Vite + React client (`client/`)
2. **Backend**: Express.js REST API (`server/`)
3. **Database**: PostgreSQL (Supabase or Neon) or persistent volume

---

## Architecture Overview
```
[ User Browser ]
       |
       +---> [ Vercel / Cloudflare Pages ] (Frontend CDN - $0/mo)
                    |
                    | (API Calls via VITE_API_URL)
                    v
             [ Render.com / Koyeb ] (Express API - $0/mo)
                    |
                    v
             [ Supabase / Neon.tech ] (Cloud PostgreSQL - $0/mo)
```

---

## What You Need Before You Start
1. **GitHub Account**: To host your repository (free at [github.com](https://github.com)).
2. **Supabase Account** (or Neon.tech): Free cloud PostgreSQL ([supabase.com](https://supabase.com)).
3. **Render.com Account**: Free Node.js backend hosting ([render.com](https://render.com)).
4. **Vercel Account**: Free frontend hosting ([vercel.com](https://vercel.com)).

---

## Step 1: Set Up Free Cloud PostgreSQL (Supabase)
1. Go to [supabase.com](https://supabase.com) and click **"New Project"**.
2. Give your project a name (e.g., `bizproject-db`) and enter a strong database password (keep this safe!).
3. Choose the region closest to you.
4. Once created, go to **Project Settings** -> **Database**.
5. Scroll down to **Connection String** -> select **URI** (or **NodeJS / Connection Pooling**).
6. Copy the connection string. It will look like:
   ```
   postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require
   ```
   *(Replace `[password]` with the actual password you set).*

---

## Step 2: Push Project to GitHub
Open your terminal in the project root (`f:\antigravity\bizproject`):
```bash
git init
git add .
git commit -m "Initial commit for production deployment"
```
Create a new private/public repository on GitHub, then link and push:
```bash
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

---

## Step 3: Deploy Backend on Render.com
1. Go to [dashboard.render.com](https://dashboard.render.com) and click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the settings:
   - **Name**: `bizproject-api`
   - **Root Directory**: `.` (leave empty or set to root)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server/index.js`
   - **Instance Type**: **Free**
4. Under **Environment Variables**, add:
   - `DATABASE_URL`: *(Your Supabase connection string from Step 1)*
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: *(Generate any secure random string)*
5. Click **Create Web Service**.
6. When deployment finishes, copy your live backend URL (e.g., `https://bizproject-api.onrender.com`).

---

## Step 4: Deploy Frontend on Vercel
1. Go to [vercel.com](https://vercel.com) and click **Add New...** -> **Project**.
2. Import your GitHub repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click "Edit" and choose `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and add:
   - `VITE_API_URL`: `https://bizproject-api.onrender.com` *(Your Render backend URL from Step 3 without trailing slash)*
5. Click **Deploy**.
6. In ~60 seconds, Vercel gives you your production website URL (e.g., `https://bizproject.vercel.app`)!
