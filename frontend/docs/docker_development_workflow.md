# Docker Development Workflow

This document outlines two Docker workflows for the pHD frontend application:

1. **Development Workflow**: For quick iterations with live code reloading
2. **Production Workflow**: For complete rebuilds and production-ready containers

## Development Workflow

The development workflow allows you to make changes to your code and see them reflected immediately without having to rebuild the Docker container. This is achieved by mounting your local source code as a volume in the container and running the Next.js development server.

### Setup

Create a new file called `docker-compose.dev.yml` in the frontend directory:

```yaml
# frontend/docker-compose.dev.yml
version: '3.8'

services:
  frontend-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: phd_frontend_dev
    ports:
      - "3000:3000"
    env_file:
      - .env
    volumes:
      - .:/app
      - /app/node_modules
    restart: unless-stopped
    command: npm run dev
```

Create a simplified development Dockerfile called `Dockerfile.dev`:

```dockerfile
# frontend/Dockerfile.dev
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Set environment variables
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV WATCHPACK_POLLING=true

# Expose port
EXPOSE 3000

# The command will be overridden by docker-compose.dev.yml
CMD ["npm", "run", "dev"]
```

### Usage

To start the development environment:

```bash
docker-compose -f docker-compose.dev.yml up
```

This will:
1. Build the development container if it doesn't exist
2. Mount your local code into the container
3. Start the Next.js development server with hot reloading enabled

Now you can make changes to your code and see them reflected immediately in the browser without having to rebuild the container.

### How It Works

- The `volumes` section in `docker-compose.dev.yml` mounts your local directory into the container, so any changes you make locally are immediately available inside the container.
- The `/app/node_modules` volume mount prevents your local node_modules from overriding the ones in the container.
- The `WATCHPACK_POLLING=true` environment variable enables file watching in environments where inotify events might not work properly (like Docker on some systems).
- The container runs `npm run dev` which starts Next.js in development mode with hot reloading.

## Production Workflow

For production builds, use the existing Docker setup with the following command:

```bash
docker-compose down --rmi all --volumes --remove-orphans && docker system prune -af && docker-compose up --build
```

This command:
1. Stops all containers defined in docker-compose.yml
2. Removes all images used by any service in docker-compose.yml
3. Removes all volumes defined in docker-compose.yml
4. Removes any orphaned containers
5. Removes all unused Docker objects (images, containers, networks, and volumes)
6. Rebuilds and starts the containers

This ensures a clean environment for your production build, but it's more time-consuming than the development workflow.

## Switching Between Workflows

You can easily switch between development and production workflows:

1. For development with live reloading:
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

2. For production builds:
   ```bash
   docker-compose down --rmi all --volumes --remove-orphans && docker system prune -af && docker-compose up --build
   ```

## Best Practices

- Use the development workflow for day-to-day development and testing small changes
- Use the production workflow before deploying to ensure everything works in a production-like environment
- The production workflow is more thorough but slower, while the development workflow is faster but may not catch all issues