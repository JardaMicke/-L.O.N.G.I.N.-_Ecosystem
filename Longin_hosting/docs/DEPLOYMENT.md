# Deployment Guide

This guide describes how to deploy the Longin Hosting platform to a production environment.

## Prerequisites

- **Server:** A Linux VPS (Ubuntu 20.04+ recommended) with at least 4GB RAM (ELK stack is heavy).
- **Domain:** A domain name pointing to your server IP (e.g., `longin.example.com`).
- **Software:**
  - Docker Engine (v24+)
  - Docker Compose (v2+)
  - Git

## Architecture

The production setup uses **Docker Compose** to orchestrate the following services:

- **Traefik:** Reverse proxy and load balancer. Handles SSL (Let's Encrypt) and routing.
- **Frontend (Longin UI):** React application served via Nginx.
- **Backend (Longin Core):** Node.js API.
- **Databases:** PostgreSQL (App Data), Redis (Cache/Queue).
- **Monitoring:** Prometheus & Grafana.
- **Logging:** ELK Stack (Elasticsearch, Logstash, Kibana).

## Step-by-Step Deployment

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/longin-hosting.git
cd longin-hosting
```

### 2. Configure Environment Variables

Create a `.env.production` file (or just `.env` if using the default compose behavior) based on the example below.

**Important:** Change all secrets!

```ini
# Database
POSTGRES_USER=longin_user
POSTGRES_PASSWORD=secure_password_change_me
POSTGRES_DB=longin_db

# Redis
REDIS_PASSWORD=redis_password_change_me

# JWT Secrets (Generate random strings)
JWT_ACCESS_SECRET=access_secret_change_me_random_string_32_chars
JWT_REFRESH_SECRET=refresh_secret_change_me_random_string_32_chars

# Domain Configuration
DOMAIN=your-domain.com
ACME_EMAIL=admin@your-domain.com

# Logging
LOG_LEVEL=info
```

### 3. Prepare Directories

Ensure the data directories exist (Docker will create volumes, but for bind mounts checking permissions is good practice).

### 4. Deploy

Run the production compose file.

```bash
# Pull the latest images (if using pre-built images from registry)
# docker compose -f docker-compose.prod.yml pull

# OR Build locally (if source is available)
docker compose -f docker-compose.prod.yml build

# Start services
docker compose -f docker-compose.prod.yml up -d
```

### 5. Verify Deployment

Check if all containers are running:

```bash
docker compose -f docker-compose.prod.yml ps
```

### 6. Accessing Services

Assuming your domain is `example.com`:

- **Main App:** `https://example.com`
- **API:** `https://api.example.com`
- **Grafana:** `https://monitor.example.com` (Default admin/admin - change immediately!)
- **Kibana:** `https://logs.example.com`

## CI/CD Pipeline

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that:
1. Runs unit tests on push to `main`.
2. Builds Docker images for Core and UI.
3. Pushes images to GitHub Container Registry (GHCR).

### Automating Deployment

To automate the deployment to your VPS, add the following secrets to your GitHub Repository:

- `SSH_HOST`: Server IP
- `SSH_USER`: SSH Username
- `SSH_KEY`: Private SSH Key

Then uncomment the "Deploy to VPS" job in the workflow file.

## Maintenance

### Backup

Backup the Docker volumes:
- `postgres_data`
- `grafana_data`

### Updates

```bash
git pull
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```
