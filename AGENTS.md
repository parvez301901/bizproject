# AGENTS.md — Global Auto-Deploy Instructions

Whenever the user says:
- **"upload"**
- **"deploy"**
- **"publish updates"**
- **"sync live"**

You MUST immediately run the built-in automated deployment script:
```powershell
npm run deploy
```

---

### What `npm run deploy` Automatically Does:
1. **GitHub Sync**: Runs `git add .`, commits any changed files with an auto message, and pushes directly to `origin main` (https://github.com/parvez301901/bizproject).
2. **Render Trigger**: Triggers Render (via git push or webhook) so the backend reloads.
3. **Netlify Frontend Build & Deploy**:
   - Executes `npm run build` in the `client` directory.
   - Converts Windows backslashes into standard web POSIX `/assets/...` paths.
   - Deploys the production build directly to the live Netlify site.
4. **Health Verification**: Verifies the site is alive at:
   - **Frontend**: https://bizproject-80307.netlify.app
   - **Backend**: https://bizproject-api.onrender.com

---

### Credentials & Keys Reference (Pre-Configured)
- **Netlify Site ID**: `07bc42f5-f148-4028-b542-582e6f98e7e4`
- **Netlify Auth Token**: `nfp_f7at6jtVf5emkPUa8WXv8VkxsvqgGMsa5b3e`
- **Neon PostgreSQL**: `postgresql://neondb_owner:npg_sALSrY4bq8Fl@ep-tiny-base-b43gm6rl-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require`
- **Git Repo**: `https://github.com/parvez301901/bizproject`
