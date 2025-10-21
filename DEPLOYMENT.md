# Canton Privacy Blockchain - DigitalOcean Deployment Guide

**Target Platform:** DigitalOcean Droplet (Ubuntu 22.04)  
**Estimated Time:** 20-30 minutes  
**Cost:** ~$24.30/month  
**Skill Level:** Intermediate

---

## Prerequisites

Before starting, ensure you have:

- [ ] DigitalOcean account with payment method added
- [ ] SSH key pair generated on your local machine
- [ ] Git installed locally
- [ ] Basic familiarity with SSH and Linux commands

---

## Phase 1: DigitalOcean Setup (10 minutes)

### Step 1.1: Create SSH Key (if you don't have one)

**On Windows (PowerShell):**
```powershell
ssh-keygen -t ed25519 -C "your_email@example.com"
# Press Enter to accept default location
# Enter a passphrase (optional but recommended)
```

**Your public key location:**
```
C:\Users\YOUR_USERNAME\.ssh\id_ed25519.pub
```

### Step 1.2: Add SSH Key to DigitalOcean

1. Log into DigitalOcean: https://cloud.digitalocean.com
2. Navigate to **Settings** → **Security** → **SSH Keys**
3. Click **Add SSH Key**
4. Copy your public key:
   ```powershell
   Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub | clip
   ```
5. Paste into DigitalOcean, name it (e.g., "My Windows PC")
6. Click **Add SSH Key**

### Step 1.3: Create Droplet

1. Go to **Create** → **Droplets**
2. Configure:
   
   **Choose Region:**
   - Select closest to you or target audience
   - Recommended: New York 3 (NYC3) or San Francisco 3 (SFO3)
   
   **Choose Image:**
   - Distribution: **Ubuntu 22.04 LTS x64**
   
   **Choose Size:**
   - Droplet Type: **Basic**
   - CPU Options: **Regular**
   - Select: **$24/mo** (2 vCPU, 4 GB RAM, 80 GB SSD)
   
   **Choose Authentication:**
   - Select: **SSH Key** (choose the key you just added)
   - Do NOT use password authentication
   
   **Finalize Details:**
   - Quantity: **1 Droplet**
   - Hostname: `canton-demo` (or your preferred name)
   - Tags: `canton`, `blockchain`, `demo` (optional)
   
3. Click **Create Droplet**
4. Wait ~60 seconds for creation
5. **Copy the IP address** (e.g., `159.89.123.45`)

### Step 1.4: Create Block Storage Volumes (Optional - for persistence)

**Note:** For demo purposes, you can skip this and use in-memory storage. For production:

1. Go to **Manage** → **Volumes**
2. Create 3 volumes:
   - Name: `canton-p1-data`, Size: 1 GB, Region: Same as Droplet
   - Name: `canton-p2-data`, Size: 1 GB, Region: Same as Droplet
   - Name: `canton-p3-data`, Size: 1 GB, Region: Same as Droplet
3. Attach each to your Droplet
4. Cost: $0.30/month total

---

## Phase 2: Initial Server Setup (5 minutes)

### Step 2.1: Connect to Your Droplet

**From Windows PowerShell:**
```powershell
ssh root@YOUR_DROPLET_IP
# Example: ssh root@159.89.123.45
```

**First connection:** Type `yes` when asked about fingerprint

### Step 2.2: Update System

```bash
# Update package lists
apt update

# Upgrade existing packages
apt upgrade -y

# Set timezone (optional)
timedatectl set-timezone America/New_York
```

### Step 2.3: Install Docker

```bash
# Install prerequisites
apt install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

**Expected output:**
```
Docker version 24.0.x
Docker Compose version v2.x.x
```

### Step 2.4: Install PowerShell (for Canton init script)

```bash
# Import Microsoft GPG key
wget -q https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb
dpkg -i packages-microsoft-prod.deb
rm packages-microsoft-prod.deb

# Install PowerShell
apt update
apt install -y powershell

# Verify
pwsh --version
```

---

## Phase 3: Deploy Application (5 minutes)

### Step 3.1: Clone Repository

```bash
# Install git if not present
apt install -y git

# Clone your repository
cd /root
git clone https://github.com/YOUR_USERNAME/canton-privacy-demo.git
cd canton-privacy-demo
```

**Note:** Replace `YOUR_USERNAME` with your actual GitHub username. If repo is private, you'll need to set up SSH keys or use HTTPS with token.

### Step 3.2: Start Canton Infrastructure

```bash
cd infrastructure
docker compose up -d
```

**Expected output:**
```
[+] Running 7/7
 ✔ Network canton-network created
 ✔ Container canton-synchronizer started
 ✔ Container canton-participant1 started
 ✔ Container canton-participant2 started
 ✔ Container canton-participant3 started
 ✔ Container canton-backend started
 ✔ Container canton-frontend started
```

### Step 3.3: Verify Containers

```bash
docker compose ps
```

**All 6 containers should show "Up" status.**

### Step 3.4: Initialize Canton Network

```bash
# Run Canton initialization script
pwsh ./init-canton-final.ps1
```

**This script will:**
- Bootstrap the Canton domain
- Create 3 parties (TechBank, GlobalCorp, RetailFinance)
- Upload the Payment DAR to all participants
- Save party IDs to `infrastructure/canton/party-ids.json`

**Expected output:**
```
================================================================================
Canton Network Initialization
================================================================================

[✓] Domain bootstrapped
[✓] Participant 1 connected
[✓] Participant 2 connected
[✓] Participant 3 connected
[✓] Party TechBank created: TechBank::1220...
[✓] Party GlobalCorp created: GlobalCorp::1220...
[✓] Party RetailFinance created: RetailFinance::1220...
[✓] DAR uploaded to Participant 1
[✓] DAR uploaded to Participant 2
[✓] DAR uploaded to Participant 3

================================================================================
SUCCESS! Canton network initialized
================================================================================
```

### Step 3.5: Generate Environment Files

```bash
cd ..
pwsh ./setup-env-files.ps1
```

**This creates:**
- `backend/.env` with real Canton party IDs
- `frontend/.env` with API URL

### Step 3.6: Restart Backend (to load new .env)

```bash
cd infrastructure
docker compose up -d --force-recreate backend
```

---

## Phase 4: Configure Firewall (2 minutes)

### Step 4.1: UFW Firewall Setup

```bash
# Enable UFW (Uncomplicated Firewall)
ufw --force enable

# Allow SSH (CRITICAL - don't lock yourself out!)
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow application ports
ufw allow 3000/tcp  # Frontend
ufw allow 3001/tcp  # Backend API

# Check status
ufw status verbose
```

**Expected output:**
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
3000/tcp                   ALLOW       Anywhere
3001/tcp                   ALLOW       Anywhere
```

---

## Phase 5: Verification & Testing (5 minutes)

### Step 5.1: Check All Containers

```bash
cd /root/canton-privacy-demo/infrastructure
docker compose ps
```

**All 6 should be "Up" and backend should be "healthy".**

### Step 5.2: Test Backend Health

```bash
curl http://localhost:3001/health
```

**Expected:**
```json
{"status":"healthy","timestamp":"2025-10-21T...","version":"1.0.0"}
```

### Step 5.3: Test Parties Endpoint

```bash
curl http://localhost:3001/api/parties
```

**Expected:** JSON array with 3 parties (TechBank, GlobalCorp, RetailFinance)

### Step 5.4: Test Transaction Query

```bash
curl http://localhost:3001/api/contracts
```

**Expected:** JSON array (empty initially, or with transactions)

### Step 5.5: Test Frontend

**From your local browser:**
```
http://YOUR_DROPLET_IP:3000
```

**You should see the Canton Privacy Blockchain Visualizer!**

### Step 5.6: Submit Test Transaction

**From Droplet:**
```bash
curl -X POST http://localhost:3001/api/contracts \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "TechBank",
    "receiver": "GlobalCorp",
    "amount": 1000,
    "description": "DigitalOcean deployment test"
  }'
```

**Expected:** JSON response with transaction details and `"status":"pending"`

### Step 5.7: Verify in Browser

1. Open `http://YOUR_DROPLET_IP:3000`
2. You should see the test transaction appear
3. Click "View As: GlobalCorp"
4. Click "Accept Payment" button
5. Transaction should change to "Committed" status ✅

---

## Phase 6: Optional Enhancements

### Add Custom Domain (Optional)

If you have a domain (e.g., `canton-demo.yourname.com`):

1. **Add DNS A Record:**
   - Point `canton-demo.yourname.com` to your Droplet IP
   - Wait 5-10 minutes for propagation

2. **Install Caddy (automatic HTTPS):**
   ```bash
   apt install -y debian-keyring debian-archive-keyring apt-transport-https
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
   apt update
   apt install -y caddy
   ```

3. **Configure Caddy:**
   ```bash
   cat > /etc/caddy/Caddyfile << 'EOF'
   canton-demo.yourname.com {
       reverse_proxy localhost:3000
   }
   EOF
   
   systemctl restart caddy
   ```

4. **Access via HTTPS:**
   ```
   https://canton-demo.yourname.com
   ```

### Enable Container Restart on Boot

```bash
cd /root/canton-privacy-demo/infrastructure

# Edit docker-compose.yml to add restart policy
# Add to each service:
#   restart: unless-stopped

# Or run this command:
docker compose up -d
```

**Now containers will auto-start on Droplet reboot.**

### Setup Monitoring (Optional)

```bash
# Check container resource usage
docker stats

# View logs
docker compose logs backend
docker compose logs -f backend  # Follow mode
```

---

## Troubleshooting

### Issue: Containers won't start

**Check logs:**
```bash
docker compose logs
```

**Common fixes:**
```bash
# Rebuild images
docker compose build --no-cache

# Full restart
docker compose down
docker compose up -d
```

### Issue: Backend can't connect to Canton

**Check backend logs:**
```bash
docker compose logs backend | grep -i error
```

**Verify Canton participants are running:**
```bash
docker compose ps | grep participant
```

**Check backend environment:**
```bash
docker compose exec backend env | grep PARTICIPANT
```

### Issue: Frontend shows error

**Check if backend is healthy:**
```bash
curl http://localhost:3001/health
```

**Check frontend logs:**
```bash
docker compose logs frontend
```

### Issue: Can't access from browser

**Verify firewall:**
```bash
ufw status
```

**Test from Droplet:**
```bash
curl http://localhost:3000
```

**If that works but browser doesn't:**
- Check DigitalOcean Cloud Firewall (if enabled)
- Verify correct IP address
- Try incognito/private browser window

---

## Maintenance

### View Application Logs

```bash
cd /root/canton-privacy-demo/infrastructure

# All logs
docker compose logs

# Specific service
docker compose logs backend
docker compose logs -f backend  # Follow mode (Ctrl+C to exit)

# Last 50 lines
docker compose logs --tail=50 backend
```

### Restart Services

```bash
# Restart single service
docker compose restart backend

# Restart all
docker compose restart

# Full shutdown and restart
docker compose down
docker compose up -d
```

### Update Application

```bash
cd /root/canton-privacy-demo

# Pull latest code
git pull origin main

# Rebuild and restart
cd infrastructure
docker compose build
docker compose up -d
```

### Backup Canton Data (if using volumes)

```bash
# Create snapshot via DigitalOcean web interface
# Or manually backup volumes
tar -czf canton-backup-$(date +%Y%m%d).tar.gz /mnt/canton-p*-data/
```

---

## Cost Breakdown

### Monthly Costs

| Resource | Cost | Notes |
|----------|------|-------|
| Droplet (4GB RAM) | $24.00 | Can destroy when not demoing |
| Block Volumes (3×1GB) | $0.30 | Optional, for persistence |
| Bandwidth | $0.00 | 4TB included, unlikely to exceed |
| **Total** | **$24.30** | ~$0.81/day |

### Cost Optimization Tips

1. **Destroy when not needed:** Power off doesn't save money, but destroying does
2. **Snapshot before destroying:** Save your configuration
3. **Use smaller Droplet:** $18/mo (2GB RAM) might work for light demos
4. **Skip volumes:** Use in-memory for demo-only deployments

---

## Security Best Practices

### Implemented ✅
- SSH key authentication (no passwords)
- UFW firewall enabled
- Docker container isolation
- Canton JWT authentication
- Automatic security updates (Ubuntu)

### Additional (if making public)
- Rate limiting on API endpoints
- Fail2ban for SSH brute force protection
- Regular security updates: `apt update && apt upgrade -y`
- Monitor logs for suspicious activity

---

## Performance Tuning (Optional)

For high-traffic demos:

```bash
# Increase Docker container limits in docker-compose.yml:
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

---

## Uninstalling / Cleanup

### Remove Application

```bash
cd /root/canton-privacy-demo/infrastructure
docker compose down -v  # Remove containers and volumes
cd /root
rm -rf canton-privacy-demo
```

### Destroy Droplet

1. DigitalOcean web interface
2. Go to Droplets
3. Click your Droplet
4. **Destroy** → Confirm

**Cost stops immediately upon destruction.**

---

## Success Checklist

After deployment, verify:

- [ ] All 6 containers running: `docker compose ps`
- [ ] Backend healthy: `curl http://localhost:3001/health`
- [ ] Frontend accessible in browser: `http://YOUR_DROPLET_IP:3000`
- [ ] Can submit transaction via UI
- [ ] Can accept transaction (commit payment)
- [ ] Privacy filtering works (switch between parties)
- [ ] Real-time updates working (SSE connection)
- [ ] Activity log populates correctly

---

## Support Resources

**Project Documentation:**
- `README.md` - Project overview and architecture
- `DEMO.md` - 5-minute demo script for recruiters
- `IMPLEMENTATION_PLAN.md` - Development journey

**DigitalOcean Docs:**
- https://docs.digitalocean.com/products/droplets/
- https://docs.digitalocean.com/products/volumes/

**Canton Documentation:**
- https://docs.daml.com/canton/index.html

---

## Next Steps After Deployment

1. **Practice the demo** using `DEMO.md`
2. **Add to portfolio** with link: `http://YOUR_DROPLET_IP:3000`
3. **Update resume** with project details
4. **Screenshot key features** for portfolio
5. **Consider custom domain** for professional appearance

---

**Congratulations! Your Canton blockchain is now live on DigitalOcean!** 🎉

**Demo URL:** `http://YOUR_DROPLET_IP:3000`

Share this with recruiters to showcase your blockchain expertise!

