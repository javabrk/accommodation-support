# 🚀 Free Deployment Guide — SupportHome

Deploy the full stack for **free** using:

| Service | What | Free tier |
|---------|------|-----------|
| [Neon](https://neon.tech) | PostgreSQL database | 500 MB, serverless |
| [Render](https://render.com) | Node.js backend API | 750 hrs/mo, sleeps after 15 min idle |
| [Vercel](https://vercel.com) | Next.js frontend | Unlimited, custom domain |

> **Total cost: £0/month**

---

## Step 1 — Create the Neon database

1. Go to **[neon.tech](https://neon.tech)** → Sign up (GitHub login works)
2. Click **"New Project"** → give it a name like `supporthome`
3. Choose region **AWS eu-west-2 (London)** → Create
4. In your project dashboard, click **"SQL Editor"**
5. Paste the entire contents of `backend/database/schema.sql` and click **Run**
   - This creates all tables and seeds the super admin account
6. Go to **Connection Details** → copy the **Connection String**
   - It looks like: `postgresql://user:password@ep-xxx.eu-west-2.aws.neon.tech/neondb?sslmode=require`
7. **Save this string** — you'll need it in the next step

---

## Step 2 — Deploy the backend to Render

1. Go to **[render.com](https://render.com)** → Sign up (GitHub login works)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo (push this project to GitHub first if you haven't)
4. Configure:
   - **Name**: `supporthome-api`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Click **"Advanced"** → Add these **Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | *(paste your Neon connection string)* |
   | `JWT_SECRET` | *(click "Generate" — random string)* |
   | `JWT_REFRESH_SECRET` | *(click "Generate" — different random string)* |
   | `JWT_EXPIRES_IN` | `15m` |
   | `JWT_REFRESH_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | *(leave blank for now — fill in after step 3)* |

6. Click **"Create Web Service"** and wait ~3 min for the first deploy
7. Copy your Render URL — it looks like `https://supporthome-api.onrender.com`

> ⚠️ The free Render tier **sleeps after 15 min of inactivity** and takes ~30 s to wake on first request. Upgrade to Starter ($7/mo) to keep it always awake.

---

## Step 3 — Deploy the frontend to Vercel

1. Go to **[vercel.com](https://vercel.com)** → Sign up (GitHub login works)
2. Click **"Add New Project"** → import your GitHub repo
3. Configure:
   - **Framework Preset**: Next.js *(auto-detected)*
   - **Root Directory**: `frontend`
4. Expand **"Environment Variables"** and add:

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://supporthome-api.onrender.com/api` |

5. Click **"Deploy"** — takes ~2 min
6. Copy your Vercel URL — e.g. `https://supporthome.vercel.app`

---

## Step 4 — Connect them together

1. Go back to **Render** → your `supporthome-api` service
2. In **Environment Variables**, update `CLIENT_URL`:
   ```
   CLIENT_URL=https://supporthome.vercel.app
   ```
3. Render will redeploy automatically (~1 min)

---

## Step 5 — Test your live app

1. Visit your Vercel URL (e.g. `https://supporthome.vercel.app`)
2. Log in with the super admin account:
   - **Email**: `admin@accommodation.com`
   - **Password**: `Admin@123`
3. **Change the password immediately** after first login
4. Go to **Admin Team** in the sidebar to create additional admin accounts
5. Share your Vercel URL with tenants — they can self-register at `/register`

---

## Admin & Access Control

### Super Admin (you)
- Created by the database seed — only one exists
- Can **add and deactivate** other admins
- Has access to all features

### Adding a new admin (housing officer)
1. Log in as super admin
2. Go to sidebar → **"👥 Admin Team"**
3. Click **"+ Add Admin"**
4. Enter their name, email and a temporary password
5. Share the credentials with them securely
6. They can log in at `/login`

### Client self-registration
- Tenants visit `/register` on your site
- They fill in: name, email (or phone), password, address
- Account is created with status **"Pending"**
- An admin reviews and activates it from the **Clients** page

---

## Custom Domain (optional, free on Vercel)

1. In Vercel → your project → **Settings → Domains**
2. Add your domain (e.g. `supporthome.co.uk`)
3. Follow the DNS instructions (add a CNAME record at your domain registrar)
4. Update `CLIENT_URL` on Render to match your custom domain

---

## Push to GitHub (prerequisite)

If you haven't pushed this project to GitHub yet:

```bash
cd C:\Users\monab\Projects\accommodation-support
git init
git add .
git commit -m "Initial commit — SupportHome UK"
# Create a repo on github.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/accommodation-support.git
git push -u origin main
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| API returns 503 / timeout | Render is sleeping — wait 30 s and retry |
| CORS error in browser | Make sure `CLIENT_URL` on Render exactly matches your Vercel URL |
| Database connection error | Check `DATABASE_URL` in Render env vars matches Neon connection string |
| Login fails after deploy | Run the schema.sql again in Neon SQL Editor to ensure seed data exists |
| Vercel build error | Check `NEXT_PUBLIC_API_URL` is set correctly in Vercel environment variables |
