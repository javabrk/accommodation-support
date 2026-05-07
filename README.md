# SupportHome — Social Support Accommodation Platform

A full-stack web application for managing social support accommodation services.

## Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | Next.js 14, TypeScript, Tailwind CSS |
| Backend     | Node.js, Express.js               |
| Database    | PostgreSQL                        |
| Auth        | JWT (access + refresh tokens)     |
| API         | RESTful JSON API                  |

## Features

### Admin Portal
- Dashboard with key metrics (active clients, available properties, open tickets)
- **Client Management** — create, view, and update client records including NDIS info, support needs, emergency contacts
- **Property Management** — manage accommodation properties with availability tracking
- **Allocation Management** — assign clients to properties with date tracking
- **Ticket Management** — view all support tickets, respond, assign to staff, update status
- **Reports** — create and manage case notes, incident reports, progress reports, and more

### Client Portal
- **Dashboard** — see current property, open ticket count, and recent activity
- **Ticketing System** — submit support requests by category (maintenance, financial, support, complaint, general, emergency), track status and replies
- **Profile** — view personal details, emergency contacts, and current property

## Project Structure

```
accommodation-support/
├── backend/
│   ├── controllers/     # Business logic
│   ├── database/        # Schema SQL + pg connection + setup script
│   ├── middleware/       # JWT auth middleware
│   ├── routes/          # Express route handlers
│   └── server.js        # Entry point
└── frontend/
    ├── app/
    │   ├── login/       # Login page
    │   ├── admin/       # Admin portal pages
    │   └── client/      # Client portal pages
    ├── components/
    │   ├── layout/      # Sidebars (admin & client)
    │   └── ui/          # Shared UI (Badge, Modal)
    ├── lib/             # API client, auth utilities
    └── types/           # TypeScript interfaces
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

---

### 1. Clone & enter the project
```bash
cd C:\Users\monab\Projects\accommodation-support
```

---

### 2. Database Setup

Create the database in PostgreSQL:
```sql
CREATE DATABASE accommodation_support;
```

Run the schema:
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DB credentials
npm run db:setup
```

---

### 3. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=accommodation_support
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=change_this_to_a_random_secret_string
JWT_REFRESH_SECRET=change_this_too
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

Start the backend:
```bash
npm run dev     # development (nodemon)
npm start       # production
```

---

### 4. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Start the frontend:
```bash
npm run dev     # development (http://localhost:3000)
npm run build && npm start   # production
```

---

## Default Login

| Role  | Email                       | Password   |
|-------|-----------------------------|------------|
| Admin | admin@accommodation.com     | password   |

> The admin seed password hash in `schema.sql` corresponds to `password`. Change it after first login.

New clients are created by admin with a default password of `Welcome@123`.

---

## API Reference

### Auth (`/api/auth`)
| Method | Path        | Description         |
|--------|-------------|---------------------|
| POST   | `/login`    | Login               |
| POST   | `/refresh`  | Refresh access token|
| POST   | `/logout`   | Logout              |
| GET    | `/me`       | Current user info   |

### Admin (`/api/admin`) — requires admin JWT
| Method | Path                         | Description              |
|--------|------------------------------|--------------------------|
| GET    | `/dashboard`                 | Dashboard stats          |
| GET/POST | `/clients`               | List / create clients    |
| GET/PUT  | `/clients/:id`           | Get / update client      |
| GET/POST | `/properties`            | List / create properties |
| PUT    | `/properties/:id`            | Update property          |
| POST   | `/allocations`               | Create allocation        |
| GET    | `/tickets`                   | List all tickets         |
| GET/PUT | `/tickets/:id`              | Get / update ticket      |
| POST   | `/tickets/:id/messages`      | Reply to ticket          |
| GET/POST | `/reports`               | List / create reports    |
| PUT    | `/reports/:id`               | Update report            |

### Client (`/api/client`) — requires client JWT
| Method | Path                         | Description              |
|--------|------------------------------|--------------------------|
| GET    | `/dashboard`                 | Client dashboard data    |
| GET/PUT | `/profile`                  | Get / update profile     |
| GET/POST | `/tickets`               | List / create tickets    |
| GET    | `/tickets/:id`               | Get ticket with messages |
| POST   | `/tickets/:id/messages`      | Reply to ticket          |

---

## Security Notes

- JWT access tokens expire in 15 minutes; refresh tokens in 7 days
- Passwords are hashed with bcrypt (cost factor 10)
- Role-based access control — admins cannot access `/api/client/*` and vice versa
- CORS is restricted to the configured frontend origin
- Refresh tokens are stored in the database and rotated on each use
