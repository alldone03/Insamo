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
    docker-compose up -d --build
    ```

4.  **Access the Application:**
    -   Frontend: http://localhost:5173
    -   Backend API: http://localhost:8000

### Production Setup (Docker)

1.  **Run with Production Compose:**
    ```bash
    docker-compose -f docker-compose.prod.yml up -d --build
    ```

## Manual Setup (Without Docker)

### Backend (Laravel)

1.  `cd backend`
2.  `composer install`
3.  `cp .env.example .env`
4.  `php artisan key:generate`
5.  `php artisan jwt:secret`
6.  `php artisan migrate --seed`
7.  `php artisan serve` (Runs on http://localhost:8000)

### Frontend (React)

1.  `cd frontend`
2.  `yarn install`
3.  `yarn dev` (Runs on http://localhost:5173)

## Features

-   User Authentication (JWT)
-   Device Management
-   Sensor Readings Visualization
-   Role-based Access Control
