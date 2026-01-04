# Ticketing System

A simple internal ticketing system with user management, department assignment, deadline tracking, and email notifications.

## Features

- User authentication with role-based access (Admin/User)
- Department-based ticket assignment
- Real-time countdown timer for ticket deadlines
- Email notifications (assignment, reassignment, closure, overdue)
- Ticket status management (Open, Pending, Closed)
- Admin settings for user and department management
- Automatic overdue ticket detection

## Tech Stack

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL
- JWT authentication
- Nodemailer for email
- Node-cron for scheduled tasks

### Frontend
- React with TypeScript
- React Router
- Axios
- Vite

## Prerequisites

- Docker and Docker Compose
- Digital Ocean account (for deployment)
- Google Workspace or Gmail account (for SMTP)

## Local Development

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd ticketing-system
```

### 2. Set up environment variables

Copy the example env files:

```bash
# Root .env for docker-compose
cp .env.example .env

# Backend .env (for local dev)
cp backend/.env.example backend/.env

# Frontend .env (for local dev)
cp frontend/.env.example frontend/.env
```

Edit the `.env` files with your configuration.

### 3. Set up SMTP credentials

For Gmail/Google Workspace:
1. Enable 2-factor authentication
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password in `SMTP_PASSWORD`

### 4. Run with Docker Compose

```bash
docker-compose up --build
```

The application will be available at:
- Frontend: http://localhost
- Backend API: http://localhost:5000

### 5. Default Admin Login

- Email: `admin@system.com`
- Password: `password`

**Important:** You will be forced to change the password on first login.

## Digital Ocean Deployment

### Step 1: Create a Droplet

1. Log in to Digital Ocean
2. Create a new Droplet:
   - Choose Ubuntu 22.04 LTS
   - Select size: Basic ($12/month or higher recommended)
   - Choose a datacenter region
   - Add SSH key or use password authentication
   - Click "Create Droplet"

### Step 2: Connect to Your Droplet

```bash
ssh root@your-droplet-ip
```

### Step 3: Install Docker and Docker Compose

```bash
# Update packages
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version
```

### Step 4: Set Up the Application

```bash
# Create app directory
mkdir -p /var/www/ticketing-system
cd /var/www/ticketing-system

# Clone your repository or upload files
# Option 1: Clone from Git
git clone <your-repo-url> .

# Option 2: Upload via SCP from your local machine
# From your local terminal:
# scp -r /path/to/ticketing-system root@your-droplet-ip:/var/www/
```

### Step 5: Configure Environment Variables

```bash
cd /var/www/ticketing-system

# Copy and edit environment file
cp .env.example .env
nano .env
```

Update the following variables:

```env
# Database
DB_PASSWORD=your-secure-database-password

# JWT
JWT_SECRET=your-random-jwt-secret-key-here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=admin@yourdomain.com
SMTP_PASSWORD=your-google-app-password
SMTP_FROM=admin@yourdomain.com

# Frontend URL (use your droplet IP or domain)
FRONTEND_URL=http://your-droplet-ip

# API URL for frontend
VITE_API_URL=http://your-droplet-ip/api
```

### Step 6: Configure Firewall

```bash
# Allow SSH, HTTP, and HTTPS
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### Step 7: Build and Start the Application

```bash
cd /var/www/ticketing-system

# Build and start all services
docker-compose up -d --build

# Check if services are running
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 8: Access the Application

Open your browser and navigate to:
```
http://your-droplet-ip
```

### Step 9: Set Up Domain (Optional but Recommended)

If you have a domain:

1. Point your domain A record to the droplet IP
2. Install Certbot for SSL:

```bash
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d yourdomain.com

# Update .env with your domain
nano .env
# Change FRONTEND_URL and VITE_API_URL to use https://yourdomain.com
```

3. Rebuild frontend with new env:

```bash
docker-compose up -d --build frontend
```

### Step 10: Set Up Auto-Start on Reboot

```bash
# Enable Docker to start on boot
systemctl enable docker

# Docker Compose services will auto-start if configured with restart policies
```

## Application Structure

```
ticketing-system/
├── backend/
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth middleware
│   │   ├── migrations/     # Database migrations
│   │   ├── models/         # TypeScript types
│   │   ├── routes/         # API routes
│   │   ├── services/       # Email and cron services
│   │   └── utils/          # Helper functions
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Helper functions
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
└── docker-compose.yml
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/me` - Get current user

### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user

### Departments
- `GET /api/departments` - Get all departments
- `POST /api/departments` - Create department (Admin only)
- `GET /api/departments/:id/users` - Get users in department

### Tickets
- `GET /api/tickets` - Get all tickets
- `GET /api/tickets/status/:status` - Get tickets by status (open/closed)
- `GET /api/tickets/my-department` - Get tickets for user's department
- `GET /api/tickets/:id` - Get ticket by ID
- `POST /api/tickets` - Create ticket
- `PUT /api/tickets/:id` - Update ticket

## Maintenance

### View Logs

```bash
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
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Backup Database

```bash
# Create backup
docker exec ticketing-postgres pg_dump -U postgres ticketing_system > backup.sql

# Restore backup
docker exec -i ticketing-postgres psql -U postgres ticketing_system < backup.sql
```

## Troubleshooting

### Backend won't start
- Check database connection: `docker-compose logs postgres`
- Verify environment variables in `.env`
- Ensure PostgreSQL is healthy: `docker-compose ps`

### Emails not sending
- Verify SMTP credentials
- Check if using App Password (not regular password)
- View logs: `docker-compose logs backend | grep -i email`

### Frontend can't connect to backend
- Check `VITE_API_URL` in `.env`
- Verify backend is running: `docker-compose ps`
- Check nginx configuration in `frontend/nginx.conf`

### Database migration issues
- Manually run migration: `docker-compose exec backend npm run migrate`
- Check logs: `docker-compose logs backend`

## Security Considerations

1. Change default admin password immediately
2. Use strong JWT secret
3. Use strong database password
4. Enable firewall (UFW)
5. Keep Docker images updated
6. Use SSL/HTTPS in production
7. Don't commit `.env` files to version control

## Support

For issues or questions, please check the logs first:

```bash
docker-compose logs -f
```

Common log locations:
- Backend: Container logs
- Frontend: Browser console + container logs
- Database: PostgreSQL container logs

## License

MIT
