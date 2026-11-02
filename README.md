# StaffSync – HR Management System (MERN)

Role-based HR app for **HR**, **managers** and **employees**: attendance, leave, announcements, training, notifications and dashboards.

## Stack
- **Server:** Node.js, Express, MongoDB + Mongoose, JWT, bcryptjs, helmet, express-validator, rate limiting
- **Client:** React 18 (Vite), Redux Toolkit, React Router, Axios, Bootstrap 5, Recharts

## Quick start

You need Node.js 18+ and MongoDB (local, or a free MongoDB Atlas cluster).

```bash
# 1. API
cd server
npm install
# .env is already created from .env.example – edit MONGO_URI and JWT_SECRET
npm run seed        # optional: demo users and data (wipes the database!)
npm run dev         # http://localhost:5000

# 2. Client (new terminal)
cd client
npm install
npm run dev         # http://localhost:5173
```

The Vite dev server proxies `/api` to `localhost:5000`, so no client config is needed locally.

### Demo accounts (after `npm run seed`, password `Password@123`)
| Role | Email |
|---|---|
| HR | hr@staffsync.com |
| Manager | manager@staffsync.com |
| Employee | employee@staffsync.com |

## What each role can do
| | Employee | Manager | HR |
|---|---|---|---|
| Register / login, edit own profile, change password | ✔ | ✔ | ✔ |
| Check in / out, view own history | ✔ | ✔ | ✔ |
| Apply for / cancel leave, see balances | ✔ | ✔ | ✔ |
| Read announcements, see own training | ✔ | ✔ | ✔ |
| View team, team attendance | | ✔ | |
| Approve / reject team leave | | ✔ | ✔ (anyone) |
| Create training for team | | ✔ | ✔ (anyone) |
| Manage employees, roles, managers | | | ✔ |
| View all attendance, reports and charts | | | ✔ |
| Post announcements | | | ✔ |

## Business rules
- Self-registration always creates an `employee`; only HR can set roles.
- Overlapping leave requests are blocked; balance is checked on apply and deducted atomically on approval.
- Managers can only review leave and assign training for their own team; nobody can review their own leave.
- One check-in per day (unique index on employee + date). Check-ins after `WORK_START` are "late"; under 4 hours worked is "half-day".
- Deleting an employee deactivates the account so history is kept.
- Notifications are created when leave is requested/reviewed, training is assigned, and announcements are posted.

## API overview
`/api/auth` · `/api/employees` · `/api/manager/team` · `/api/attendance` · `/api/leaves` · `/api/announcements` · `/api/trainings` · `/api/notifications` · `/api/reports` · `/api/dashboard`

All list endpoints support `?page=&limit=`.

## Tests
```bash
cd server && npm test   # unit tests + auth integration tests (needs MongoDB; set MONGO_TEST_URI to override)
```

## Deployment
- API: Render / Railway. Set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (your client URL).
- Client: Vercel / Netlify. Set `VITE_API_URL` to `https://<your-api>/api`, build command `npm run build`, output `dist`. Add an SPA rewrite of all paths to `/index.html`.

## Folder structure
```
server/  config, models, controllers, routes, middleware, utils, tests, seed.js
client/  src/{api,app,features,components,pages}
```
