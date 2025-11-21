# DevLy MERN Platform

Full-stack learning platform that combines a student portal, professor workspace, and admin console. Students explore tutorials, take MCQ-style assessments, and chat with an AI professor. Professors manage their profile, subjects, and review performance, while admins seed content and manage users. The repo hosts three React frontends (`frontend`, `admin`) and one Express/Mongo backend (`backend`), plus automation helpers for seeding and bootstrapping services.

---

## Feature Highlights
- **Student portal (React @3000)** – tutorials for Python/C/C++/Java, timed tests with auto-grading, AI professor chat, profile editing with avatar uploads, suspension-aware access control.
- **Professor workspace (React @3000 route `/professor`)** – dedicated dashboard powered by new `GET/PUT /api/professors/profile` endpoints with JWT role checks, subject toggles, and education history editing.
- **Admin console (React @3001)** – manage promoted professors, tutorials, and monitor users.
- **Backend (Express @5000)** – JWT auth for students, professors, and admins; test orchestration; tutorial ingestion from JSON; file uploads via Multer; mailer utilities and seed scripts.
- **Central orchestration** – `start_project.bat` starts MongoDB, seeds tutorials/admin, and launches backend + both frontends.

---

## Tech Stack
- **Frontend**: React (CRA), Framer Motion, Axios, SweetAlert2, custom SCSS/ CSS modules.
- **Backend**: Node.js, Express, MongoDB/Mongoose, JWT, Multer, Nodemailer, BCrypt.
- **Tooling**: Nodemon for dev reloads, seeding scripts (`seed.js`, `seedAdmin.js`), PowerShell batch helper.

---

## Repository Layout
```
mern_proj/
├─ backend/        # Express API, models, seeds, middleware
├─ frontend/       # Main student/professor React app (port 3000)
├─ admin/          # Admin React app (port 3001)
├─ start_project.bat
└─ README.md       # You are here
```

See `backend/README.md` for API-specific notes. Frontend packages include their own CRA defaults.

---

## Prerequisites
- Node.js ≥ 18
- npm ≥ 9
- MongoDB Community Server (default local instance at `mongodb://127.0.0.1:27017`)
- PowerShell (for `start_project.bat`) or shell access to run the apps manually

Optional: `ollama serve` (AI assistant referenced in `start_project.bat`), SMTP credentials if you plan to send OTP emails.

---

## Environment Variables
Create a `.env` inside `backend/` with at least:
```env
PORT=5000
MONGO_URI=mongodb+srv://vigljku_db_user:wYS5YNCbFSpu8G2k@mernauth.ysoggzy.mongodb.net/mern_auth?retryWrites=true&w=majority&appName=mernauth
JWT_SECRET=replace-with-strong-secret

# Optional for OTP/email flows
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@example.com
SMTP_PASS=app-password
FROM_EMAIL=DevLy <noreply@devly.io>
```

The frontends rely on `http://localhost:5000` for API calls (see Axios usage), so adjust proxies if you change the backend port.

---

## Installation
Run these once per workspace (from repo root):
```bash
cd backend   && npm install
cd ../frontend && npm install
cd ../admin    && npm install
```

---

## Running the Stack
### Option A – Automated (Windows)
```
start_project.bat
```
This script:
1. Starts `ollama serve` (optional AI dependency)
2. Launches MongoDB with the provided data path
3. Runs `node seed.js` and `node seedAdmin.js`
4. Starts the backend (`npm run dev`)
5. Starts the student frontend (`npm start` on port 3000)
6. Starts the admin frontend on port 3001 (`BROWSER=none`)
7. Opens VS Code

### Option B – Manual
Open separate terminals:
```bash
# Terminal 1 – MongoDB (or ensure the service is running)
mongod --dbpath "C:\data\db"

# Terminal 2 – Backend
cd backend
npm run dev

# Terminal 3 – Student/Professor frontend
cd frontend
npm start      # http://localhost:3000

# Terminal 4 – Admin frontend
cd admin
set PORT=3001 && npm start
```

---

## Seed Data & Default Accounts
- `node backend/seed.js` loads tutorials (`data/*.json`) into Mongo.
- `node backend/seedAdmin.js` creates a default admin:
  - Email: `admin@admin.com`
  - Password: `admin123`
- Professors can be promoted via admin workflows or by inserting directly into Mongo (see `Professor` model).
- Student sign-up happens via the public `/api/auth/signup` flow with OTP email verification (SMTP required).

---

## Key Workflows
- **Professor profile editing** – `frontend/src/components/ProfessorDashboard.js` calls:
  - `GET /api/professors/profile` (new protected route)
  - `PUT /api/professors/profile` (updates name/email/education/subjects/password)
- **Student profile editing** – `EditProfileModal` uses `GET/PUT /api/users/profile` with Multer file uploads for avatars.
- **Student tests** – `studentTestRoutes` exposes `/available`, `/[:id]`, and `/[:id]/submit`; submission normalizes unanswered questions (`selectedAnswer: 'na'`) to avoid server errors and ensures accurate scoring.
- **Home page content** – `frontend/src/components/Home.js` now includes highlight cards, learning playbooks, weekly plans, and updates styled via `Home.css`.

---

## Useful Scripts
From any package:
- `npm run dev` – backend hot reload (nodemon)
- `npm start` – CRA dev server (frontend/admin)
- `npm test` – CRA tests
- `node seed.js` – tutorial seeding
- `node seedAdmin.js` – default admin creation

---

## Troubleshooting
- **CORS errors** – backend `corsOptions` allows `http://localhost:3000` and `http://localhost:3001`; update if you use different hosts.
- **JWT failures** – ensure `JWT_SECRET` matches across sessions; tokens expire after 1 hour.
- **Mongo connectivity** – confirm `MONGO_URI` in `.env` and that the `mongod` process is running.
- **Uploads** – `backend/uploads/` must exist and be writable; new files are stored with timestamp prefixes.
- **Professors hitting student routes** – use the correct login role (`role: "professor"` in `/api/auth/login`). The `protectProfessor` middleware enforces this.

---

## Contributing / Customizing
1. Fork & branch per feature.
2. Keep frontends consistent with `Home.css` design tokens.
3. Add new data JSON files under `backend/data/` and rerun `node seed.js`.
4. Extend Express routes under `backend/routes/`; register them in `server.js`.
5. Before PRs, run lint/tests per package and describe how to reproduce.

Happy building! 🎓💻

