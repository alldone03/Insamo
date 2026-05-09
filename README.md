# Disaster Monitoring System (Insamo)

This project is a Disaster Monitoring System built with React (Frontend) and Laravel (Backend).

## Project Structure

-   `backend`: Laravel 12 Backend API
-   `frontend`: React (JavaScript) + TailwindCSS Frontend

## Getting Started

### Prerequisites

-   Docker
-   Docker Compose

### Development Setup (Docker)

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd Insamo_rw
    ```

2.  **Environment Variables:**
    -   Copy `.env.example` to `.env` in `backend` directory.
    -   Configure database credentials in `backend/.env` to match `docker-compose.yml` (default user: `root`, password: `password`, host: `db`).

3.  **Run with Docker Compose:**
    ```bash
    docker compose up -d --build
    ```

### 4. Database Setup (Migrations & Seeding)

After the containers are running, you need to initialize the database:

-   **Initialize & Migrate Database:**
    ```bash
    docker compose exec app yarn db:init
    docker compose exec app yarn db:push
    ```
-   **Seed Database (Sample Data):**
    ```bash
    docker compose exec app yarn db:seed
    ```

### 5. Verify Service Status

To ensure the system is running correctly, you can use these commands:

-   **Check Container Status:**
    ```bash
    docker compose ps
    ```
-   **Test Backend Connectivity (Health Check):**
    ```bash
    # Using curl (Linux/Mac/Git Bash)
    curl http://localhost:3000

    # Using PowerShell (Windows)
    Invoke-RestMethod -Uri http://localhost:3000
    ```
    *Expected Response:* `{"message": "Insamo Backend v2 ... is running!"}`

-   **View Backend Logs:**
    ```bash
    docker compose logs -f app
    ```

### 6. Access the Application

-   **Frontend:** [http://localhost:5173](http://localhost:5173)
-   **Backend API:** [http://localhost:3000](http://localhost:3000)
-   **Prediction Service:** [http://localhost:8501](http://localhost:8501)

---

## Production Setup (Docker)

1.  **Run with Production Compose:**
    ```bash
    docker compose -f docker-compose.prod.yml up -d --build
    ```

2.  **Database Initial Migration:**
    ```bash
    docker compose -f docker-compose.prod.yml exec app yarn prod:db:init
    docker compose -f docker-compose.prod.yml exec app yarn prod:db:migrate
    docker compose -f docker-compose.prod.yml exec app yarn prod:db:seed
    ```

## Manual Setup (Without Docker)

1.  `cd backend`
2.  `yarn install`
3.  `cp .env.example .env`
4.  `yarn key:generate` (Generate JWT Secret)
5.  `yarn db:init` (Ensure database exists)
6.  `yarn db:push` (Migrate database schema)
7.  `yarn db:seed` (Seed database)
8.  `yarn dev` (Runs on http://localhost:3000)

## Features

-   User Authentication (Better Auth)
-   Device Management
-   Sensor Readings Visualization (SIGMA, FLOWS, LANDSLIDE, WILDFIRE)
-   Role-based Access Control
-   Telegram Alert Integration

## Seeder Details

The seeder (`yarn db:seed`) populates the following:
-   **Roles:** SuperAdmin, Admin, User
-   **Users:** `superadmin@example.com`, `admin@example.com`, `user@example.com` (All passwords: `password`)
-   **Devices:** Sample SIGMA, FLOWS, LANDSLIDE, and WILDFIRE nodes.
-   **Sensor Readings:** Historical data for visualization testing.
-   **System Settings:** Telegram bot tokens and alert templates.
