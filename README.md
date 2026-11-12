# CampusBazaar 🎒

A peer-to-peer university marketplace and campus community platform built with **React + Vite + Tailwind CSS** on the frontend and **Spring Boot 3 + Spring Security (JWT) + Spring Data MongoDB (MongoDB Atlas)** on the backend.

Students can buy, sell, rent, exchange, or give away textbooks, calculators, electronics, and hostel essentials within their university community, chat directly with sellers, manage their own listings, save items to a wishlist, and post Lost & Found notices on their campus board.

---

## Tech Stack & Cloud Architecture

- **Frontend (Vercel):** React 18, Vite, Tailwind CSS, Redux Toolkit, React Router v6, Axios, Vitest
- **Backend (Render):** Java 17, Spring Boot 3.3, Spring Data MongoDB, Spring Security (OAuth2 Resource Server / Nimbus JWT), Bean Validation, Docker
- **Database (MongoDB Atlas):** Cloud-hosted MongoDB Atlas cluster (`mongodb+srv://...`) with automatic collection indexing, sequential numeric IDs, and first-boot campus data seeding

---

## MongoDB Atlas Setup

1. Create a free **M0 Cluster** on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under **Database Access**, create a database user (e.g., `campusbazaar_user`) with a password.
3. Under **Network Access**, add `0.0.0.0/0` (Allow Access from Anywhere) so **Render** can connect to your cluster.
4. Click **Connect → Drivers** and copy your connection string:
   ```text
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/campusbazaar?retryWrites=true&w=majority
   ```

---

## Local Development (Fundamental Commands)

### 1. Run the Backend (`http://localhost:8080`)

```bash
cd backend

# macOS / Linux:
export MONGODB_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/campusbazaar?retryWrites=true&w=majority"
export JWT_SECRET="$(openssl rand -base64 48)"
export ADMIN_PASSWORD="<choose-a-unique-strong-password>"

# Windows PowerShell:
# $env:MONGODB_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/campusbazaar?retryWrites=true&w=majority"
# $bytes = New-Object byte[] 48
# $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
# $rng.GetBytes($bytes)
# $env:JWT_SECRET=[Convert]::ToBase64String($bytes)
# $rng.Dispose()
# $env:ADMIN_PASSWORD="<choose-a-unique-strong-password>"

mvn spring-boot:run
```

> On first start, `DataSeeder` automatically populates MongoDB Atlas with 5 universities (Chitkara University, Panjab University, PEC, Thapar, IIT Ropar), categories, 10 campus listings, sample student accounts, campus board notices, and an initial chat conversation.

### 2. Run the Frontend (`http://localhost:5173`)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Cloud Deployment Guide (Render + Vercel)

### 1. Deploy Backend on Render

This repository includes both `backend/Dockerfile`, root `Dockerfile`, and `render.yaml` so Render builds and runs the Spring Boot container without configuration failures:

1. Push this project to a GitHub repository.
2. On [Render](https://dashboard.render.com), click **New + → Web Service** and connect your GitHub repository.
3. Configure the service:
   - **Root Directory:** `backend` *(or leave empty — both are supported)*
   - **Runtime:** `Docker`
   - **Instance Type:** Free (the Dockerfile is tuned with `-XX:MaxRAMPercentage=75.0 -XX:+UseSerialGC` to stay well inside 512 MB RAM)
4. Add the following **Environment Variables** in Render:
   | Key | Value |
   | :--- | :--- |
   | `MONGODB_URI` | `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/campusbazaar?retryWrites=true&w=majority` |
   | `MONGODB_DATABASE` | `campusbazaar` |
   | `JWT_SECRET` | Generate a unique random secret of at least 32 bytes (Render can generate one automatically). |
   | `ADMIN_PASSWORD` | Set a unique strong password for the seeded administrator account. |
   | `CORS_ALLOWED_ORIGINS` | `https://*.vercel.app,http://localhost:5173` |
   | `SEED_ENABLED` | `true` |
5. Click **Deploy Web Service** and verify `https://<your-render-service>.onrender.com/api/health` returns `{"success":true,"data":{"status":"UP"}}`.

### 2. Deploy Frontend on Vercel

Both `frontend/vercel.json` and root `vercel.json` are pre-configured with SPA rewrites so refreshing routes like `/login`, `/sell`, `/my-listings`, or `/campus-board` never returns a 404:

1. On [Vercel](https://vercel.com/new), import the same GitHub repository.
2. Set **Root Directory** to `frontend` *(or leave at root — both work automatically)*.
3. Under **Environment Variables**, add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://<your-render-service>.onrender.com` |
4. Click **Deploy**. Your Vercel frontend will connect directly to your Render backend and MongoDB Atlas cluster.

---

## Seeded Test Accounts

You can also use the **1-click Quick-fill** buttons directly on the `/login` page:

| Role | Name | Email | Password | Campus / Hostel |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | Aarav Mehta | `aarav.mehta@chitkara.edu.in` | `Student@123` | Chitkara University · Archimedes Hostel |
| **Student** | Isha Nair | `isha.nair@chitkara.edu.in` | `Student@123` | Chitkara University · Nightingale Hostel |
| **Student** | Kabir Sharma | `kabir.sharma@pec.edu.in` | `Student@123` | PEC Chandigarh · Shivalik Hostel |
| **Admin** | Moderator | `ADMIN_EMAIL` (defaults to `admin@campusbazaar.demo`) | Set `ADMIN_PASSWORD` in your environment; no default password is provided. | Platform Administration |

---

## Running Automated Tests

```bash
# Backend integration tests (Spring Boot MockMvc + Embedded MongoDB)
cd backend
mvn test

# Frontend unit & component tests (Vitest + React Testing Library)
cd frontend
npm test
```
