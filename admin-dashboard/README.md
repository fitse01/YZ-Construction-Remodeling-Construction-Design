# YZ Construction Admin Dashboard

React-based admin dashboard for managing YZ Construction website content.

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Features

- **Authentication**: Secure login with JWT cookies
- **Dashboard**: Overview with stats and recent activity
- **Projects**: Full CRUD for project management
- **Messages**: View and manage contact form submissions
- **Settings**: Profile and password management

## Pages

### Login (`/login`)
- Email/password authentication
- Error handling
- Redirects to dashboard on success

### Dashboard (`/`)
- Total projects count
- Published projects count
- Unread messages count
- Recent activity feed

### Projects (`/projects`)
- List view with thumbnails
- Filter by category and status
- Create new projects
- Edit existing projects
- Delete projects
- Toggle publish/unpublish
- Image upload (drag-and-drop)
- Video upload
- Image reordering
- Featured image selection

### Messages (`/messages`)
- List all contact form submissions
- Search by name/email
- Unread message badges
- Mark as read
- Delete messages
- Message detail modal

### Settings (`/settings`)
- View account information
- Change password

## Project Structure

```
admin-dashboard/
├── src/
│   ├── components/
│   │   ├── ProtectedRoute.tsx  # Auth wrapper
│   │   └── Sidebar.tsx         # Navigation sidebar
│   ├── contexts/
│   │   └── AuthContext.tsx     # Authentication state
│   ├── pages/
│   │   ├── Login.tsx           # Login page
│   │   ├── Dashboard.tsx       # Dashboard overview
│   │   ├── Projects.tsx        # Project management
│   │   ├── Messages.tsx        # Message management
│   │   └── Settings.tsx        # Account settings
│   ├── App.tsx                 # Main app component
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env` file:

```env
VITE_API_URL=http://localhost:3001
```

### 3. Development

```bash
npm run dev
```

Dashboard runs on `http://localhost:5174`

### 4. Build for Production

```bash
npm run build
```

Build output in `dist/` directory

## API Integration

The dashboard communicates with the backend API via Axios with credentials (cookies) for authentication.

Base URL: `import.meta.env.VITE_API_URL || 'http://localhost:3001'`

### Authentication Flow

1. User logs in → API sets HTTP-only cookies
2. Dashboard makes requests with `withCredentials: true`
3. API validates JWT from cookies
4. Refresh token automatically rotates when needed

## Deployment

See `../deployment/DEPLOYMENT_GUIDE.md` for complete deployment instructions.

Quick deployment:

```bash
# Build
npm run build

# Upload to VPS
scp -r dist/* user@vps:/var/www/yz-construction/admin/

# Nginx will serve from /admin path
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Notes

- TypeScript strict mode enabled
- React Router for client-side routing
- Context API for state management
- Tailwind CSS for styling
- Lucide React for icons

## Future Enhancements

- Image gallery with lightbox
- Drag-and-drop project reordering
- Bulk operations
- Advanced filtering
- Export functionality
- Activity logs
- User management (for multi-user)
