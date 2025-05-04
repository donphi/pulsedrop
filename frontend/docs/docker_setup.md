# Docker Setup for Frontend Application

This document provides instructions on how to build and run the frontend Next.js application using Docker and Docker Compose.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

*   **Docker:** [Installation Guide](https://docs.docker.com/get-docker/)
*   **Docker Compose:** [Installation Guide](https://docs.docker.com/compose/install/) (Often included with Docker Desktop)

## Environment Variables

The application requires specific environment variables for configuration, including API keys and secrets. These are managed using a `.env` file located in the `frontend/` directory.

1.  **Create the `.env` file:**
    Copy the template file `frontend/.env.template` to create your local environment file:
    ```bash
    cp frontend/.env.template frontend/.env
    ```

2.  **Populate the `.env` file:**
    Open the newly created `frontend/.env` file and fill in the required values. Key variables include:
    *   `NEXTAUTH_URL`: The base URL of your application (e.g., `http://localhost:3000` for local development).
    *   `NEXTAUTH_SECRET`: A secret key for NextAuth.js session encryption. You can generate one using `openssl rand -base64 32`.
    *   `STRAVA_CLIENT_ID`: Your Strava application's Client ID.
    *   `STRAVA_CLIENT_SECRET`: Your Strava application's Client Secret.
    *   `SUPABASE_URL`: Your Supabase project URL.
    *   `SUPABASE_ANON_KEY`: Your Supabase project's anonymous key.
    *   `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase project's service role key (handle with care).
    *   *(Add any other variables present in `.env.template`)*

    **Important:** The `.env` file contains sensitive information and **MUST NOT** be committed to version control. Ensure it is listed in your `.gitignore` file (it should be by default if you copied from `.env.template`).

## Building the Docker Image

To build the Docker image for the frontend application, navigate to the `frontend/` directory in your terminal and run the following command:

```bash
docker compose build
```

This command reads the `frontend/docker-compose.yml` file, which in turn uses `frontend/Dockerfile` to:
*   Download the specified Node.js base image.
*   Install project dependencies.
*   Build the Next.js application for production.
*   Create a final, optimized image ready to run the application.

## Running the Container

Once the image is built, you can start the application container using Docker Compose. Ensure you are still in the `frontend/` directory and run:

```bash
docker compose up -d
```

*   `docker compose up`: This command starts the services defined in `docker-compose.yml`.
*   `-d`: This flag runs the containers in detached mode (in the background).

The command will:
*   Create and start the `frontend` container based on the image built previously.
*   Map port 3000 on your host machine to port 3000 inside the container.
*   Load the environment variables from your `frontend/.env` file into the container.

You should now be able to access the running application in your web browser at:
[http://localhost:3000](http://localhost:3000)

## Stopping the Container

To stop the running application container(s) managed by Docker Compose, run the following command from the `frontend/` directory:

```bash
docker compose down
```

This command stops and removes the containers, networks, and volumes created by `docker compose up`.