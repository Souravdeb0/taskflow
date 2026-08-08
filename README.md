# TaskFlow ⚡

TaskFlow is a premium, high-performance project management and enterprise issue tracker. Built as a full-stack monorepo, it enables teams to manage tickets, track project activities, and collaborate in real-time.

Live Deployment: **[https://taskflow-nu-plum-59.vercel.app](https://taskflow-nu-plum-59.vercel.app)**

---

## 🛠️ Technology Stack

*   **Frontend:** React (TypeScript), Vite, TailwindCSS (for responsive UI/UX & glassmorphic aesthetics), Firebase Client SDK.
*   **Backend:** Node.js, Express, Firebase Admin SDK (token verification).
*   **Database:** SurrealDB (a multi-model cloud database using WebSockets).
*   **Hosting & CI/CD:** Vercel (Serverless Functions for backend API routes).

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18+)
*   [SurrealDB CLI](https://surrealdb.com/install) (v3+)

### 2. Start SurrealDB Database
Start your local SurrealDB instance using the embedded key-value engine:
```bash
surreal start --user root --pass root surrealkv://jira_lite.db
```
*(This creates and runs database files in a directory named `jira_lite.db`).*

### 3. Run the Monorepo
TaskFlow uses npm workspaces. You can start both components from the root:

*   **Run Backend API Server:**
    ```bash
    npm run dev --workspace=backend
    ```
    *(Backend will spin up on `http://localhost:5001`)*

*   **Run Frontend Client:**
    ```bash
    npm run dev --workspace=frontend
    ```
    *(Frontend will run on `http://localhost:5173`)*

---

## 🔑 Demo & Test Credentials

You can use the built-in bypass accounts to test different roles. When Firebase Auth is bypassed in development (or if credentials are not present), enter **any password** (minimum 6 characters) with these emails:

| Role | Email Address | Access Level |
| :--- | :--- | :--- |
| **Admin** | `alice@example.com` | Full administrative control, manage users & roles |
| **Manager** | `charlie@example.com` | Create tickets, assign tasks, track board progress |
| **Employee** | `bob@example.com` | View assigned tasks, update ticket status |
| **SuperAdmin** | `souravdeb803@gmail.com` | Platform Owner (Automatic elevation on signup) |

---

## 🌐 Production Vercel Configuration

The project is configured for Vercel using the root [vercel.json](file:///Users/souravdeb/Desktop/TaskFlow/vercel.json) file:
*   **Backend Rewrites:** Routes requests under `/api/*` to `/api/index.ts` (Express serverless lambda).
*   **SPA Client Routing:** Non-API requests fallback to `/index.html` to support React Router client-side navigation.
*   **Cron Jobs:** Runs daily ticket reminders via Vercel Crons pointing to `/api/tickets/dev/trigger-reminders`.

### Required Environment Variables (Vercel Settings)

| Key | Purpose |
| :--- | :--- |
| `SURREAL_URL` | Surreal Cloud instance WebSocket URL (`wss://.../rpc`) |
| `SURREAL_USER` | SurrealDB instance administrator username |
| `SURREAL_PASS` | SurrealDB instance administrator password |
| `SURREAL_NS` & `SURREAL_DB` | SurrealDB Namespace and Database Name (`taskflow`) |
| `VITE_FIREBASE_API_KEY` | Firebase Client Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Client Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Client Project ID |
| `FIREBASE_PROJECT_ID` | Firebase Admin SDK Project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin SDK Client Email |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK Service Account Private Key |
