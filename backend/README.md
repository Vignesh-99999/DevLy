eLearn Backend (Node.js + Express + MongoDB)

Overview
This folder contains the Express API for authentication and tutorials used by the eLearn frontend.

Tech Stack
- Node.js, Express
- MongoDB + Mongoose
- JWT auth

Getting Started
1) Requirements
- Node.js LTS (v18+ recommended)
- MongoDB connection string

2) Install dependencies
```bash
npm install
```

3) Environment variables
Create a .env file in backend/ with:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/elearn
JWT_SECRET=replace-with-a-strong-secret
```

4) Run the server
```bash
# development
npm run dev

# or production
npm start
```
The API will start on http://localhost:5000.

Seed Data (optional)
There is a seed script to load sample data.
```bash
node seed.js
```

Project Structure
- server.js: App entry
- routes/
  - auth.js: login/signup endpoints
  - tutorialRoutes.js: tutorial list endpoints
- models/
  - user.js, tutorial.js: Mongoose models
- data/c_json.json: sample data

API Endpoints (summary)
- POST /api/auth/signup
  - body: { name, email, number, password }
  - returns: { message }

- POST /api/auth/login
  - body: { email, password }
  - returns: { token }

- GET /api/tutorials
  - returns: [ { id, title, language, ... } ]

Common Scripts (package.json)
- npm start – start server
- npm run dev – start with nodemon

Notes
- Ensure CORS is enabled for the frontend origin (http://localhost:3000 by default).
- Update JWT expiration or password policy as needed.

