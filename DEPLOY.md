# Deploying Callyzer Clone to the Internet

Goal: get the dashboard live on a public URL like `https://callyzer-yourname.vercel.app`, with a real Postgres database, so your sales reps' phones can sync from anywhere.

You'll create three free accounts (~5 minutes each), push the code once, and after that updates deploy automatically.

**Cost:** $0/month, forever, on the free tiers below — for a team of 6–20 reps you'll never come close to the limits.

---

## What you'll set up

- **GitHub** — stores the code (free).
- **Neon** — Postgres database, free tier (free, 0.5 GB storage).
- **Vercel** — hosts the Next.js dashboard, free hobby plan (free, always-on).

You'll do most of this in the browser, no terminal commands.

---

## Step 1 — Create the three accounts

If you already have a GitHub account, skip to Vercel.

1. **GitHub** → https://github.com/signup. Pick a username, email, password. Verify email.
2. **Vercel** → https://vercel.com/signup → click **Continue with GitHub**. Approve access.
3. **Neon** → https://console.neon.tech/signup → click **Continue with GitHub**. Approve access.

You should now be logged into all three with the same GitHub account.

---

## Step 2 — Create your Postgres database on Neon

1. After signing in to Neon you land on the **Create your first project** screen.
2. **Project name:** `callyzer-clone`. **Postgres version:** leave default. **Region:** pick the one closest to where your sales reps are.
3. Click **Create project**.
4. Neon shows a **Connection string** box at the top of the dashboard. There are two kinds — you want the **Pooled connection** (it has `-pooler` in the hostname). Copy it. It looks like:
   ```
   postgresql://callyzer_owner:abc123…@ep-xxxx-pooler.eu-central-1.aws.neon.tech/callyzer?sslmode=require
   ```
5. Paste it somewhere safe (Notepad is fine) — you'll use it twice.

---

## Step 3 — Push the code to GitHub

The easiest way is **GitHub Desktop** — no command line.

1. Install GitHub Desktop from https://desktop.github.com → run installer → sign in with your GitHub account.
2. In GitHub Desktop: **File → Add local repository** → browse to the `callyzer-clone` folder in your Documents (the one with `web/`, `android/`, and the `.bat` launchers in it).
3. It'll say "this directory does not appear to be a Git repository — create one." Click **create a repository**. Name: `callyzer-clone`. Click **Create Repository**.
4. Click **Publish repository** at the top right. Uncheck "Keep this code private" if you don't mind — or leave it private; both work. Click **Publish Repository**.
5. Done — your code is now at `https://github.com/yourusername/callyzer-clone`.

---

## Step 4 — Deploy to Vercel

1. Go to https://vercel.com/new.
2. Under **Import Git Repository**, find `callyzer-clone` and click **Import**.
3. Vercel auto-detects it's a Next.js project. Most fields are fine. Two things to change:
   - **Root Directory** → click **Edit** → set to `web` → **Continue**.
4. Expand **Environment Variables** and add three rows:

   | Name             | Value                                    |
   |------------------|------------------------------------------|
   | `DATABASE_URL`   | the Neon **pooled** connection string from Step 2 |
   | `ADMIN_EMAIL`    | the email you'll use to log in (yours)   |
   | `ADMIN_PASSWORD` | a strong password (12+ characters)       |

5. Click **Deploy**. Wait ~2 minutes. When it finishes you'll see fireworks and a preview screenshot. Click **Continue to Dashboard**.
6. Your URL is on the right — something like `https://callyzer-clone-yourname.vercel.app`. **Copy this URL** — you'll need it for the phones.

---

## Step 5 — Initialize the database

The Vercel deploy is up but the database is still empty (no tables, no admin user). We'll fix that with one click.

1. From your Vercel project page → **Storage** tab → **Create Database** would normally be here, but skip that — we're using Neon.
2. Instead go to **Deployments** tab → click your most recent deployment → **... menu (three dots)** → **Redeploy**, then **Redeploy** again to confirm. (This skip is fine; we'll initialize via a different route below.)

Actually, the cleanest way to initialize on free tier is from your laptop, just once. It takes 60 seconds:

1. Open `Fix OneDrive and run.bat` once if you haven't recently — it makes sure dependencies are installed.
2. Open File Explorer → `C:\Users\<you>\AppData\Local\callyzer-clone\web`.
3. Click the address bar, type `powershell`, press Enter.
4. In PowerShell, run these three commands one after the other (replace the `...` with your real Neon URL and admin info):

   ```powershell
   $env:DATABASE_URL  = "postgresql://...neon.tech/callyzer?sslmode=require"
   $env:ADMIN_EMAIL    = "you@example.com"
   $env:ADMIN_PASSWORD = "your-strong-password"
   npm run db:push
   npm run db:seed
   ```

5. The first command creates the tables (`users`, `teams`, `calls`, `sessions`). The second creates your admin login.

You can close PowerShell now.

---

## Step 6 — Sign in and add your reps

1. Open your Vercel URL — `https://callyzer-clone-yourname.vercel.app`.
2. Log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
3. Go to **Employees** → **Add employee**. For each rep:
   - Enter name, email (any email — they don't get an email, you'll share the password manually), phone (optional), role (`Employee` for reps), team.
   - The form auto-generates a random 12-character password. **Copy it before clicking Create** — you'll send it to the rep.
4. Repeat for each of your 6–20 reps.

---

## Step 7 — Get the Android app on each rep's phone

1. Build the APK once on your laptop using **Build Android APK.bat** (in your Documents folder). This creates `apk\callyzer-clone.apk`.
2. Send the same `.apk` file to every rep — email, Google Drive, WhatsApp, whatever. Each rep installs it once (see `Install APK on phone.txt` for the install steps).
3. On the rep's phone, when the app opens:
   - **API URL:** your Vercel URL, e.g. `https://callyzer-clone-yourname.vercel.app`
   - **Email:** the email you created for them
   - **Password:** the password you generated for them
4. Tap **Sign in** → **Grant permission** for call log access → **Sync now**.
5. Within seconds you'll see their calls appear in your dashboard at `https://callyzer-clone-yourname.vercel.app/call-logs`.

After that the app syncs every 30 minutes in the background, regardless of which Wi-Fi the rep is on (cellular works too).

---

## Updating the app later

Any code changes you make locally — push them with GitHub Desktop:

1. GitHub Desktop → see your changed files in the left panel.
2. Type a summary at the bottom (e.g., "Added missed-call alerts") → **Commit to main**.
3. Click **Push origin** at the top.

Vercel automatically picks up the push and redeploys in ~2 minutes. No action needed from your reps — their phones keep syncing to the same URL.

---

## Free tier limits — what to watch for

- **Vercel hobby:** 100 GB bandwidth/month, unlimited requests for personal use. A 20-rep team won't get close.
- **Neon free:** 0.5 GB storage, 191 compute hours/month with auto-suspend. With ~600 calls/rep/month that's roughly 5 years of data before you hit the storage cap.
- **GitHub free:** unlimited public + private repos.

If you ever exceed limits, all three services notify you and you can upgrade in a click ($5–10/month each at the next tier).

---

## Troubleshooting

**The deploy fails with "DATABASE_URL is not configured."**
You forgot to add it in Vercel → Project Settings → Environment Variables. Add it there and click **Redeploy**.

**"relation users does not exist" in the logs.**
You skipped Step 5. Run the two PowerShell commands from that step.

**"Invalid credentials" when logging in.**
The seed script didn't run, OR you typed the password differently. Re-run `npm run db:seed` with the right `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars (it's idempotent — won't make duplicates).

**The phone app says "network error".**
Check the API URL — it must include `https://` and have no trailing slash. The dashboard must be deployed (visit the URL in a browser to confirm).

**A rep can't sign in but admin can.**
Their account password is stored hashed; you can't recover the original. From the dashboard → Employees → click that rep → reset their password. Send them the new one.
