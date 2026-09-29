# 🚀 Free Deployment Guide (Vercel + Render + Neon.tech)

This guide shows you how to host Apex Board for **$0 / month** with continuous automatic deployment on every `git push`.

---

## Architecture Overview
- **Database**: [Neon.tech](https://neon.tech) (Free Serverless PostgreSQL, 500 MB permanent cloud storage)
- **Backend**: [Render.com](https://render.com) (Free Node.js Web Service)
- **Frontend**: [Vercel.com](https://vercel.com) (Free React/Vite Global CDN with Custom Domain & SSL)

---

## Step 1: Create a Free PostgreSQL Database on Neon.tech (2 Minutes)
1. Go to [neon.tech](https://neon.tech) and click **Sign Up** (Login with your GitHub account).
2. Click **Create Project**. Name it `apexboard` (leave Postgres version on 16 or 17).
3. On the dashboard, copy the **Connection string** (it looks like this):
   ```
   postgresql://neondb_owner:npg_XXXXX@ep-cool-sample.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   *(Keep this string handy for Step 3).*

---

## Step 2: Push Your Project Code to GitHub
Open PowerShell in `F:\antigravity\bizproject`:

```powershell
git init
git add .
git commit -m "Deploy Apex Board to Cloud"
git branch -M main
```

Create a new repository on [github.com/new](https://github.com/new) (e.g. `bizproject`), then link and push:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/bizproject.git
git push -u origin main
```

---

## Step 3: Deploy the Backend on Render.com (Free)
1. Go to [render.com](https://render.com) and click **Sign Up** (with GitHub).
2. Click **New +** $\rightarrow$ **Web Service**.
3. Select your `bizproject` repository from GitHub.
4. Fill in the service settings:
   - **Name**: `bizproject-api` (or any name you like)
   - **Region**: Choose one closest to you (e.g. Singapore or Frankfurt)
   - **Branch**: `main`
   - **Root Directory**: *(leave blank)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server/index.js`
   - **Instance Type**: **Free** ($0 / month)
5. Scroll down to **Environment Variables** and click **Add Environment Variable**:
   - `DATABASE_URL` = Paste your connection string from Neon.tech (Step 1).
   - `JWT_SECRET` = `apexboard_super_secret_jwt_key_2026`
   - `NODE_ENV` = `production`
6. Click **Deploy Web Service**.
7. Once deployed (after 1-2 minutes), Render will give you your public live URL, for example:
   ```
   https://bizproject-api.onrender.com
   ```
   *(Test it in your browser: `https://bizproject-api.onrender.com/api/health` should return `{"status":"ok"}`).*

---

## Step 4: Deploy the Frontend on Vercel (Free)
1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **Add New...** $\rightarrow$ **Project**.
3. Import your `bizproject` GitHub repository.
4. In the Project Setup:
   - **Root Directory**: Click `Edit` and select `client`.
   - **Framework Preset**: Vite (detected automatically).
   - Expand **Environment Variables** and add:
     - **Key**: `VITE_API_URL`
     - **Value**: Your Render live URL from Step 3 (e.g. `https://bizproject-api.onrender.com`)
5. Click **Deploy**.

---

## 🎉 You're Live!
Vercel will give you a live production URL like `https://bizproject.vercel.app`.
- Free SSL certificate included.
- You can add your own custom domain (e.g. `app.yourcompany.com`) directly in Vercel settings for free!
- Whenever you make changes locally and run `git push`, both Vercel and Render will auto-build and deploy your updates in under 60 seconds!
