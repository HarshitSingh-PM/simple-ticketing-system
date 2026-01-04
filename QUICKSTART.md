# Quick Start Guide

Get the ticketing system running in under 5 minutes!

## Prerequisites

- Docker and Docker Compose installed
- Google account for SMTP (or any SMTP provider)

## 1. Set Up Environment

```bash
# Copy environment files
cp .env.example .env
```

Edit `.env` and update these critical values:

```env
# Database password (use any secure password)
DB_PASSWORD=mySecurePassword123

# JWT secret (use any random string)
JWT_SECRET=myRandomSecretKey123

# Email settings (required for notifications)
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-google-app-password
SMTP_FROM=your-email@gmail.com

# URLs (use defaults for local development)
FRONTEND_URL=http://localhost
VITE_API_URL=http://localhost:5000/api
```

### Getting Google App Password

1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to https://myaccount.google.com/apppasswords
4. Generate new app password
5. Copy the 16-character password to `SMTP_PASSWORD`

## 2. Start the Application

```bash
# Build and start all services
docker-compose up -d --build

# Wait 30 seconds for services to initialize
# Then check if everything is running
docker-compose ps
```

You should see:
- ✅ ticketing-postgres (healthy)
- ✅ ticketing-backend (running)
- ✅ ticketing-frontend (running)

## 3. Access the Application

Open your browser: **http://localhost**

### Default Admin Login
- Email: `admin@system.com`
- Password: `password`

**You will be forced to change the password on first login.**

## 4. Quick Test

1. Login with admin credentials
2. Change the admin password
3. Go to Admin Settings → Create a test department
4. Create a test user
5. Create a ticket assigned to a department
6. Check the countdown timer on the ticket detail page

## Troubleshooting

### Services not starting?

```bash
# Check logs
docker-compose logs -f

# Restart everything
docker-compose down
docker-compose up -d --build
```

### Can't login?

```bash
# Check backend logs
docker-compose logs backend

# Verify database is running
docker-compose ps postgres
```

### No email notifications?

- Verify SMTP settings in `.env`
- Check backend logs: `docker-compose logs backend | grep -i email`
- Ensure you're using App Password, not regular Gmail password

## Next Steps

- Read the full [README.md](README.md) for deployment guide
- Configure email notifications properly
- Add more users and departments
- Test ticket creation and assignment flows

## Stopping the Application

```bash
# Stop services (keeps data)
docker-compose down

# Stop and remove all data
docker-compose down -v
```

## Development Mode

To run without Docker for development:

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with local settings

# Make sure PostgreSQL is running locally
# Update DB_HOST=localhost in .env

npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with API URL

npm run dev
```

## Quick Commands

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart a service
docker-compose restart backend

# Rebuild after code changes
docker-compose up -d --build

# Check service status
docker-compose ps

# Run database migrations manually
docker-compose exec backend npm run migrate
```

Happy ticketing! 🎫
