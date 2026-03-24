# Gestion Charite

Gestion Charite is a full-stack charity management platform designed to manage organizations, charity actions, and donations through a clean API-driven architecture.

The project is structured with a Spring Boot backend and a React + TypeScript frontend in separate folders, connected through REST APIs.

## Project Overview

This application demonstrates a modern web architecture for nonprofit and donation workflows:

- Backend API for charity actions, donations, users, and organizations
- In-memory H2 database for quick development and testing
- React TypeScript frontend consuming backend endpoints
- Clean separation of frontend and backend responsibilities

## Architecture

- Backend: Spring Boot 3.5.11, Spring Web, Spring Data JPA, H2
- Frontend: React 19, TypeScript, Vite
- Communication: REST APIs under /api
- Development CORS: enabled for frontend at http://localhost:5173

## Repository Structure

- backend: Spring Boot application and API
- frontend: React TypeScript client

## Prerequisites

- Java 17 or higher
- Node.js 20 or higher
- npm 10 or higher

## Getting Started

### 1) Run Backend

1. Open a terminal in backend
2. Start the app

```powershell
.\mvnw.cmd spring-boot:run
```

Backend will run on:

- http://localhost:8080
- H2 console: http://localhost:8080/h2-console

### 2) Run Frontend

1. Open a terminal in frontend
2. Install dependencies
3. Start development server

```powershell
npm install
npm run dev
```

Frontend will run on:

- http://localhost:5173

## Environment Configuration

Frontend uses the following environment variable:

- VITE_API_URL (default: http://localhost:8080/api)

An example file is available in frontend/.env.example.

## API Summary

Base URL: http://localhost:8080/api

Main endpoints include:

- GET /health
- GET/POST/PUT/DELETE /charity-actions
- GET/POST/DELETE /donations
- GET /donations/action/{actionId}
- GET/POST /users
- GET/POST/PUT/DELETE /organizations

Additional endpoints exist for auth/admin/language placeholders.

## Build Commands

### Frontend

```powershell
npm run build
```

### Backend

```powershell
.\mvnw.cmd test
```

## Notes

- The backend seeds default data on startup when the database is empty.
- H2 is in-memory by default, so data resets each restart.

## License

This project is currently provided without an explicit license file.
