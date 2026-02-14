# Backend - Laravel

This is the backend for the Disaster Monitoring System, built with Laravel 12.
It provides a RESTful API for managing users, devices, sensor readings, and classification results.
Authentication is handled via JWT (JSON Web Tokens).

## Prerequisites

- PHP 8.2 or higher
- Composer
- Node.js & NPM (for frontend/dev dependencies)
- SQLite (default) or MySQL

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd Insamo_rw/backend-laravel
    ```

2.  **Install PHP dependencies:**
    ```bash
    composer install
    ```

3.  **Environment Setup:**
    -   Copy `.env.example` to `.env`:
        ```bash
        cp .env.example .env
        ```
    -   Configure database settings in `.env`. By default, it is configured for SQLite (`DB_CONNECTION=sqlite`).
    -   Generate application key:
        ```bash
        php artisan key:generate
        ```
    -   Generate JWT secret:
        ```bash
        php artisan jwt:secret
        ```

4.  **Database Migration & Seeding:**
    -   Run migrations to create database tables:
        ```bash
        php artisan migrate
        ```
    -   (Optional) Seed the database with sample data:
        ```bash
        php artisan db:seed
        ```

## Running the Application

Start the local development server:

```bash
php artisan serve
```

The API will be available at `http://localhost:8000/api`.

## API Endpoints

### Authentication
-   `POST /api/login` - Login with email and password.
-   `POST /api/register` - Register a new user.
-   `POST /api/logout` - Logout (invalidate token).
-   `POST /api/refresh` - Refresh access token.
-   `POST /api/me` - Get current user info.

### Resources (Protected)
headers: `Authorization: Bearer <token>`

-   **Users**: `GET /api/users`, `POST /api/users`, etc.
-   **Devices**: `GET /api/devices`, `POST /api/devices`, etc.
-   **Device Settings**: `GET /api/device-settings`, etc.
-   **Sensor Readings**: `GET /api/sensor-readings`, `POST /api/sensor-readings`, etc.
-   **Classification Results**: `GET /api/classification-results`, etc.

## Testing

Run unit and feature tests:

```bash
php artisan test
```

## Folder Structure

-   `app/Models`: Eloquent models (User, Device, SensorReading, etc.)
-   `app/Http/Controllers`: API Controllers.
-   `database/migrations`: Database schema definitions.
-   `database/seeders`: Data seeders for testing.
-   `routes/api.php`: API route definitions.

## Key Technologies
-   **Framework**: Laravel 12
-   **Auth**: php-open-source-saver/jwt-auth
-   **Database**: SQLite (Development), MySQL (Production ready)
