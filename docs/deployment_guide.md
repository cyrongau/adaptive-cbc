# Adaptive CBC Platform — Deployment Guide

> **Keep this document up to date whenever new services, packages, or configuration changes are introduced.**

---

## Table of Contents

1. [Stack Overview](#1-stack-overview)
2. [First-Time Setup](#2-first-time-setup)
3. [Everyday Development Commands](#3-everyday-development-commands)
4. [Deploying Specific Changes](#4-deploying-specific-changes)
   - [Frontend-only changes](#41-frontend-only-changes)
   - [Backend-only changes](#42-backend-only-changes)
   - [After installing a new npm package](#43-after-installing-a-new-npm-package-critical)
   - [NGINX config changes](#44-nginx-config-changes)
   - [OCR / AI service changes](#45-ocr--ai-service-python-changes)
   - [Changes to multiple services](#46-changes-to-multiple-services)
   - [Database / migration changes](#47-database--migration-changes)
   - [Environment variable changes](#48-environment-variable-changes)
5. [Viewing Logs](#5-viewing-logs)
6. [Checking Service Health](#6-checking-service-health)
7. [Ports Reference](#7-ports-reference)
8. [Known Issues & Permanent Fixes](#8-known-issues--permanent-fixes)
   - [NGINX IPv6 / stale-IP 502 errors](#81-nginx-ipv6--stale-ip-502-errors-after-rebuild)
   - [Cannot find module after npm install](#82-cannot-find-module-after-npm-install)
9. [Nuclear Reset (full wipe)](#9-nuclear-reset-full-wipe)

---

## 1. Stack Overview

| Service         | Technology             | Internal Port | Host Port |
|-----------------|------------------------|---------------|-----------|
| `postgres`      | PostgreSQL 15          | 5432          | 5434      |
| `redis`         | Redis 7                | 6379          | 6381      |
| `minio`         | MinIO (S3-compatible)  | 9000 / 9001   | 9003 / 9004 |
| `backend`       | NestJS (Node 20)       | 3002          | 3002      |
| `frontend`      | Next.js (Node 20)      | 3000          | 3003      |
| `ai-service`    | Node.js                | 8002          | 8002      |
| `ocr-service`   | Python FastAPI + Celery| 8003          | 8003      |
| `nginx`         | nginx:alpine           | 80            | 8100      |

All containers share the `adaptive-network` bridge network.  
The single public entry-point is **`http://localhost:8100`**.

---

## 2. First-Time Setup

```powershell
# Clone repo and enter the project directory
cd c:\dev\adaptive-learning

# Copy environment files (do this once)
Copy-Item backend\.env.example backend\.env
Copy-Item ai-service\.env.example ai-service\.env
Copy-Item services\ocr-service\.env.example services\ocr-service\.env

# Build all images and start every service
docker compose up -d --build

# Verify all containers are running
docker compose ps
```

---

## 3. Everyday Development Commands

```powershell
# Start all services (no rebuild)
docker compose up -d

# Stop all services (containers kept, data volumes preserved)
docker compose stop

# Stop and remove containers (volumes preserved)
docker compose down

# Restart a single service without rebuild
docker compose restart backend
docker compose restart frontend
docker compose restart nginx
```

---

## 4. Deploying Specific Changes

### 4.1 Frontend-only changes

Source code is bind-mounted (`./frontend:/app`), so Next.js hot-reloads automatically in development.
No command is needed for most code changes.

If the dev server gets stuck or you changed `next.config.js`:

```powershell
docker compose restart frontend
```

If you changed `package.json` or installed a new package — see [§4.3](#43-after-installing-a-new-npm-package-critical).

---

### 4.2 Backend-only changes

Source code is bind-mounted and `ts-node-dev` hot-reloads automatically.
No command is needed for most code changes.

If the server gets stuck or you changed a bootstrap file (`main.ts`, `app.module.ts`):

```powershell
docker compose restart backend
```

If you changed `package.json` or installed a new package — see [§4.3](#43-after-installing-a-new-npm-package-critical).

---

### 4.3 After installing a new npm package (CRITICAL)

> **⚠️ Never just `docker compose restart` after an `npm install` — this reuses the stale anonymous `node_modules` volume and the new package will not be found.**

The Docker container's `/app/node_modules` lives in an **anonymous Docker volume** created when the container was first started. Running `npm install` on the host only updates the host directory — the container volume is unaffected.

**Correct procedure for the backend:**

```powershell
# 1. Install the package on the host (updates package.json + package-lock.json)
npm install <package-name>            # from inside backend\

# 2. Remove the running container — this destroys its stale anonymous volume
docker compose rm -f backend

# 3. Rebuild the image (runs npm install inside the new image layer)
#    and start a fresh container with a clean node_modules volume
docker compose up -d --build backend nginx
```

**Correct procedure for the frontend:**

```powershell
npm install <package-name>            # from inside frontend\

docker compose rm -f frontend
docker compose up -d --build frontend nginx
```

**Why this happens:**  
`docker-compose.yml` declares `- /app/node_modules` (an anonymous volume) to prevent the bind-mounted host directory from overwriting the container's compiled modules. This volume is only populated from the image on first creation. Removing the container forces Docker to create a new volume from the freshly-built image.

---

### 4.4 NGINX config changes

NGINX config is bind-mounted (`./nginx:/etc/nginx:ro`), so the file on disk is immediately visible inside the container. However, NGINX must reload its config to pick up changes.

```powershell
# Validate config syntax first
docker exec adaptive-learning-nginx nginx -t

# If syntax is OK, reload (zero-downtime, no connection drops)
docker exec adaptive-learning-nginx nginx -s reload

# Alternatively, restart the container (brief downtime)
docker compose restart nginx
```

---

### 4.5 OCR / AI service (Python) changes

Python source is bind-mounted. FastAPI with `--reload` picks up changes automatically.

If you changed `requirements.txt` or `pyproject.toml`:

```powershell
docker compose rm -f ocr-service
docker compose up -d --build ocr-service
```

---

### 4.6 Changes to multiple services

```powershell
# Rebuild and restart only the changed services
docker compose up -d --build backend frontend

# Rebuild everything (slowest, use when in doubt)
docker compose up -d --build
```

---

### 4.7 Database / migration changes

The backend uses TypeORM with `synchronize: true` in development — schema changes are applied automatically on startup. No manual migration command is needed during development.

If you need to run migrations manually (production):

```powershell
docker exec adaptive-learning-backend npm run migration:generate -- -n MigrationName
docker exec adaptive-learning-backend npm run migration:run
```

To inspect the database directly:

```powershell
# Connect via psql inside the postgres container
docker exec -it adaptive-learning-postgres psql -U cbc_user -d adaptive_cbc

# Or connect from host using any PostgreSQL client on:
#   Host: localhost  Port: 5434  User: cbc_user  DB: adaptive_cbc
```

---

### 4.8 Environment variable changes

Environment variables are set in `docker-compose.yml` (for container-level vars) and in `.env` files (read by NestJS `ConfigModule` / Python `pydantic-settings`).

After any change to `.env` or `docker-compose.yml`:

```powershell
# Variables in docker-compose.yml env: block → must recreate the container
docker compose up -d --force-recreate backend

# Variables only in .env (read at runtime by the app) → restart is enough
docker compose restart backend
```

---

## 5. Viewing Logs

```powershell
# Follow live logs for a service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx
docker compose logs -f ocr-service

# Last N lines (no follow)
docker logs adaptive-learning-backend --tail 50
docker logs adaptive-learning-nginx --tail 30

# All services at once
docker compose logs -f
```

---

## 6. Checking Service Health

```powershell
# Show status of all containers
docker compose ps

# Check if backend API is responding
curl http://localhost:3002/api/v1/health          # direct
curl http://localhost:8100/api/v1/health          # via nginx

# Check if frontend is responding
curl http://localhost:3003                         # direct
curl http://localhost:8100                         # via nginx

# Check MinIO console
# Open http://localhost:9004  (user: minioadmin  pass: minioadmin123)

# Resolve hostnames from inside NGINX (verify IPv4 resolution)
docker exec adaptive-learning-nginx getent hosts backend
docker exec adaptive-learning-nginx getent hosts frontend
```

---

## 7. Ports Reference

| URL | What it reaches |
|-----|-----------------|
| `http://localhost:8100` | NGINX reverse proxy (main entry point) |
| `http://localhost:8100/api/v1/...` | Backend API (via NGINX) |
| `http://localhost:8100/ai/...` | AI service (via NGINX) |
| `http://localhost:8100/ocr/...` | OCR service (via NGINX) |
| `http://localhost:3002` | Backend API (direct, bypass NGINX) |
| `http://localhost:3003` | Frontend (direct, bypass NGINX) |
| `http://localhost:8002` | AI service (direct) |
| `http://localhost:8003` | OCR service (direct) |
| `http://localhost:9003` | MinIO S3 API |
| `http://localhost:9004` | MinIO web console |
| `localhost:5434` | PostgreSQL |
| `localhost:6381` | Redis |

---

## 8. Known Issues & Permanent Fixes

### 8.1 NGINX IPv6 / stale-IP 502 errors after rebuild

**Symptom:** After running `docker compose up -d --build`, all API calls return 502. NGINX logs show `connect() failed (111: Connection refused)` pointing to the backend IP. Login is impossible.

**Root cause:** NGINX resolves Docker service hostnames (e.g. `backend`) **once at startup** and caches the result indefinitely. When a container is rebuilt it gets a new IP address. NGINX keeps sending traffic to the old (now dead) IP. Additionally, Docker's internal DNS returns both A (IPv4) and AAAA (IPv6) records; NGINX may pick the IPv6 address which the Node.js backend doesn't bind to.

**Permanent fix applied in `nginx/conf.d/adaptive-cbc.conf`:**

```nginx
# Force re-resolution every 10s, IPv4 only
resolver 127.0.0.11 valid=10s ipv6=off;

# Use variables to force runtime DNS lookup on every request
location /api/ {
    set $backend_upstream http://backend:3002;
    proxy_pass $backend_upstream;
    ...
}
```

The `resolver` directive points to Docker's embedded DNS (`127.0.0.11`, always present on any bridge network). Using `set $variable` syntax forces NGINX to resolve through the resolver on every request rather than caching at config-load time. `ipv6=off` prevents IPv6 addresses from ever being returned.

**If you still get 502 after this fix is in place:**

```powershell
# Check what the backend is actually doing
docker logs adaptive-learning-backend --tail 30

# Check NGINX error log
docker logs adaptive-learning-nginx --tail 20

# Verify NGINX is resolving to an IPv4 address
docker exec adaptive-learning-nginx getent hosts backend

# Force NGINX to re-read config
docker exec adaptive-learning-nginx nginx -s reload
```

---

### 8.2 Cannot find module after `npm install`

**Symptom:** Backend or frontend crashes with `Error: Cannot find module '<package>'` immediately after installing a new package locally and restarting.

**Root cause:** The container's `/app/node_modules` is stored in an anonymous Docker volume created from the image at the time the container was first started. Packages installed on the host (`npm install`) are not reflected in this volume. Restarting the container reuses the same stale volume.

**Fix:**

```powershell
# For the backend
docker compose rm -f backend
docker compose up -d --build backend nginx

# For the frontend
docker compose rm -f frontend
docker compose up -d --build frontend nginx
```

`docker compose rm -f` removes the container **and its anonymous volumes**, so the next `up --build` creates a clean volume from the freshly-built image that includes the new package.

---

## 9. Nuclear Reset (full wipe)

Use this only when everything is broken and you need a clean slate. **This deletes all database data, Redis data, and MinIO data.**

```powershell
# Stop and remove all containers AND their named volumes
docker compose down -v

# Remove all dangling images to free disk space (optional)
docker image prune -f

# Start fresh — rebuilds all images, creates fresh volumes
docker compose up -d --build
```

> **⚠️ `down -v` will delete the PostgreSQL database, Redis cache, and MinIO object storage. Only use this if you are prepared to re-seed the database.**
