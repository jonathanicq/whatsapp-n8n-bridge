# lightWaha - Deployment Guide

## 🎯 Deployment to 192.168.0.116 on Port 4000

This guide covers deploying the lightWaha application to your production machine with real WhatsApp Web.js integration using Docker.

---

## 📋 Prerequisites

- SSH access to `192.168.0.116`
- Docker & Docker Compose installed
- Git installed

---

## 🚀 Deployment Steps

### 1. SSH into the target machine

```bash
ssh sysadmin@192.168.0.116
```

### 2. Clone the repository

```bash
cd ~
git clone https://github.com/yourusername/lightWaha.git
cd lightWaha
```

### 3. Checkout the feature branch (or merge to master)

```bash
# Option A: Use feature branch
git checkout feature/phase-1-express-whatsapp

# Option B: Merge to master
git checkout master
git merge feature/phase-1-express-whatsapp
```

### 4. Create .env file from example

```bash
cp .env.example .env
```

Edit `.env` to set your configuration:

```bash
nano .env
```

Key settings:
```bash
APP_ENV=production
NODE_ENV=production
PORT=4000
LOG_LEVEL=info
WA_HEADLESS=true
```

### 5. Build and start with Docker Compose

```bash
docker compose up -d
```

This will:
- Build the Docker image (installs Node 20, Chromium, dependencies)
- Start the application on port 4000
- Create session volumes for persistence

### 6. Verify deployment

Check if container is running:
```bash
docker compose ps
```

Expected output:
```
NAME                COMMAND             STATUS
lightwaha-app       node dist/server.js  Up X seconds
```

Check logs:
```bash
docker compose logs -f lightwaha
```

---

## 📱 Using the Application

### Get Status
```bash
curl http://192.168.0.116:4000/status
```

### View QR Code
- **Terminal**: Check `docker compose logs lightwaha` for ASCII QR code
- **Web page**: Open `http://192.168.0.116:4000/qr.html` in browser
- **JSON API**: `curl http://192.168.0.116:4000/qr`

### Send Message
```bash
curl -X POST http://192.168.0.116:4000/send \
  -H "Content-Type: application/json" \
  -d '{"to":"5511987654321","text":"Hello"}'
```

### Health Check
```bash
curl http://192.168.0.116:4000/health
```

---

## 🔧 Docker Compose Commands

```bash
# Start application
docker compose up -d

# View logs
docker compose logs -f

# Stop application
docker compose down

# Rebuild image
docker compose build --no-cache

# Remove everything (including volumes)
docker compose down -v

# Restart
docker compose restart
```

---

## 📂 File Structure on Server

```
~/lightWaha/
├── src/
│   └── server.ts          # Main application
├── sessions/              # WhatsApp session storage (persistent)
├── logs/                  # Application logs
├── Dockerfile             # Docker image definition
├── docker-compose.yml     # Container orchestration
├── .env                   # Environment variables (not in git)
└── ...
```

---

## 🔐 Session Persistence

WhatsApp sessions are stored in `./sessions/` directory, which is mounted as a Docker volume. This means:

- ✅ QR code authentication happens once
- ✅ Session persists across container restarts
- ✅ No need to re-authenticate every time
- ✅ Backup sessions directory for safety: `cp -r sessions sessions.backup`

---

## 🐛 Troubleshooting

### Container won't start
```bash
docker compose logs lightwaha
# Check for error messages
```

### QR code not appearing
```bash
docker compose logs lightwaha | grep -i qr
# Should show QR code in ASCII art
```

### Can't connect to port 4000
```bash
# Check if port is open
netstat -tlnp | grep 4000

# Check firewall
sudo ufw allow 4000

# Restart Docker
docker compose down && docker compose up -d
```

### Out of memory
```bash
# Check Docker logs
docker stats

# Chromium can use significant memory, ensure adequate resources
```

---

## 📊 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Health check |
| GET | `/status` | Connection status |
| GET | `/qr` | Get QR code (JSON) |
| GET | `/qr.html` | QR code (HTML page) |
| POST | `/send` | Send message |
| POST | `/logout` | Logout WhatsApp |
| POST | `/destroy` | Destroy client |

---

## 🔄 Updates & Maintenance

### Update application code
```bash
git pull origin feature/phase-1-express-whatsapp
docker compose up -d --build
```

### View real-time logs
```bash
docker compose logs -f --tail=100
```

### Clean up old images
```bash
docker image prune
```

---

## ✅ Post-Deployment Checklist

- [ ] Container is running: `docker compose ps`
- [ ] Health check passes: `curl http://192.168.0.116:4000/health`
- [ ] Can view QR code: `docker compose logs | grep -i qr`
- [ ] Sessions directory is writable
- [ ] Logs are being generated
- [ ] Port 4000 is accessible from other machines

---

## 📞 Support

For issues:
1. Check logs: `docker compose logs lightwaha`
2. Verify port: `netstat -tlnp | grep 4000`
3. Restart: `docker compose restart`
4. Nuclear option: `docker compose down -v && docker compose up -d --build`

---

## 🔗 Access Points

- **Application**: `http://192.168.0.116:4000`
- **QR Code Web**: `http://192.168.0.116:4000/qr.html`
- **API Base**: `http://192.168.0.116:4000/api/*`

---

**Deployment Date**: [To be filled]
**Deployed by**: [Your name]
**Notes**: [Any special notes]
