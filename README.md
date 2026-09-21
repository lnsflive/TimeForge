# TimeForge

A professional time tracking application built with Nuxt.js that helps you manage work hours, mileage, and calculate expected payouts.

[View Live Example](https://jaimegonzalezjr.com/Projects/TimeForge)

## Features

- 📊 Time Tracking Dashboard
- 🚗 Mileage Tracker
- 💰 Payout Calculations (Daily, Weekly, Monthly)
- 👤 Customizable User Profiles
- ⚙️ Comprehensive Settings

## Screenshots

![Login Screen](static/img/ss1.png)
![Time Tracking Dashboard](static/img/ss2.png)
![Settings Page](static/img/ss3.png)

## Tech Stack

- Frontend: Nuxt.js with Vuetify
- Backend: Strapi Headless CMS
- Authentication: Google and existing local accounts through the portfolio API cookie session
- Styling: Vuetify Material Design Framework

## Prerequisites

- Node.js (v14 or later recommended)
- npm or yarn package manager
- Docker (optional, for containerized Strapi)

## Setup Instructions

### 1. Frontend Setup (TimeForge)

```bash
# Clone the repository
git clone https://github.com/yourusername/timeforge.git
cd timeforge

# Install dependencies (using npm)
npm install --legacy-peer-deps

# OR if using yarn
yarn install --legacy-peer-deps

# Create .env file
cp .env.example .env
```

### 2. Environment Configuration

Create a `.env` file in the root directory with the following content:

```
# Development
API_AUTH_URL=https://api.jaimegonzalezjr.com
NODE_ENV=development

# Production (update when deploying)
# API_AUTH_URL=https://api.jaimegonzalezjr.com
```

### 3. Strapi Backend Setup

```bash
# Create a new Strapi project
npx create-strapi-app@latest timeforge-backend --quickstart

# Once Strapi is running, create an admin account at:
# http://localhost:1337/admin
```

#### Required Strapi Configuration:

1. Create Content Types:

   - TimeEntry

     - date (datetime)
     - startTime (time)
     - endTime (time)
     - description (text)
     - user (relation to User)

   - MileageEntry
     - date (date)
     - miles (decimal)
     - description (text)
     - user (relation to User)

2. Configure Permissions:
   - Go to Settings → Users & Permissions Plugin → Roles
   - Edit the Authenticated role
   - Enable necessary CRUD operations for TimeEntry and MileageEntry

### 4. Running the Application

#### Development Mode

```bash
# Start Strapi backend (in timeforge-backend directory)
npm run develop
# or yarn develop

# Start Nuxt frontend (in main project directory)
npm run dev
# or yarn dev
```

The application will be available at: http://localhost:3000

#### Production Build

```bash
# Generate static files
npm run generate
# or yarn generate

# Serve the static files
npm run start
# or yarn start
```

## Deployment Options

### Frontend Deployment

You can deploy the static frontend to:

- GitHub Pages
- Netlify
- Vercel
- Any static hosting service

### Backend Deployment

For Strapi, you can:

- Use a Platform-as-a-Service (PaaS) like Heroku
- Deploy to a VPS
- Use managed services like DigitalOcean App Platform

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with Nuxt.js
- Styled with Vuetify
- Powered by Strapi CMS

## Shared sign-in deployment

This frontend requires the portfolio auth bridge at `https://api.jaimegonzalezjr.com`. It restores identity using `GET /portfolio/session`, starts Google login using `/portfolio/auth/start?app=timeforge`, and signs existing local accounts in using `POST /portfolio/auth/local`. Logout calls `POST /portfolio/auth/logout`; the shared API session is ended for participating apps. Browser requests include credentials; bearer JWTs are no longer saved in local storage.

The API must allow credentialed CORS from the deployed frontend origin, validate write origins, register the fixed TimeForge Google return destination, and enforce ownership on all timesheet and profile routes. Client route guards are not an authorization boundary. Pay rate is loaded and updated separately through `GET/PUT /portfolio/timeforge/profile`, returning `{payRate: number | null}`. The server derives ownership from the signed-in account; no user ID is submitted. This frontend must deploy after the backend profile migration and endpoint rollout. Historical timesheet ownership still requires server enforcement.

The default frontend base path is `/Projects/TimeForge/`. Override `NUXT_APP_BASE_URL` for a different deployment and register its return URL server-side. `API_AUTH_URL` is public configuration; do not include provider secrets in the frontend. Google client configuration belongs on the API. Existing local registration remains available and may require email confirmation according to backend policy; this frontend does not bypass confirmation or merge existing accounts.

Run `npm test` for cookie transport regressions and `npm run build` to verify the production bundle.

### Synology Web Station

Work from `/volume1/git-server/environment/NodeJS/TimeForge`. Set `NUXT_PUBLIC_API_BASE_URL` (or legacy `API_AUTH_URL`) and `NUXT_APP_BASE_URL` in `.env` before building. Static assets embed these public settings.

Run `npm run generate`, then `npm run deploy:preview` to review source, destination and backup path without writing the web root. `npm run deploy` regenerates and copies to `DEPLOY_TARGET` (default `/volume1/web/Projects/TimeForge`) after backing up the existing directory outside the web root. It never deletes unrelated destination files. Coordinate deployment with the portfolio API bridge; the old API does not satisfy the new session contract. Configure the web server to serve `200.html` for SPA deep links such as `/Projects/TimeForge/login`.

Profile photo uploads are temporarily disabled pending a server-authorized upload route. Existing photos remain visible when supplied in the session response.

In-progress clock drafts are now stored under the authenticated account ID. Legacy unscoped drafts are retained in browser storage but are not automatically assigned to whichever account signs in. Finish any active legacy shift before switching the deployed frontend.

The Nuxt commands preload a Synology-only workaround for the installed Node runtime crashing when iterating `Intl.Segmenter` results. It disables that optional formatting API for build tools, which fall back to character splitting; it does not alter browser runtime code.
