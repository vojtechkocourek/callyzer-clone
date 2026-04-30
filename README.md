# Callyzer Clone

A working clone inspired by [Callyzer](https://callyzer.co): a call analytics & team monitoring tool. The product has two pieces:

1. **Web admin** — a Next.js dashboard for admins, managers, and employees to view KPIs, filter call logs, manage employees and teams, and export reports.
2. **Android companion** — a Kotlin/Jetpack Compose app that signs in, reads the device's `READ_CALL_LOG`, and syncs entries to the web admin's API.

This is a demo build with seeded in-memory data on the server. Swap the data layer for a real database (Postgres + Prisma/Drizzle is a clean fit) when you want to ship it.

```
callyzer-clone/
├── web/          Next.js 14 + Tailwind + Recharts (App Router)
└── android/      Kotlin + Jetpack Compose + Retrofit + WorkManager
```

## Web admin

### Run it

```bash
cd web
npm install
npm run dev
# open http://localhost:3000
```

You'll be redirected to `/login`. Pick one of the demo accounts:

| Role     | Email                    | Password    |
|----------|--------------------------|-------------|
| Admin    | admin@callyzer.demo      | admin123    |
| Manager  | marco@callyzer.demo      | manager123  |
| Employee | daniel@callyzer.demo     | demo123     |

### What's inside

- **Dashboard** — KPI cards (total calls, talk time, avg duration, missed/rejected, etc.), 14-day stacked volume chart, talk-time line chart, call type pie chart, top performers table.
- **Call Logs** — filterable table (employee, type, date range, free-text search) with role-aware scoping.
- **Employees** — admin can create new employees with role + team + initial password.
- **Teams** — per-team summary cards with member counts and aggregated KPIs.
- **Reports** — slice-and-export view; downloads CSV via `/api/reports/csv`.
- **Settings** — profile, Android setup instructions, demo credentials.

### Role scoping

Implemented in `src/lib/scope.ts`:
- **admin** sees all employees and all calls
- **manager** sees their own team plus their own data
- **employee** sees only their own calls and profile

### API endpoints

| Method | Path                      | Auth                | Notes                                              |
|--------|---------------------------|---------------------|----------------------------------------------------|
| POST   | `/api/auth/login`         | none                | `{email,password,mode?}` — `mode:"api"` returns a bearer token without setting a cookie |
| POST   | `/api/auth/logout`        | cookie              | clears session                                     |
| GET    | `/api/calls`              | cookie              | filters: `employeeId`, `type`, `from`, `to`        |
| POST   | `/api/calls/sync`         | `Bearer <token>`    | bulk upload from Android                           |
| GET    | `/api/employees`          | cookie              | scoped by role                                     |
| POST   | `/api/employees`          | cookie (admin)      | create                                             |
| PATCH  | `/api/employees/[id]`     | cookie (admin)      | update                                             |
| DELETE | `/api/employees/[id]`     | cookie (admin)      | remove                                             |
| GET    | `/api/teams`              | cookie              | list                                               |
| POST   | `/api/teams`              | cookie (admin)      | create                                             |
| GET    | `/api/reports/csv`        | cookie              | filters as above; returns CSV download             |

## Android companion

A small Compose app that:

1. Lets the employee sign in against the web API (`/api/auth/login` with `mode:"api"`).
2. Asks for the `READ_CALL_LOG` runtime permission.
3. Reads call log entries, normalizes the `TYPE` field, and POSTs to `/api/calls/sync`.
4. Schedules a periodic 30-minute background sync via WorkManager.

### Open in Android Studio

```
Open ▸ select  callyzer-clone/android  ▸ Sync project with Gradle
Run  ▸ on a device or emulator
```

If you're using the standard Android emulator, the host machine is reachable at `http://10.0.2.2:3000` (already prefilled in the API URL field). On a physical device on the same Wi-Fi, use your laptop's LAN IP (e.g., `http://192.168.1.42:3000`).

### Project layout

```
android/app/src/main/java/com/callyzerclone/app/
├── MainActivity.kt                  # Compose entry, login + sync screens
├── ui/AppViewModel.kt               # State + login/sync actions
└── data/
    ├── ApiClient.kt                 # Retrofit + OkHttp setup
    ├── Models.kt                    # @Serializable DTOs (login, sync, etc.)
    ├── CallLogReader.kt             # Reads CallLog.Calls into DTOs
    ├── PrefsStore.kt                # DataStore-backed preferences
    ├── SyncWorker.kt                # CoroutineWorker that reads + uploads
    └── SyncScheduler.kt             # WorkManager scheduling helpers
```

### Permissions

The manifest declares:
- `READ_CALL_LOG` — required to read call entries
- `READ_CONTACTS` — for name resolution (optional but improves contact display)
- `INTERNET` / `ACCESS_NETWORK_STATE` — for sync

`android:usesCleartextTraffic="true"` is enabled so demo HTTP backends work in development. Disable that flag and use HTTPS in production.

## Architecture notes & next steps

- The web data store is in-memory and lives on `globalThis.__callyzerStore` so Next.js dev hot-reload doesn't reset it. Swap this for Prisma/Drizzle + Postgres for production.
- Passwords are stored in plain text in the seed data for demo convenience. Hash them (bcrypt/argon2) before deploying.
- Sessions are random-token based and stored in the same in-memory store. For real use, JWTs or a dedicated session table are the obvious upgrades.
- The sync endpoint deduplicates on `(employeeId, phoneNumber, startedAt)`, so re-running a sync from the phone is safe.
- Possible v2 modules: lead/CRM with follow-up reminders, attendance/check-in, recording uploads, scheduled email reports, and a real role-based admin view of pending sync conflicts.
