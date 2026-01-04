# Digital Ocean Deployment Guide

This guide provides step-by-step instructions to deploy the ticketing system to Digital Ocean.

## Prerequisites

1. **Digital Ocean Account**: Create an account at https://www.digitalocean.com
2. **GitHub Repository**: Code is already committed at https://github.com/HarshitSingh-PM/simple-ticketing-system.git
3. **Google App Password**: Already configured in `.env.production`

## Option 1: Automated Deployment (Recommended)

### Step 1: Create a Digital Ocean Droplet

1. Log in to Digital Ocean
2. Click "Create" → "Droplets"
3. Choose configuration:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic - $12/month or higher (2 GB RAM minimum)
   - **Datacenter**: Choose closest to your location
   - **Authentication**: SSH key (recommended) or password
4. Click "Create Droplet"
5. Note your droplet's IP address

### Step 2: Connect to Your Droplet

```bash
# Replace YOUR_DROPLET_IP with your actual IP
ssh root@YOUR_DROPLET_IP
```

### Step 3: Upload Deployment Files

From your local machine, upload the necessary files:

```bash
# Navigate to your project directory
cd /Users/harshitsingh/Desktop/ticketing-system

# Upload deployment script and env file
scp deploy-to-digitalocean.sh root@YOUR_DROPLET_IP:/root/
scp .env.production root@YOUR_DROPLET_IP:/root/
```

### Step 4: Run Automated Deployment

On your droplet:

```bash
# Run the deployment script
sudo bash /root/deploy-to-digitalocean.sh
```

The script will prompt you for:
- Your Gmail address (for SMTP)
- Your droplet IP or domain

Then it will automatically:
- Install Docker and Docker Compose
- Clone the repository
- Configure environment variables
- Set up firewall
- Build and start all services

### Step 5: Access Your Application

Once deployment completes, visit:
```
http://YOUR_DROPLET_IP
```

**Default Admin Login:**
- Email: `admin@system.com`
- Password: `password`
- You will be forced to change the password on first login

---

## Option 2: Manual Deployment

If you prefer to run commands manually:

### 1. Create and Connect to Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

### 2. Update System

```bash
apt update && apt upgrade -y
```

### 3. Install Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
docker --version
```

### 4. Install Docker Compose

```bash
apt install docker-compose -y
docker-compose --version
```

### 5. Clone Repository

```bash
mkdir -p /var/www/ticketing-system
cd /var/www/ticketing-system
git clone https://github.com/HarshitSingh-PM/simple-ticketing-system.git .
```

### 6. Configure Environment

```bash
# Upload .env.production from local machine or create .env manually
nano .env
```

Update these variables:
```env
# Your Gmail address
SMTP_USER=your-email@gmail.com
SMTP_FROM=your-email@gmail.com

# Your droplet IP or domain
FRONTEND_URL=http://YOUR_DROPLET_IP
VITE_API_URL=http://YOUR_DROPLET_IP/api

# Other variables are pre-configured in .env.production
```

### 7. Configure Firewall

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 8. Build and Start

```bash
docker-compose up -d --build
```

### 9. Verify Deployment

```bash
# Check if services are running
docker-compose ps

# View logs
docker-compose logs -f
```

---

## Post-Deployment Steps

### 1. Change Admin Password

- Login with default credentials
- You will be forced to change the password immediately

### 2. Configure Email in Admin Settings

- Navigate to Settings tab
- Update SMTP configuration if needed
- Test email by creating a test ticket

### 3. Create Users and Departments

- Go to Settings → Users
- Create user accounts for your team
- Assign them to departments

### 4. Set Up Domain (Optional)

If you have a domain name:

```bash
# Point your domain A record to droplet IP
# Then update .env file
nano /var/www/ticketing-system/.env

# Change:
FRONTEND_URL=https://yourdomain.com
VITE_API_URL=https://yourdomain.com/api

# Install SSL certificate
apt install certbot python3-certbot-nginx -y
certbot --nginx -d yourdomain.com

# Rebuild frontend with new URL
docker-compose up -d --build frontend
```

---

## Maintenance Commands

### View Logs

```bash
cd /var/www/ticketing-system

# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Update Application

```bash
cd /var/www/ticketing-system

# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Backup Database

```bash
# Create backup
docker exec ticketing-postgres pg_dump -U postgres ticketing_system > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker exec -i ticketing-postgres psql -U postgres ticketing_system < backup_file.sql
```

### Monitor Resources

```bash
# Check Docker container stats
docker stats

# Check disk usage
df -h

# Check memory usage
free -h
```

---

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Check if ports are in use
netstat -tlnp | grep :80
netstat -tlnp | grep :5001

# Restart Docker
systemctl restart docker
docker-compose up -d
```

### Database Connection Issues

```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Verify database is running
docker-compose ps

# Access database directly
docker exec -it ticketing-postgres psql -U postgres -d ticketing_system
```

### Email Not Sending

```bash
# Check backend logs for email errors
docker-compose logs backend | grep -i email

# Verify SMTP credentials in .env
cat .env | grep SMTP

# Test SMTP connection
docker-compose exec backend npm run test-email
```

### Frontend Can't Connect to Backend

```bash
# Check nginx configuration
docker-compose exec frontend cat /etc/nginx/nginx.conf

# Verify VITE_API_URL is correct
cat .env | grep VITE_API_URL

# Check backend is accessible
curl http://localhost:5001/api/health
```

---

## Security Checklist

- [ ] Changed default admin password
- [ ] Using strong database password
- [ ] Using strong JWT secret
- [ ] Firewall configured (UFW enabled)
- [ ] Only necessary ports open (22, 80, 443)
- [ ] SSL/HTTPS enabled (for production with domain)
- [ ] Regular backups scheduled
- [ ] Docker images kept up to date
- [ ] Environment variables not committed to Git

---

## Support

For issues or questions:

1. Check logs: `docker-compose logs -f`
2. Review troubleshooting section above
3. Check GitHub repository issues
4. Verify all environment variables are correctly set

---

## Quick Reference

**Application URL**: `http://YOUR_DROPLET_IP`
**Default Admin**: `admin@system.com` / `password`
**Backend Port**: `5001`
**Frontend Port**: `80`
**Database Port**: `5432` (internal only)

**Key Directories**:
- Application: `/var/www/ticketing-system`
- Database Data: Docker volume `postgres_data`
- Uploaded Files: Docker volume `uploads_data`
