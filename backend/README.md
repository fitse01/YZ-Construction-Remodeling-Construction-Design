# YZ Construction Backend API

Complete backend system for YZ Construction website with admin dashboard, file storage, and email notifications.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with HTTP-only cookies + refresh token rotation
- **File Storage**: Local filesystem (VPS)
- **Image Processing**: Sharp
- **Email**: Nodemailer with SMTP
- **Validation**: Zod
- **Security**: Helmet, CORS, rate limiting

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seeding
├── src/
│   ├── config/
│   │   ├── database.ts        # Prisma client
│   │   ├── email.ts           # Email configuration
│   │   └── jwt.ts             # JWT configuration
│   ├── controllers/
│   │   ├── auth.controller.ts # Authentication logic
│   │   ├── project.controller.ts # Project CRUD
│   │   ├── media.controller.ts  # Media management
│   │   ├── message.controller.ts # Message management
│   │   └── upload.controller.ts  # File upload handling
│   ├── middleware/
│   │   ├── auth.ts            # Authentication middleware
│   │   ├── errorHandler.ts    # Error handling
│   │   ├── notFoundHandler.ts # 404 handling
│   │   ├── rateLimiter.ts     # Rate limiting
│   │   ├── upload.ts          # Multer configuration
│   │   └── validator.ts       # Request validation
│   ├── routes/
│   │   ├── auth.routes.ts      # Auth endpoints
│   │   ├── project.routes.ts  # Project endpoints
│   │   ├── media.routes.ts    # Media endpoints
│   │   ├── message.routes.ts  # Message endpoints
│   │   └── upload.routes.ts   # Upload endpoints
│   └── server.ts              # Express app entry point
├── uploads/                   # File storage directory
├── .env.example              # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## Database Schema

### Models

- **User**: Admin/staff accounts with role-based access
- **Project**: Content items with categories, status, media
- **Media**: Images and videos associated with projects
- **Message**: Contact form submissions
- **RefreshToken**: JWT refresh token storage

### Categories

- Residential
- Commercial
- Restaurant
- Kitchen
- Bathroom
- Interior
- Exterior

### User Roles

- OWNER: Full access
- ADMIN: Full access except user management
- STAFF: Limited access (future)

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/change-password` - Change authenticated user's password

### Projects

- `GET /api/projects` - List all projects (public)
- `GET /api/projects/:id` - Get single project (public)
- `POST /api/projects` - Create project (admin)
- `PUT /api/projects/:id` - Update project (admin)
- `DELETE /api/projects/:id` - Delete project (admin)
- `PATCH /api/projects/:id/publish` - Toggle publish status (admin)

### Media

- `POST /api/media/:projectId/images` - Upload images (admin)
- `POST /api/media/:projectId/videos` - Upload videos (admin)
- `PATCH /api/media/:id/reorder` - Reorder media (admin)
- `DELETE /api/media/:id` - Delete media (admin)

### Messages

- `POST /api/messages` - Submit contact form (public)
- `GET /api/messages` - List all messages (admin)
- `GET /api/messages/:id` - Get single message (admin)
- `PATCH /api/messages/:id/read` - Mark as read (admin)
- `DELETE /api/messages/:id` - Delete message (admin)

### Upload

- `POST /api/upload/project/:projectId/images` - Upload project images (admin)
- `POST /api/upload/project/:projectId/videos` - Upload project videos (admin)

### Health

- `GET /api/health` - Health check endpoint

## File Storage Structure

```
uploads/
└── projects/
    └── {project-id}/
        ├── images/
        │   ├── {uuid}.jpg
        │   ├── {uuid}_compressed.jpg
        │   └── {uuid}_thumb.jpg
        └── videos/
            └── {uuid}.mp4
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
nano .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` - Email configuration

### 3. Setup Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database (creates default admin user)
npm run prisma:seed
```

Default admin credentials:
- Email: `admin@yzconstruction.com`
- Password: `admin123` (CHANGE IMMEDIATELY!)

### 4. Development

```bash
# Start development server with hot reload
npm run dev
```

API runs on `http://localhost:3001`

### 5. Build for Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## Security Features

- **Authentication**: JWT with HTTP-only cookies
- **Refresh Token Rotation**: Prevents token reuse attacks
- **Rate Limiting**: Prevents brute force attacks
- **CORS**: Restricted to frontend domains
- **Helmet**: Security headers
- **Input Validation**: Zod schema validation
- **Password Hashing**: bcrypt with salt rounds
- **File Upload Validation**: Type, size, and extension checks
- **SQL Injection Prevention**: Prisma parameterized queries

## Email Notifications

Contact form submissions trigger automatic email notifications to the owner via Nodemailer + SMTP.

Supported providers:
- Gmail (requires app-specific password)
- SendGrid
- Mailgun
- Any SMTP provider

## Deployment

See `../deployment/DEPLOYMENT_GUIDE.md` for complete VPS deployment instructions.

Quick deployment steps:

1. Build the project: `npm run build`
2. Upload to VPS
3. Install dependencies: `npm install --production`
4. Setup environment variables
5. Run database migrations
6. Start with PM2: `pm2 start ecosystem.config.js`

## Monitoring

### PM2 Commands

```bash
pm2 status              # Check status
pm2 logs yz-construction-api  # View logs
pm2 monit               # Monitor resources
pm2 restart all         # Restart all apps
```

### Health Check

```bash
curl http://localhost:3001/api/health
```

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -h localhost -U yz_user -d yz_construction
```

### File Upload Issues

```bash
# Check uploads directory permissions
ls -la uploads/

# Fix permissions
chmod 755 uploads/
```

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

## Development Notes

- TypeScript strict mode enabled
- Prisma for type-safe database access
- Async/await for all database operations
- Error handling with custom error classes
- Request validation with Zod schemas
- File uploads processed with Multer + Sharp

## License

Proprietary - All rights reserved
