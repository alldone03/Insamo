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

4.  **Database Migration & Seeding:**
    -   **Backend 1 (Laravel):**
        ```bash
        docker compose exec app php artisan migrate:fresh --seed
        ```
    -   **Backend 2 (Node.js):**
        ```bash
        docker compose exec app yarn db:init
        docker compose exec app yarn db:generate # Create migration files
        docker compose exec app yarn db:migrate  # Apply migrations (Prod-safe)
        # OR use `yarn db:push` in development to sync schema directly
        docker compose exec app yarn db:seed
        ```

5.  **Access the Application:**
    -   Frontend: http://localhost:5173
    -   Backend API: http://localhost:8000

### Production Setup (Docker)

1.  **Run with Production Compose:**
    ```bash
    docker compose -f docker-compose.prod.yml up -d --build
    ```

2.  **Database Initial Migration (Backend 2):**
    ```bash
    docker compose -f docker-compose.prod.yml exec app yarn prod:db:init
    docker compose -f docker-compose.prod.yml exec app yarn prod:db:migrate
    ```

### Manual Setup (Without Docker)

### Backend (Node.js/Express - New)

1.  `cd backend`
2.  `yarn install`
3.  `cp .env.example .env`
4.  `yarn key:generate` (Generate JWT Secret)
5.  `yarn db:init` (Ensure database exists)
6.  `yarn db:push` (Migrate database schema)
7.  `yarn db:seed` (Seed database)
8.  `yarn dev` (Runs on http://localhost:3000)

### Backend (Laravel - Legacy)

1.  `cd backend`
2.  `composer install`
3.  `cp .env.example .env`
4.  `php artisan key:generate`
5.  `php artisan jwt:secret`
6.  `php artisan migrate --seed`
7.  `php artisan serve` (Runs on http://localhost:8000)

### Backend Deployment (Laravel)

1.  `docker compose -f docker-compose.prod.yml exec app rm -rf /var/www/storage/framework/views/*`
2.  `docker compose -f docker-compose.prod.yml exec app php artisan view:clear`
3.  `docker compose -f docker-compose.prod.yml exec app php artisan config:clear`
4.  `docker compose -f docker-compose.prod.yml exec app php artisan cache:clear`
5.  `docker compose -f docker-compose.prod.yml exec app php artisan jwt:secret`
6.  `docker compose -f docker-compose.prod.yml run --rm app php artisan key:generate --show`
7.  `docker compose -f docker-compose.prod.yml exec app php artisan migrate --force`
8.  `cp backend/.env .env`



### Frontend (React)

1.  `cd frontend`
2.  `yarn install`
3.  `yarn dev` (Runs on http://localhost:5173)

## Features

-   User Authentication (JWT)
-   Device Management
-   Sensor Readings Visualization
-   Role-based Access Control
