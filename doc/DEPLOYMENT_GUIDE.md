# Adaptive CBC — Live Deployment Guide (Step-by-Step)

> **Server:** 157.173.123.156  
> **Domain:** adaptivecbc.co.ke  
> **Panel:** Aapanel  
> **Stack:** Docker Compose  

---

## What you'll do (overview)

1. SSH into the VPS and install Docker
2. Clone the project
3. Create 4 environment files with your secrets
4. Place your GCP credentials file
5. Run `docker compose` to build and start everything
6. Configure DNS at your domain registrar
7. Add the site in Aapanel, get SSL, set up reverse proxy

---

## Step 1 — Connect and install Docker

```bash
ssh root@157.173.123.156
```

```bash
apt update && apt upgrade -y
apt install -y curl wget git

curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install -y docker-compose-plugin

systemctl enable --now docker
docker --version
docker compose version
```

---

## Step 2 — Clone the repository

```bash
mkdir -p /opt/adaptive-learning
cd /opt/adaptive-learning
git clone https://github.com/<your-org>/adaptive-learning.git production
cd production
```

> **Important:** If the repo is private, run this first:
> ```bash
> ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N ""
> cat ~/.ssh/deploy_key.pub
> ```
> Then add the public key to your repo's **Settings → Deploy Keys**.

---

## Step 3 — Create environment files

### 3a. Backend

```bash
cp backend/.env.example backend/.env.production
nano backend/.env.production
```

Make sure these values are set (change secrets):

```ini
NODE_ENV=production
PORT=3002
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=cbc_user
DATABASE_PASSWORD=cbc_secure_pass_2024
DATABASE_NAME=adaptive_cbc
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=<run: openssl rand -base64 64 and paste here>
JWT_EXPIRES_IN=7d
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=adaptive-cbc-files
MINIO_PUBLIC_ENDPOINT=157.173.123.156:9003
AI_SERVICE_URL=http://ai-service:8002
OCR_SERVICE_URL=http://ocr-service:8003
FRONTEND_URL=https://adaptivecbc.co.ke
CORS_ORIGIN=https://adaptivecbc.co.ke,https://api.adaptivecbc.co.ke
OPENROUTER_API_KEY=<your-actual-openrouter-key>
GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/gcp-service-key.json
```

### 3b. Frontend

```bash
nano frontend/.env.production
```

```ini
NEXT_PUBLIC_API_URL=https://api.adaptivecbc.co.ke
NEXT_PUBLIC_WS_URL=wss://api.adaptivecbc.co.ke
```

### 3c. AI Service

```bash
cp ai-service/.env.example ai-service/.env.production
nano ai-service/.env.production
```

```ini
PORT=8002
OPENROUTER_API_KEY=<your-actual-openrouter-key>
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
LOG_LEVEL=info
```

### 3d. OCR Service

```bash
cp services/ocr-service/.env.example services/ocr-service/.env.production
nano services/ocr-service/.env.production
```

```ini
GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/gcp-service-key.json
OPENROUTER_API_KEY=<your-actual-openrouter-key>
OPENROUTER_MODEL=google/gemini-2.0-flash-001
REDIS_URL=redis://redis:6379/0
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=ocr-documents
MINIO_SECURE=false
MAX_PAGES=30
OCR_DPI=300
```

---

## Step 4 — Place GCP credentials

```bash
mkdir -p backend/credentials
```

Upload your `gcp-service-key.json` file to `backend/credentials/`. You can do this from your local machine:

```bash
# From YOUR local terminal (not the VPS)
scp /path/to/your/gcp-service-key.json root@157.173.123.156:/opt/adaptive-learning/production/backend/credentials/gcp-service-key.json
```

---

## Step 5 — Build and start everything

```bash
cd /opt/adaptive-learning/production
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

This will take 5-10 minutes the first time (downloading images, installing npm packages, compiling TypeScript).

### Check that everything is running

```bash
docker compose -f docker-compose.prod.yml ps
```

You should see all 8 services with `Up` status.

### Test the services directly (before adding the domain)

```bash
# Backend health check
curl http://localhost:3002/api/v1/health

# Via the internal Nginx
curl http://localhost:8100/api/v1/health

# Frontend
curl -I http://localhost:8100
```

If any service is not running, check its logs:

```bash
docker logs adaptive-learning-backend --tail 50
docker logs adaptive-learning-nginx --tail 50
```

---

## Step 6 — Configure DNS

Go to your domain registrar's DNS settings and add these **A records**:

| Type | Name              | Value              |
|------|-------------------|--------------------|
| A    | `@`               | `157.173.123.156`  |
| A    | `www`             | `157.173.123.156`  |
| A    | `api`             | `157.173.123.156`  |
| A    | `staging`         | `157.173.123.156`  |

DNS propagation can take up to 24 hours but usually completes within 5-30 minutes.

---

## Step 7 — Configure Aapanel (the most important part)

### 7a. Add the main site

1. Log into Aapanel
2. Go to **Website** → **Add Site**
3. In the **Domain** field, enter: `adaptivecbc.co.ke`
4. **Create FTP:** No
5. **Database:** No (we're using PostgreSQL inside Docker)
6. **PHP Version:** None
7. Click **Confirm**

### 7b. Add the API subdomain

Same process for `api.adaptivecbc.co.ke`:
1. **Website** → **Add Site**
2. Domain: `api.adaptivecbc.co.ke`
3. FTP: No, Database: No, PHP: None
4. **Confirm**

### 7c. (Optional) Add staging subdomain

1. **Website** → **Add Site**
2. Domain: `staging.adaptivecbc.co.ke`
3. FTP: No, Database: No, PHP: None
4. **Confirm**

### 7d. Get SSL certificates

For each site you added:
1. Click on the site name
2. Go to **SSL** tab
3. Select **Let's Encrypt**
4. Check **Force HTTPS**
5. Click **Apply**

Do this for:
- `adaptivecbc.co.ke`
- `api.adaptivecbc.co.ke`
- `staging.adaptivecbc.co.ke`

### 7e. Set up reverse proxy for the main site

1. Click on `adaptivecbc.co.ke` in the website list
2. Go to **Reverse Proxy** tab
3. Click **Add Reverse Proxy**
4. **Proxy Name:** `adaptive-learning`
5. **Target URL:** `http://127.0.0.1:8100`
6. **Send Domain:** `$host`
7. Click **Confirm**

Now click **Advanced** (or **Configuration**) and replace the content with:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_connect_timeout 10s;
proxy_read_timeout 300s;
proxy_send_timeout 300s;
client_max_body_size 100m;
```

### 7f. Set up reverse proxy for the API subdomain

1. Click on `api.adaptivecbc.co.ke`
2. **Reverse Proxy** → **Add Reverse Proxy**
3. **Name:** `adaptive-api`
4. **Target URL:** `http://127.0.0.1:3002` (direct to backend, bypasses docker nginx)
5. **Send Domain:** `$host`
6. **Confirm**
7. Add the same advanced config as above (from step 7e)

### 7g. (Optional) Set up reverse proxy for staging

1. Click on `staging.adaptivecbc.co.ke`
2. **Reverse Proxy** → **Add Reverse Proxy**
3. **Name:** `adaptive-staging`
4. **Target URL:** `http://127.0.0.1:8200`
5. **Send Domain:** `$host`
6. **Confirm**
7. Add the same advanced config

---

## Step 8 — Verify the deployment

From your browser:

| URL                                    | Should show                    |
|----------------------------------------|--------------------------------|
| `https://adaptivecbc.co.ke`            | The frontend (login page)      |
| `https://api.adaptivecbc.co.ke/api/v1/health` | `{ "status": "ok" }`   |
| `https://staging.adaptivecbc.co.ke`    | Staging frontend (if set up)   |

From your local terminal:

```bash
curl -I https://adaptivecbc.co.ke
curl https://api.adaptivecbc.co.ke/api/v1/health
```

---

## Step 9 — Run database migrations

```bash
docker exec adaptive-learning-backend npm run migration:run
```

---

## Daily operations

| Task | Command |
|------|---------|
| View logs | `docker compose -f docker-compose.prod.yml logs -f --tail 100` |
| Restart backend | `docker compose -f docker-compose.prod.yml restart backend` |
| Rebuild and restart one service | `docker compose -f docker-compose.prod.yml up -d --build backend` |
| Stop everything | `docker compose -f docker-compose.prod.yml down` |
| Start everything | `docker compose -f docker-compose.prod.yml up -d` |
| Full rebuild | `docker compose -f docker-compose.prod.yml build --no-cache && docker compose -f docker-compose.prod.yml up -d` |
| Check Postgres | `docker exec -it adaptive-learning-postgres psql -U cbc_user -d adaptive_cbc` |
| Check Redis | `docker exec -it adaptive-learning-redis redis-cli ping` |

---

## Troubleshooting

### 502 Bad Gateway

```bash
# 1. Check if the backend is actually running
curl http://localhost:3002/api/v1/health

# 2. Check Docker Nginx logs
docker logs adaptive-learning-nginx --tail 20

# 3. Check backend logs
docker logs adaptive-learning-backend --tail 20

# 4. Restart both
docker compose -f docker-compose.prod.yml restart backend nginx
```

### Container exits immediately

```bash
docker logs adaptive-learning-backend --tail 50
```

Common causes:
- Missing `.env.production` file
- PostgreSQL not ready yet (wait 30s and check again)
- Port conflict (run `ss -tulpn | grep 5434` to check)

### Domain not loading

```bash
# Check DNS
dig adaptivecbc.co.ke
dig api.adaptivecbc.co.ke

# Check Aapanel logs
# Go to Website → [site] → click the logs tab
```

### Cannot connect to database

```bash
docker compose -f docker-compose.prod.yml ps postgres
docker logs adaptive-learning-postgres --tail 20
docker compose -f docker-compose.prod.yml restart postgres backend
```

---

## Port reference (for your records)

| Service     | Host Port | Container Port | Notes              |
|-------------|-----------|----------------|---------------------|
| PostgreSQL  | 5434      | 5432           |                     |
| Redis       | 6382      | 6379           | 6380,6381 were taken |
| MinIO API   | 9003      | 9000           |                     |
| MinIO UI    | 9004      | 9001           |                     |
| Backend     | 3002      | 3002           |                     |
| Frontend    | 3003      | 3000           |                     |
| AI Service  | 8002      | 8002           |                     |
| OCR Service | 8003      | 8003           |                     |
| Nginx (int) | 8100      | 80             | Aapanel proxies here |
| Nginx (stg) | 8200      | 80             | Staging only        |

---

## Files on the VPS (for reference)

```
/opt/adaptive-learning/production/
├── docker-compose.prod.yml       # <-- you run this
├── docker-compose.staging.yml    # <-- for staging
├── backend/
│   ├── Dockerfile.prod           # already in the repo
│   ├── .env.production           # you created this
│   └── credentials/
│       └── gcp-service-key.json  # you uploaded this
├── frontend/
│   ├── Dockerfile.prod           # already in the repo
│   └── .env.production           # you created this
├── ai-service/
│   ├── Dockerfile.prod           # already in the repo
│   └── .env.production           # you created this
├── services/ocr-service/
│   ├── Dockerfile                # already exists
│   └── .env.production           # you created this
├── nginx/
│   ├── nginx.conf
│   └── conf.d/
│       └── adaptive-cbc.conf
└── .github/workflows/
    └── deploy.yml                # CI/CD (optional)
```
