# Product Specification: Longin Hosting

## 1. Introduction

**Longin Hosting** is a self-hosted application runtime environment designed to simplify the deployment and management of Dockerized applications. It provides a centralized dashboard for managing containers, allocating ports, monitoring system resources in real-time, and handling user authentication.

## 2. Core Features

- **User Authentication:** Secure JWT-based authentication with role-based access control (RBAC).
- **Container Management:** Full CRUD operations for Docker containers via Dockerode.
- **Port Management:** Automated and manual port allocation (Range: 3100-4000).
- **Real-time Monitoring:** Live tracking of CPU, memory, and network usage via Socket.io.
- **Log Streaming:** Real-time access to container logs.
- **Git Integration:** Webhook support for automated deployments.

## 3. User Flows

### 3.1 Authentication

1. User registers/logs in via React Frontend.
2. Backend validates credentials and issues Access/Refresh tokens (JWT).
3. User accesses protected dashboard routes.

### 3.2 Application Deployment

1. User defines a new application (Name, Image, Config).
2. System allocates an available port.
3. Backend instructs Docker to pull image and run container.
4. Container status is updated in database and broadcasted via WebSocket.

## 4. Technical Stack

- **Frontend:** React 18, TypeScript, Redux Toolkit, Tailwind CSS, Vite.
- **Backend:** Node.js 20, Express, TypeScript, Dockerode.
- **Database:** PostgreSQL 15 (TypeORM).
- **Caching/Queue:** Redis.
- **Real-time:** Socket.io.
- **DevOps:** Docker Compose, GitHub Actions, Prometheus/Grafana.

## 5. Database Schema Overview

- **Users:** Authentication and profile data.
- **Apps:** Logical grouping of deployments.
- **Containers:** Docker container mapping and configuration.
- **Deployments:** History of deployment actions.
- **Metrics:** Historical resource usage data.
- **Webhooks:** Git webhook configurations.
- **Logs:** Persistent log storage (optional/fallback).

## 6. Phases

1. **Project Initialization:** Structure, Docker setup, basic config.
2. **Database & Auth:** Schema design, TypeORM, JWT service.
3. **Docker Integration:** DockerService, Container CRUD, Port logic.
4. **Real-time System:** Socket.io setup, Metrics collection.
5. **Frontend Implementation:** React UI, State management, Dashboard.
6. **Monitoring & Logs:** Advanced monitoring stack (Prometheus/ELK).
7. **Deployment:** CI/CD pipelines, Production setup.
