# Base image
FROM node:20-alpine AS base

# Development stage
FROM base AS development
WORKDIR /app
COPY package.json ./
RUN npm install -g pnpm && pnpm install
COPY . .
CMD ["pnpm", "dev"]

# Build stage
FROM base AS builder
WORKDIR /app
COPY package.json ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build

# Production stage
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
