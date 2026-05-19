# Gestion Charite

Gestion Charite is a full-stack charity management platform for discovering charity actions, creating organizations, donating, and managing participation from a single web app.

The project is split into a Spring Boot backend and a React + TypeScript frontend, with MongoDB persistence and Docker support for local development.

## What The App Does

- Lets users sign in and manage their profile
- Shows charity actions and organization listings
- Supports donations with PayPal and Stripe flows
- Lets users participate in actions and track their history
- Provides organization dashboards for organizer accounts
- Includes an admin area for platform management
- Handles Google OAuth configuration on the backend

## Tech Stack

- Backend: Spring Boot 3.5.11, Spring Web, Spring Data MongoDB, Thymeleaf server-side templates, Mail
- Frontend: React 19, TypeScript, Vite, Bootstrap
- Database: MongoDB
- Integration: REST API under `/api`

## Repository Layout

- `backend/` Spring Boot API and Thymeleaf server-side templates
- `frontend/` React client application
- `docker-compose.yml` Local Docker setup for MongoDB, backend, and frontend
- `data/` Seed data used by the backend

## Prerequisites

- Java 17 or higher
- Node.js 20 or higher
- npm 10 or higher
- Docker Desktop if you want to use the compose setup

## Environment Variables

### Frontend

Create a `.env` file in `frontend/` if you want to override the defaults from `frontend/.env.example`.

- `VITE_API_URL` API base URL used by the React app
- `VITE_PAYPAL_CLIENT_ID` PayPal client id for donation flow
- `VITE_STRIPE_PUBLISHABLE_KEY` Stripe publishable key for donation flow

The example file currently points `VITE_API_URL` to `http://localhost:8081/api`, so adjust it to match your backend port if needed.

### Backend

The backend reads these environment variables for Google OAuth and frontend redirects:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` default: `http://localhost:8080/api/auth/google/callback`
- `APP_FRONTEND_URL` default: `http://localhost:5173`
- `SPRING_DATA_MONGODB_URI` used by Docker and local overrides

## Run Locally

### Option 1: Docker Compose

From the repository root:

```powershell
docker compose up --build
```

This starts:

- MongoDB on `27017`
- Backend on `8080`
- Frontend on `3000`

### Option 2: Run Backend And Frontend Separately

Start MongoDB first, then run the backend:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Backend defaults to `http://localhost:8080`.

Then start the frontend:

```powershell
cd frontend
npm install
npm run dev
```

Frontend defaults to `http://localhost:5173`.

## Main API Areas

The backend exposes REST endpoints under `http://localhost:8080/api` for:

- `auth` Google authentication and session checks
- `users` user profile and donation history
- `organizations` organization listing and creation
- `charity-actions` charity action management
- `donations` donation creation and lookup
- `participations` event participation management
- `payments` PayPal and Stripe confirmation flows
- `admin` admin-oriented data and maintenance operations

## Build And Test

### Frontend

```powershell
cd frontend
npm run build
npm run lint
```

### Backend

```powershell
cd backend
.\mvnw.cmd test
```

## Notes

- The backend seeds default data on startup when the database is empty.
- MongoDB data persists locally through the `mongo-data` volume when using Docker Compose.
- The frontend includes a global payment finalizer that handles PayPal and Stripe redirects back into the app.

## License

This project does not currently include an explicit license file.
