# Atelier

A studio companion app for artists to manage their creative practice. Track works in progress, inventory, collectors, materials, and discover open calls for exhibitions and opportunities.

## Features

- **Studio Dashboard** - Track works in progress with status, deadlines, notes, and progress images
- **Art Inventory** - Manage completed artworks with images, pricing, and location tracking
- **Materials Tracking** - Keep track of art supplies and maintain a wishlist
- **Collector Network** - Manage contacts including collectors, galleries, curators, and press
- **Reminders** - Set follow-up reminders for contacts and tasks
- **Newsletter** - Draft and manage communications to your network
- **Open Calls Finder** - Discover curated exhibition opportunities, residencies, grants, and fellowships

## Tech Stack

- **Frontend**: React 18 with Vite
- **Backend**: Convex (serverless database with real-time sync)
- **Authentication**: Custom email/password auth with session tokens
- **Styling**: Custom CSS with CSS variables

## Self-Hosting Guide

### Prerequisites

- Node.js 18+
- npm or yarn
- A free [Convex](https://convex.dev) account

### Step 1: Clone and Install

```bash
git clone https://github.com/yourusername/atelier.git
cd atelier
npm install
```

### Step 2: Set Up Convex Backend

1. Create a free account at [convex.dev](https://convex.dev)

2. Initialize Convex in your project:
   ```bash
   npx convex dev
   ```

3. When prompted:
   - Select "Create a new project"
   - Choose a project name (e.g., "my-atelier")
   - This creates `.env.local` with your Convex URL automatically

4. Keep `npx convex dev` running - it syncs your schema and functions to Convex

### Step 3: Run the App Locally

In a new terminal:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and create your account.

## Deployment Options

### Option A: Vercel + Convex Cloud (Recommended)

This is the simplest setup with automatic deployments.

#### 1. Deploy Convex to Production

```bash
npx convex deploy
```

This deploys your backend and outputs your production URL.

#### 2. Deploy Frontend to Vercel

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add the environment variable:
   - Name: `VITE_CONVEX_URL`
   - Value: Your Convex production URL (e.g., `https://your-project.convex.cloud`)
4. Deploy

Your app is now live with automatic deployments on every push.

### Option B: Self-Hosted Frontend + Convex Cloud

Host the frontend anywhere that serves static files.

#### 1. Deploy Convex Backend

```bash
npx convex deploy
```

Note your production URL from the output.

#### 2. Build the Frontend

```bash
VITE_CONVEX_URL=https://your-project.convex.cloud npm run build
```

#### 3. Deploy the `dist` Folder

Upload the `dist` folder to any static hosting:

- **Nginx**: Copy to `/var/www/html` and configure for SPA routing
- **Caddy**: Simple config with `try_files {path} /index.html`
- **Docker**: Use the nginx image with the dist folder
- **S3 + CloudFront**: Upload to S3 bucket with CloudFront distribution
- **Cloudflare Pages**: Connect your repo or upload directly

Example Nginx config:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/atelier;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Example Docker deployment:
```dockerfile
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### Option C: Docker Compose

Create a `docker-compose.yml`:

```yaml
version: '3.8'
services:
  atelier:
    build: .
    ports:
      - "80:80"
    environment:
      - VITE_CONVEX_URL=https://your-project.convex.cloud
```

Build and run:
```bash
# Build with your Convex URL
VITE_CONVEX_URL=https://your-project.convex.cloud npm run build

# Run with Docker
docker-compose up -d
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_CONVEX_URL` | Your Convex deployment URL | Yes |
| `CONVEX_DEPLOYMENT` | Convex deployment name (dev only) | No |

## Project Structure

```
atelier/
├── convex/              # Convex backend
│   ├── schema.ts        # Database schema
│   ├── auth.ts          # Authentication
│   ├── artworks.ts      # Artwork CRUD
│   ├── pieces.ts        # Works in progress
│   ├── collectors.ts    # Contact management
│   ├── materials.ts     # Art supplies
│   ├── files.ts         # Image uploads
│   └── lib/
│       └── crypto.ts    # Password hashing
├── src/
│   ├── components/      # React components
│   ├── context/         # Auth & data providers
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   └── main.jsx         # App entry point
└── package.json
```

## Data Privacy

- All data is private to each user
- Authentication uses secure password hashing
- Session tokens are stored in localStorage
- Images are stored in Convex's file storage

## License

MIT License - see [LICENSE](LICENSE) for details.
