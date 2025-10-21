# DigitalOcean Deployment - Quick Start

**Time Estimate:** 20-30 minutes  
**Cost:** $24/month (can destroy after demo)  
**Full Guide:** See `DEPLOYMENT.md` for detailed instructions

---

## ⚡ Fastest Path to Live Demo

### 1. DigitalOcean Setup (10 min)

**Create SSH Key:**
```powershell
# Windows PowerShell
ssh-keygen -t ed25519 -C "your_email@example.com"
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub | clip
```

**Create Droplet:**
1. Go to https://cloud.digitalocean.com
2. Click **Create** → **Droplets**
3. Choose:
   - **Image:** Ubuntu 22.04 LTS
   - **Size:** $24/mo (4 GB RAM, 2 vCPU)
   - **Authentication:** SSH Key (paste from clipboard)
   - **Hostname:** `canton-demo`
4. **Create Droplet**
5. **Copy the IP address** shown

### 2. Connect & Setup (5 min)

```bash
# Connect
ssh root@YOUR_DROPLET_IP

# Install Docker
apt update && apt upgrade -y
apt install -y ca-certificates curl
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Install PowerShell
wget -q https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb
dpkg -i packages-microsoft-prod.deb
apt update
apt install -y powershell
```

### 3. Deploy Application (5 min)

```bash
# Clone repo
apt install -y git
cd /root
git clone https://github.com/YOUR_USERNAME/canton-privacy-demo.git
cd canton-privacy-demo

# Start containers
cd infrastructure
docker compose up -d

# Wait 60 seconds for Canton to start
sleep 60

# Initialize Canton (creates parties, uploads DAR)
pwsh ./init-canton-final.ps1

# Generate .env files
cd ..
pwsh ./setup-env-files.ps1

# Restart backend with new config
cd infrastructure
docker compose up -d --force-recreate backend
```

### 4. Configure Firewall (2 min)

```bash
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw allow 3001/tcp
```

### 5. Test! ✅

**In your browser:**
```
http://YOUR_DROPLET_IP:3000
```

**You should see the Canton Privacy Blockchain Visualizer!**

---

## 🎯 Quick Verification

```bash
# Check all containers running
docker compose ps

# Test backend
curl http://localhost:3001/health

# Test parties
curl http://localhost:3001/api/parties

# Submit test transaction
curl -X POST http://localhost:3001/api/contracts \
  -H "Content-Type: application/json" \
  -d '{"sender":"TechBank","receiver":"GlobalCorp","amount":1000,"description":"Test"}'
```

---

## 📝 Before You Start

### Prerequisites
- [ ] DigitalOcean account created
- [ ] Payment method added
- [ ] SSH key generated locally
- [ ] GitHub repo pushed (or will clone different way)

### Cost Awareness
- **$24/month** = **$0.80/day**
- Billed hourly (can destroy anytime)
- **To stop costs:** Destroy Droplet (power-off still bills)

---

## 🚨 Important Notes

1. **GitHub Repo:** Make sure your code is pushed to GitHub first
2. **Replace `YOUR_USERNAME`** in git clone command
3. **Save your Droplet IP** - you'll need it multiple times
4. **Keep SSH key safe** - you need it to connect
5. **Firewall rules MUST include port 22** - or you'll lock yourself out

---

## 🔄 If Something Goes Wrong

**Full reset:**
```bash
cd /root/canton-privacy-demo/infrastructure
docker compose down -v
docker compose up -d
sleep 60
pwsh ./init-canton-final.ps1
```

**Check logs:**
```bash
docker compose logs backend
docker compose logs participant1
```

**Start over:**
- Destroy Droplet
- Create new one
- Follow guide again (takes 20 min)

---

## ✅ Success Checklist

After deployment, verify:
- [ ] All 6 containers running: `docker compose ps`
- [ ] Backend healthy: `curl http://localhost:3001/health`
- [ ] Browser shows app: `http://YOUR_DROPLET_IP:3000`
- [ ] Can submit transaction in UI
- [ ] Can accept transaction (goes to "Committed")
- [ ] Privacy filter works (switch parties)

---

## 🎉 Next Steps

1. **Practice demo** with `DEMO.md`
2. **Add to resume:** "Deployed Canton blockchain on DigitalOcean"
3. **Add to portfolio:** Link to `http://YOUR_DROPLET_IP:3000`
4. **Take screenshots** for portfolio
5. **Optional:** Add custom domain (see DEPLOYMENT.md)

---

## 💡 Pro Tips

- **Cost Saving:** Destroy Droplet when not demoing, recreate when needed (20 min)
- **Backup First:** Take snapshot before destroying
- **Custom Domain:** Makes it look more professional
- **HTTPS:** Use Caddy for free SSL (see DEPLOYMENT.md)

---

**Need detailed help?** See `DEPLOYMENT.md` for complete step-by-step guide with troubleshooting.

**Ready? Let's deploy!** 🚀

