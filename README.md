# Mpira Metrics API

This is the API backend for the Mpira Metrics project, built with Hono, TypeScript, and Postgres.

## Prerequisites

Before you begin, ensure you have met the following requirements:

*   **Node.js**: v20 or higher recommended.
*   **PostgreSQL**: A running PostgreSQL instance.

## Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd mpira-metrics-api
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

## Configuration

1.  **Environment Variables:**
    
    Copy the example environment file to create your local `.env` file:

    ```bash
    cp .env.example .env
    ```

2.  **Edit `.env`:**
    
    Open `.env` and set your database connection string:

    ```env
    DATABASE_URL=postgres://your_user:your_password@localhost:5432/your_database
    ```

## Running the Project

### Development
To run the project in development mode with hot reloading:

```bash
npm run dev
```

The server will start at `http://localhost:3000`.

### Production
To build and start the project for production:

```bash
npm run build
npm start
```

## API Endpoints

*   `GET /`: Health check (Returns "Hello Hono!")
*   `GET /api/v1`: API entry point
*   `GET /db-test`: Test database connection and retrieve competitions

