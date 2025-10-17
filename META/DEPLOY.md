# Where2Meet Deployment Guide

Complete guide to deploy Where2Meet to production with your custom domain.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Deployment Options](#deployment-options)
4. [Option 1: PaaS Deployment (Recommended for Beginners)](#option-1-paas-deployment-recommended)
5. [Option 2: VPS Deployment (Full Control)](#option-2-vps-deployment-full-control)
6. [Domain & DNS Configuration](#domain--dns-configuration)
7. [SSL/HTTPS Setup](#sslhttps-setup)
8. [Post-Deployment](#post-deployment)
9. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Architecture Overview

Where2Meet consists of three main components:

1. **Frontend** - Next.js application (React 19 + TypeScript)
2. **Backend API** - FastAPI (Python) with PostgreSQL and Redis
3. **Infrastructure** - PostgreSQL database + Redis cache

```
┌─────────────────┐
│   Your Domain   │
│  where2meet.com │
└────────┬────────┘
         │
    ┌────┴─────┐
    │   CDN    │  (Optional: Cloudflare)
    └────┬─────┘
         │
    ┌────┴──────────────────────────┐
    │                                │
┌───┴────────┐              ┌───────┴─────┐
│  Frontend  │              │   Backend   │
│  (Next.js) │◄────────────►│  (FastAPI)  │
│  Port 3000 │              │  Port 8000  │
└────────────┘              └──────┬──────┘
                                   │
                            ┌──────┴──────┐
                            │             │
                      ┌─────┴─────┐  ┌────┴─────┐
                      │PostgreSQL │  │  Redis   │
                      │  (DB)     │  │ (Cache)  │
                      └───────────┘  └──────────┘
```

---

## Prerequisites

### Required Accounts & Tools

1. **Domain Name** - You mentioned you already have one
2. **Google Maps API Key** - [Get it here](https://console.cloud.google.com/apis/credentials)
   - Enable: Maps JavaScript API, Places API, Geocoding API
3. **Git** - For version control
4. **Node.js 18+** and **pnpm** - For frontend
5. **Python 3.9+** - For backend

### Choose ONE deployment approach:

- **PaaS (Platform-as-a-Service)** - Easier, automated scaling
  - Vercel (frontend) + Render/Railway (backend)
  - Good for: Beginners, quick deployment

- **VPS (Virtual Private Server)** - Full control
  - DigitalOcean, Linode, AWS EC2, Hetzner
  - Good for: Advanced users, cost optimization

---

## Option 1: PaaS Deployment (Recommended)

This option uses Vercel for the frontend and Render/Railway for the backend.

### Step 1: Prepare Your Repository

1. **Create a GitHub repository** (if you haven't already):
```bash
cd /Users/victor/work/where2meet-clientside/where2meet-client
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/where2meet.git
git push -u origin main
```

2. **Create a `.gitignore` in the root**:
```bash
# Add to .gitignore
node_modules/
.next/
.env*
!.env.example
!.env.local.example
*.log
.DS_Store
venv/
__pycache__/
*.pyc
.pytest_cache/
```

### Step 2: Deploy Backend to Render

1. **Go to [render.com](https://render.com)** and sign up

2. **Create a new PostgreSQL database**:
   - Click "New +" → "PostgreSQL"
   - Name: `where2meet-db`
   - Region: Choose closest to your users
   - Plan: Free tier to start
   - Copy the **Internal Database URL** (starts with `postgresql://`)

3. **Create a Redis instance**:
   - Click "New +" → "Redis"
   - Name: `where2meet-redis`
   - Plan: Free tier
   - Copy the **Internal Redis URL**

4. **Create a Web Service for the backend**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `where2meet-api`
     - **Root Directory**: `server/server`
     - **Environment**: `Python 3`
     - **Build Command**:
       ```bash
       pip install -r requirements.txt
       ```
     - **Start Command**:
       ```bash
       alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
       ```
     - **Instance Type**: Free tier

5. **Add Environment Variables** in Render dashboard:
   ```
   DATABASE_URL=<your-render-postgres-url>
   REDIS_URL=<your-render-redis-url>
   SECRET_KEY=<generate-random-secret-key>
   ALGORITHM=HS256
   EVENT_LINK_EXPIRY_HOURS=720
   GOOGLE_MAPS_API_KEY=<your-google-maps-key>
   ENVIRONMENT=production
   DEBUG=false
   ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
   EVENT_TTL_DAYS=30
   SOFT_DELETE_RETENTION_DAYS=7
   RATE_LIMIT_REQUESTS=100
   RATE_LIMIT_WINDOW_SECONDS=60
   ```

   **Generate SECRET_KEY**:
   ```bash
   python3 -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

6. **Deploy** - Render will automatically build and deploy
   - Copy your backend URL (e.g., `https://where2meet-api.onrender.com`)

### Step 3: Deploy Frontend to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign up

2. **Import your GitHub repository**:
   - Click "Add New" → "Project"
   - Import your repository
   - Configure:
     - **Framework Preset**: Next.js
     - **Root Directory**: `./` (keep as root)
     - **Build Command**: `pnpm install && pnpm build`
     - **Output Directory**: `.next`
     - **Install Command**: `pnpm install`

3. **Add Environment Variables**:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your-google-maps-key>
   NEXT_PUBLIC_API_URL=https://where2meet-api.onrender.com
   ```

4. **Deploy** - Vercel will build and deploy automatically

5. **Get your Vercel URL** (e.g., `https://where2meet.vercel.app`)

### Step 4: Update Backend ALLOWED_ORIGINS

Go back to Render and update the backend's `ALLOWED_ORIGINS` environment variable:
```
ALLOWED_ORIGINS=https://where2meet.vercel.app,https://your-domain.com,https://www.your-domain.com
```

### Step 5: Configure Custom Domain

**In Vercel**:
1. Go to Project Settings → Domains
2. Add your domain: `your-domain.com`
3. Add `www.your-domain.com` (optional)
4. Vercel will provide DNS records

**In your domain registrar** (e.g., Namecheap, GoDaddy):
1. Add the DNS records Vercel provides:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

2. Wait for DNS propagation (5-60 minutes)

**Alternative - Use Cloudflare**:
1. Add your domain to Cloudflare (free)
2. Update nameservers at your registrar
3. Add DNS records pointing to Vercel
4. Enable "Proxied" status for CDN benefits

---

## Option 2: VPS Deployment (Full Control)

This option gives you complete control but requires more setup.

### Step 1: Choose and Setup VPS

**Recommended providers**:
- DigitalOcean ($6-12/month)
- Linode ($5-10/month)
- Hetzner ($4-8/month, EU)
- Vultr ($6-12/month)

**Minimum specs**:
- 2 GB RAM
- 1 vCPU
- 50 GB SSD
- Ubuntu 22.04 LTS

### Step 2: Initial Server Setup

1. **SSH into your server**:
```bash
ssh root@YOUR_SERVER_IP
```

2. **Create a new user**:
```bash
adduser where2meet
usermod -aG sudo where2meet
su - where2meet
```

3. **Install required software**:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
sudo npm install -g pnpm

# Install Python 3 and pip
sudo apt install -y python3 python3-pip python3-venv

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

# Install Docker (optional, for easier management)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker where2meet
```

### Step 3: Setup PostgreSQL

```bash
# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

In PostgreSQL prompt:
```sql
CREATE DATABASE where2meet;
CREATE USER where2meet WITH PASSWORD 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE where2meet TO where2meet;
\q
```

### Step 4: Setup Redis

```bash
# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Secure Redis (optional but recommended)
sudo nano /etc/redis/redis.conf
# Add: requirepass YOUR_REDIS_PASSWORD
# Save and exit
sudo systemctl restart redis-server
```

### Step 5: Deploy Backend

```bash
# Clone your repository
cd /home/where2meet
git clone https://github.com/YOUR_USERNAME/where2meet.git
cd where2meet/server/server

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
nano .env
```

Add to `.env`:
```bash
DATABASE_URL=postgresql://where2meet:YOUR_SECURE_PASSWORD@localhost:5432/where2meet
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=YOUR_GENERATED_SECRET_KEY
ALGORITHM=HS256
EVENT_LINK_EXPIRY_HOURS=720
GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_KEY
ENVIRONMENT=production
DEBUG=false
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
EVENT_TTL_DAYS=30
SOFT_DELETE_RETENTION_DAYS=7
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_SECONDS=60
```

```bash
# Run database migrations
alembic upgrade head

# Test the backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
# Press Ctrl+C to stop
```

### Step 6: Setup Backend as a System Service

```bash
sudo nano /etc/systemd/system/where2meet-api.service
```

Add:
```ini
[Unit]
Description=Where2Meet API
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=where2meet
WorkingDirectory=/home/where2meet/where2meet/server/server
Environment="PATH=/home/where2meet/where2meet/server/server/venv/bin"
ExecStart=/home/where2meet/where2meet/server/server/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable where2meet-api
sudo systemctl start where2meet-api
sudo systemctl status where2meet-api
```

### Step 7: Deploy Frontend

```bash
cd /home/where2meet/where2meet

# Create .env.local
nano .env.local
```

Add:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_KEY
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

```bash
# Install dependencies and build
pnpm install
pnpm build

# Test production build
pnpm start
# Press Ctrl+C to stop
```

### Step 8: Setup Frontend as a System Service

```bash
sudo nano /etc/systemd/system/where2meet-web.service
```

Add:
```ini
[Unit]
Description=Where2Meet Frontend
After=network.target

[Service]
Type=simple
User=where2meet
WorkingDirectory=/home/where2meet/where2meet
Environment="PATH=/usr/bin:/usr/local/bin"
Environment="NODE_ENV=production"
ExecStart=/usr/bin/pnpm start
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable where2meet-web
sudo systemctl start where2meet-web
sudo systemctl status where2meet-web
```

### Step 9: Configure Nginx as Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/where2meet
```

Add:
```nginx
# Backend API
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/where2meet /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 10: DNS Configuration

In your domain registrar, add these DNS records:

```
Type: A
Name: @
Value: YOUR_SERVER_IP

Type: A
Name: www
Value: YOUR_SERVER_IP

Type: A
Name: api
Value: YOUR_SERVER_IP
```

### Step 11: Setup SSL with Let's Encrypt

```bash
# Get SSL certificates
sudo certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com

# Auto-renewal
sudo systemctl status certbot.timer
```

Test renewal:
```bash
sudo certbot renew --dry-run
```

---

## Domain & DNS Configuration

### DNS Records Summary

For **PaaS deployment** (Vercel + Render):
```
Type: A
Name: @
Value: 76.76.21.21 (Vercel IP)

Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: CNAME
Name: api
Value: where2meet-api.onrender.com
```

For **VPS deployment**:
```
Type: A
Name: @
Value: YOUR_SERVER_IP

Type: A
Name: www
Value: YOUR_SERVER_IP

Type: A
Name: api
Value: YOUR_SERVER_IP
```

### Cloudflare Setup (Optional but Recommended)

Benefits: Free SSL, CDN, DDoS protection, caching

1. Sign up at [cloudflare.com](https://cloudflare.com)
2. Add your domain
3. Update nameservers at your registrar
4. Configure DNS records as above
5. Enable "Proxied" status (orange cloud)
6. SSL/TLS mode: "Full (strict)"

---

## SSL/HTTPS Setup

### For PaaS (Vercel)
✅ Automatic - Vercel provides free SSL

### For VPS (Nginx)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificates
sudo certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com

# Follow prompts, select redirect HTTP to HTTPS
```

### For Cloudflare
1. SSL/TLS → Overview → Set to "Full (strict)"
2. SSL/TLS → Edge Certificates → Always Use HTTPS: ON

---

## Post-Deployment

### 1. Test Your Deployment

```bash
# Test backend API
curl https://api.your-domain.com/health
# Should return: {"status":"healthy"}

# Test frontend
curl -I https://your-domain.com
# Should return: HTTP/2 200
```

### 2. Setup Google Maps API Restrictions

In [Google Cloud Console](https://console.cloud.google.com/):

1. Go to Credentials
2. Edit your API key
3. Add restrictions:
   - **Application restrictions**: HTTP referrers
   - **Website restrictions**:
     ```
     https://your-domain.com/*
     https://www.your-domain.com/*
     ```
4. **API restrictions**:
   - Maps JavaScript API
   - Places API
   - Geocoding API

### 3. Setup Monitoring

**For VPS**:
```bash
# Install monitoring tools
sudo apt install htop

# Check service status
sudo systemctl status where2meet-api
sudo systemctl status where2meet-web
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status redis

# View logs
sudo journalctl -u where2meet-api -f
sudo journalctl -u where2meet-web -f
```

**For PaaS**:
- Use Render/Vercel built-in monitoring
- Enable error tracking (Sentry)

### 4. Setup Backups

**Database backups** (VPS):
```bash
# Create backup script
nano ~/backup-db.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/home/where2meet/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U where2meet where2meet > $BACKUP_DIR/where2meet_$DATE.sql
find $BACKUP_DIR -mtime +7 -delete
```

```bash
chmod +x ~/backup-db.sh

# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /home/where2meet/backup-db.sh
```

**For PaaS**: Render provides automatic backups for paid plans

---

## Monitoring & Maintenance

### Health Checks

Add to your monitoring (UptimeRobot, Pingdom):
- Frontend: `https://your-domain.com`
- Backend API: `https://api.your-domain.com/health`

### Regular Maintenance

**Weekly**:
- Check application logs
- Monitor disk space usage
- Review error rates

**Monthly**:
- Update dependencies
- Review database size
- Test backups

**VPS Updates**:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Update backend dependencies
cd /home/where2meet/where2meet/server/server
source venv/bin/activate
pip install -r requirements.txt --upgrade
sudo systemctl restart where2meet-api

# Update frontend
cd /home/where2meet/where2meet
pnpm update
pnpm build
sudo systemctl restart where2meet-web
```

### Logs

**VPS**:
```bash
# Backend logs
sudo journalctl -u where2meet-api -n 100

# Frontend logs
sudo journalctl -u where2meet-web -n 100

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

**PaaS**: Check Render/Vercel dashboards

---

## Troubleshooting

### Common Issues

**1. Backend not connecting to database**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U where2meet -d where2meet -h localhost
```

**2. Frontend can't reach backend**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings in backend `.env`
- Verify `ALLOWED_ORIGINS` includes your domain

**3. SSL certificate issues**
```bash
# Renew certificates
sudo certbot renew --nginx
```

**4. Out of memory**
```bash
# Check memory usage
free -h

# Restart services
sudo systemctl restart where2meet-api
sudo systemctl restart where2meet-web
```

**5. Domain not resolving**
```bash
# Check DNS propagation
nslookup your-domain.com
dig your-domain.com

# Wait up to 48 hours for full propagation
```

---

## Cost Estimate

### PaaS (Recommended for starters)
- **Vercel**: Free tier (hobby projects)
- **Render**:
  - Free tier: $0 (with limitations)
  - Starter: $7/month (PostgreSQL) + $7/month (Web Service) = $14/month
- **Domain**: $10-15/year
- **Total**: ~$14-20/month

### VPS (Cost-effective at scale)
- **VPS**: $5-12/month
- **Domain**: $10-15/year
- **Total**: ~$5-15/month

### At Scale (>1000 users)
- Consider upgrading VPS or using managed services
- Add CDN (Cloudflare is free)
- Database managed service: $15-50/month

---

## Security Checklist

- [ ] Use strong, unique passwords
- [ ] Enable HTTPS/SSL
- [ ] Restrict Google Maps API key
- [ ] Set up firewall (VPS: ufw)
- [ ] Regular backups configured
- [ ] Keep software updated
- [ ] Monitor access logs
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Set up fail2ban (VPS)

---

## Quick Start Commands

### PaaS Deployment
```bash
# 1. Push to GitHub
git add .
git commit -m "Deploy to production"
git push origin main

# 2. Deploy happens automatically on Vercel/Render
```

### VPS Deployment
```bash
# Quick update after changes
cd /home/where2meet/where2meet
git pull
cd server/server && source venv/bin/activate && pip install -r requirements.txt
cd ../.. && pnpm install && pnpm build
sudo systemctl restart where2meet-api where2meet-web
```

---

## Support & Resources

- **Next.js Docs**: https://nextjs.org/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **Vercel Deployment**: https://vercel.com/docs
- **Render Deployment**: https://render.com/docs
- **Let's Encrypt**: https://letsencrypt.org/
- **Cloudflare**: https://www.cloudflare.com/

---

## Next Steps

1. Choose your deployment method (PaaS recommended for beginners)
2. Follow the corresponding section step-by-step
3. Configure your domain DNS
4. Setup SSL certificates
5. Test thoroughly
6. Set up monitoring and backups
7. Launch! 🚀

Good luck with your deployment! Your Where2Meet application will be live soon.

---

## Using Cloudflare with Custom Domain (Advanced Setup)

Since you mentioned you have a domain on Cloudflare, here's how to properly configure it with your Where2Meet deployment:

### Option A: Cloudflare + Vercel (Recommended for PaaS)

**Step 1: Configure Vercel with Cloudflare**

1. **In Vercel Dashboard**:
   - Go to your project → Settings → Domains
   - Add your domain: `your-domain.com`
   - Add `www.your-domain.com` (optional)
   - Vercel will show you DNS records to add

2. **In Cloudflare Dashboard**:
   - Go to DNS → Records
   - Add these records:
     ```
     Type: A
     Name: @
     Value: 76.76.21.21
     Proxy status: Proxied (orange cloud) ✅
     
     Type: CNAME
     Name: www
     Value: cname.vercel-dns.com
     Proxy status: Proxied (orange cloud) ✅
     ```

3. **Configure SSL/TLS**:
   - Go to SSL/TLS → Overview
   - Set encryption mode to: **Full (strict)**
   - Go to SSL/TLS → Edge Certificates
   - Enable: "Always Use HTTPS"
   - Enable: "HTTP Strict Transport Security (HSTS)"

4. **Configure Caching** (Optional):
   - Go to Caching → Configuration
   - Set Browser Cache TTL to: 4 hours
   - Enable: "Auto Minify" (HTML, CSS, JS)

**Step 2: Configure Backend API Subdomain**

1. **In Render Dashboard**:
   - Note your backend URL: `https://where2meet-api.onrender.com`

2. **In Cloudflare DNS**:
   ```
   Type: CNAME
   Name: api
   Value: where2meet-api.onrender.com
   Proxy status: Proxied (orange cloud) ✅
   ```

3. **Update Backend Environment Variables**:
   ```
   ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com,https://api.your-domain.com
   ```

4. **Update Frontend Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://api.your-domain.com
   ```

### Option B: Cloudflare + VPS (Full Control)

**Step 1: Configure Cloudflare for VPS**

1. **In Cloudflare DNS**:
   ```
   Type: A
   Name: @
   Value: YOUR_SERVER_IP
   Proxy status: Proxied (orange cloud) ✅
   
   Type: A
   Name: www
   Value: YOUR_SERVER_IP
   Proxy status: Proxied (orange cloud) ✅
   
   Type: A
   Name: api
   Value: YOUR_SERVER_IP
   Proxy status: Proxied (orange cloud) ✅
   ```

2. **Configure SSL/TLS**:
   - Set encryption mode to: **Full (strict)**
   - Enable: "Always Use HTTPS"
   - Enable: "HTTP Strict Transport Security (HSTS)"

3. **Configure Page Rules** (Optional):
   - Go to Rules → Page Rules
   - Create rule: `your-domain.com/*`
   - Settings: Cache Level = Cache Everything, Edge Cache TTL = 1 month

**Step 2: Configure Nginx for Cloudflare**

Update your Nginx configuration to work with Cloudflare:

```bash
sudo nano /etc/nginx/sites-available/where2meet
```

```nginx
# Get real IP from Cloudflare
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 104.16.0.0/13;
set_real_ip_from 104.24.0.0/14;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 131.0.72.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 2400:cb00::/32;
set_real_ip_from 2606:4700::/32;
set_real_ip_from 2803:f800::/32;
set_real_ip_from 2405:b500::/32;
set_real_ip_from 2405:8100::/32;
set_real_ip_from 2a06:98c0::/29;
set_real_ip_from 2c0f:f248::/32;
real_ip_header CF-Connecting-IP;

# Backend API
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;
    }
}

# Frontend
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;
    }
}
```

### Cloudflare-Specific Optimizations

**Step 1: Enable Cloudflare Features**

1. **Speed Optimizations**:
   - Go to Speed → Optimization
   - Enable: "Auto Minify" (HTML, CSS, JS)
   - Enable: "Brotli Compression"
   - Enable: "Rocket Loader" (optional)

2. **Security Enhancements**:
   - Go to Security → Settings
   - Set Security Level to: "Medium"
   - Enable: "Browser Integrity Check"
   - Go to Security → WAF
   - Enable: "Web Application Firewall"

3. **Caching Configuration**:
   - Go to Caching → Configuration
   - Set Caching Level to: "Standard"
   - Set Browser Cache TTL to: 4 hours
   - Go to Caching → Page Rules
   - Add rule: `your-domain.com/api/*` → Cache Level: Bypass

**Step 2: Configure Workers (Optional)**

For advanced routing, you can use Cloudflare Workers:

```javascript
// Worker script for API routing
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Route API calls to backend
  if (url.pathname.startsWith('/api/')) {
    const backendUrl = 'https://where2meet-api.onrender.com' + url.pathname + url.search
    return fetch(backendUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body
    })
  }
  
  // Route everything else to frontend
  return fetch('https://where2meet.vercel.app' + url.pathname + url.search, {
    method: request.method,
    headers: request.headers,
    body: request.body
  })
}
```

### Testing Your Cloudflare Setup

**Step 1: Verify DNS Propagation**

```bash
# Check if your domain resolves correctly
nslookup your-domain.com
dig your-domain.com

# Check Cloudflare IPs
curl -H "Host: your-domain.com" http://104.21.0.0
```

**Step 2: Test SSL/TLS**

```bash
# Test SSL configuration
curl -I https://your-domain.com
curl -I https://api.your-domain.com/health

# Check SSL rating
# Visit: https://www.ssllabs.com/ssltest/
```

**Step 3: Test Performance**

```bash
# Test from different locations
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com

# Create curl-format.txt:
echo "     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n" > curl-format.txt
```

### Cloudflare Analytics & Monitoring

**Step 1: Enable Analytics**

1. Go to Analytics → Web Analytics
2. Enable: "Web Analytics" for your domain
3. Go to Analytics → Security
4. Monitor: "Security Events" and "Bot Score"

**Step 2: Set Up Alerts**

1. Go to Notifications → Alerting
2. Create alerts for:
   - High error rate
   - DDoS attacks
   - SSL certificate issues
   - High bandwidth usage

### Troubleshooting Cloudflare Issues

**Common Issues:**

1. **"Too Many Redirects" Error**:
   - Check SSL/TLS mode (should be "Full" or "Full (strict)")
   - Verify "Always Use HTTPS" is enabled
   - Check for conflicting redirects in Nginx

2. **API Calls Not Working**:
   - Verify CORS settings in backend
   - Check `ALLOWED_ORIGINS` includes your domain
   - Ensure API subdomain is properly configured

3. **Slow Loading**:
   - Check caching rules
   - Verify "Auto Minify" is enabled
   - Consider enabling "Rocket Loader"

4. **SSL Certificate Issues**:
   - Ensure "Full (strict)" mode
   - Check origin server SSL certificate
   - Verify DNS records are correct

### Final Configuration Checklist

- [ ] Domain added to Cloudflare
- [ ] Nameservers updated at registrar
- [ ] DNS records configured (A, CNAME)
- [ ] SSL/TLS mode set to "Full (strict)"
- [ ] "Always Use HTTPS" enabled
- [ ] Caching rules configured
- [ ] Security settings enabled
- [ ] Backend CORS configured
- [ ] Frontend API URL updated
- [ ] SSL certificate valid
- [ ] Performance optimizations enabled
- [ ] Monitoring and alerts set up

Your Where2Meet application is now fully configured with Cloudflare! 🚀
