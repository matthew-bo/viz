# 🚀 Deploy to Digital Ocean - Quick Steps

**Your GitHub Repo:** https://github.com/matthew-bo/viz  
**Estimated Time:** 20-30 minutes  
**Cost:** $24/month (or $0.80/day - destroy anytime)

---

## ✅ Prerequisites Checklist

- [ ] DigitalOcean account created
- [ ] Payment method added
- [ ] SSH key generated (if not, see Step 1)

---

## 📋 Step-by-Step Deployment

### Step 1: Generate SSH Key (if needed)

**Windows PowerShell:**
```powershell
ssh-keygen -t ed25519 -C "your_email@example.com"
# Press Enter for defaults, enter passphrase (optional)

# Copy public key to clipboard
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub | clip
```

---

### Step 2: Create DigitalOcean Droplet

1. Go to https://cloud.digitalocean.com
2. Click **Create** → **Droplets**
3. Configure:
   - **Image:** Ubuntu 22.04 LTS x64
   - **Size:** Basic - $24/mo (2 vCPU, 4 GB RAM, 80 GB SSD)
   - **Authentication:** SSH Key (paste from clipboard)
   - **Hostname:** `canton-demo`
4. Click **Create Droplet**
5. **Copy the IP address** shown (e.g., 159.89.123.45)

---

### Step 3: Connect to Droplet

**From PowerShell:**
```powershell
ssh root@YOUR_DROPLET_IP
# Type 'yes' when asked about fingerprint
```

---

### Step 4: Install Docker & Dependencies

**Run these commands on your Droplet:**

```bash
# Update system
apt update && apt upgrade -y

# Install prerequisites
apt install -y ca-certificates curl gnupg lsb-release git

# Install Docker
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify Docker installed
docker --version
docker compose version

# Install PowerShell (needed for init scripts)
wget -q https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb
dpkg -i packages-microsoft-prod.deb
apt update
apt install -y powershell

# Verify PowerShell installed
pwsh --version
```

---

### Step 5: Clone Your Repository

```bash
cd /root
git clone https://github.com/matthew-bo/viz.git
cd viz
```

---

### Step 6: Start Canton Infrastructure

```bash
cd infrastructure
docker compose up -d

# Wait 60 seconds for Canton to start
sleep 60

# Check containers are running
docker compose ps
```

**Expected:** 4 Canton containers (synchronizer + 3 participants) should be "Up"

---

### Step 7: Initialize Canton

```bash
# Still in /root/viz/infrastructure
pwsh ./init-canton-final.ps1
```

**Expected output:** Should see party IDs created and DAR uploaded

---

### Step 8: Configure Environment Variables

```bash
cd /root/viz

# Generate environment files from templates
pwsh ./setup-env-files.ps1

# Verify backend .env created
cat backend/.env
```

---

### Step 9: Restart Backend with Configuration

```bash
cd infrastructure
docker compose up -d --force-recreate backend
```

---

### Step 10: Configure Firewall

```bash
# Enable firewall with necessary ports
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp  # Frontend
ufw allow 3001/tcp  # Backend API

# Check firewall status
ufw status
```

---

### Step 11: Verify Deployment

**On the Droplet:**
```bash
# Check all containers running
docker compose ps

# Test backend health
curl http://localhost:3001/health

# Test parties endpoint
curl http://localhost:3001/api/parties

# Check frontend is built
docker logs canton-frontend
```

**From your browser:**
```
http://YOUR_DROPLET_IP:3000
```

You should see the Canton Privacy Blockchain Visualizer! 🎉

---

## 🧪 Test the Application

Once deployed, test these features:

1. **Submit Transaction:**
   - Select From: TechBank
   - Select To: GlobalCorp
   - Amount: $1000
   - Click "Submit"

2. **Accept Transaction:**
   - Switch to GlobalCorp (party filter)
   - Click "Accept" on pending transaction
   - Status should change to "Committed"

3. **Privacy Test:**
   - Switch to RetailFinance
   - Transaction should be hidden (privacy working!)

---

## 📊 Monitoring Commands

**Check all services:**
```bash
cd /root/viz/infrastructure
docker compose ps
```

**View logs:**
```bash
# Backend logs
docker compose logs backend

# Canton participant logs
docker compose logs participant1
docker compose logs participant2
docker compose logs participant3

# Frontend logs
docker compose logs frontend

# Follow logs in real-time
docker compose logs -f backend
```

**Restart services:**
```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart backend
docker compose restart frontend
```

---

## 🔧 Troubleshooting

### Backend not connecting to Canton?

```bash
# Check backend logs
docker logs canton-backend

# Check backend environment
docker exec canton-backend env | grep PARTICIPANT

# Restart backend
cd /root/viz/infrastructure
docker compose restart backend
```

### Frontend not loading?

```bash
# Check frontend logs
docker logs canton-frontend

# Verify frontend container is running
docker ps | grep frontend

# Rebuild frontend
docker compose up -d --force-recreate --build frontend
```

### Canton containers not starting?

```bash
# Check Canton logs
docker compose logs synchronizer
docker compose logs participant1

# Full reset
docker compose down -v
docker compose up -d
sleep 60
pwsh ./init-canton-final.ps1
cd ..
pwsh ./setup-env-files.ps1
cd infrastructure
docker compose restart backend
```

### Can't access from browser?

```bash
# Check firewall
ufw status

# Verify ports are listening
ss -tlnp | grep 3000
ss -tlnp | grep 3001

# Test locally first
curl http://localhost:3000
curl http://localhost:3001/health
```

---

## 💰 Cost Management

**To stop costs (destroy Droplet):**
1. Go to DigitalOcean dashboard
2. Find your Droplet
3. Click **More** → **Destroy**
4. Type droplet name to confirm

**Note:** Powering off still bills! You must destroy to stop costs.

**To redeploy later:**
- Create new Droplet (20 minutes)
- Follow this guide again

---

## 🎯 Next Steps

✅ **Your app is live at:** `http://YOUR_DROPLET_IP:3000`

**Add to Portfolio:**
- Update resume with live demo link
- Add to LinkedIn projects
- Take screenshots for portfolio
- Practice your demo with `DEMO.md`

**Optional Enhancements:**
- Add custom domain (see `DEPLOYMENT.md`)
- Add HTTPS with Let's Encrypt (see `DEPLOYMENT.md`)
- Set up monitoring with Grafana (see `DEPLOYMENT.md`)

---

## 📚 Full Documentation

For detailed guides, see:
- **DEPLOYMENT.md** - Complete deployment guide with all options
- **DIGITALOCEAN_QUICKSTART.md** - Quick start guide
- **DEMO.md** - 5-minute demo script
- **README.md** - Full project documentation

---

## ✅ Deployment Checklist

- [ ] SSH key generated and added to DigitalOcean
- [ ] Droplet created ($24/mo plan)
- [ ] Connected via SSH
- [ ] Docker and PowerShell installed
- [ ] Repository cloned
- [ ] Canton containers started
- [ ] Canton initialized (parties created)
- [ ] Environment variables configured
- [ ] Backend restarted with config
- [ ] Firewall configured
- [ ] Verified in browser (http://YOUR_IP:3000)
- [ ] Tested transaction submit/accept
- [ ] Tested privacy filter

---

**Need help?** Check the troubleshooting section above or review `DEPLOYMENT.md` for detailed instructions.

**Ready to deploy?** Start with Step 1! 🚀

