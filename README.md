# SocialLite

A full-stack social media web application built as a capstone project for **COMP 531 (Web Development and Design)** at Rice University.

SocialLite lets users create accounts, post articles/updates with images, comment on posts, follow other users, and manage a personal profile — with support for both traditional username/password login and Google OAuth.

**Author:** Saketh Pannala (NetID: sp220)

## Live Demo

- **Frontend:** https://sakethbook.surge.sh
- **Backend API:** https://sakethbook-356304ecb26f.herokuapp.com

### Test Credentials

| Username | Password | Notes |
|---|---|---|
| `Saketh` | `testpass1234` | |
| `Mack` | `testpass12345` | |
| `Reddy` | `testpass123456` | Linked to a Google account — can log in either way |

To try Google OAuth, click **"Login with Google"** on the landing page. You can sign in with any Google account; a new account is created automatically with a randomly generated username. To connect it to one of the accounts above, log in with that account first and use the **"link account"** option in your profile.

## Tech Stack

**Frontend**
- React 19 + React Router 7
- Vite
- Bootstrap 5 / Bootstrap Icons
- Vitest + React Testing Library

**Backend**
- Node.js + Express
- MongoDB (driver v4)
- Passport.js (Google OAuth 2.0)
- Cloudinary (image uploads via Multer)
- Jasmine + Supertest for API tests

## Project Structure

```
.
├── frontend/                # React + Vite single-page app
│   ├── src/
│   │   ├── components/      # Shared UI components (NavBar, etc.)
│   │   ├── context/         # AuthContext (auth state/session)
│   │   ├── pages/            # Landing, Main feed, Profile
│   │   ├── services/         # api.js — REST client for the backend
│   │   └── test/             # Vitest unit/integration tests
│   └── vite.config.js
│
└── backend/                  # Express REST API
    ├── index.js              # App entry point
    ├── src/
    │   ├── auth.js            # Register / login / logout / password
    │   ├── oauth.js            # Google OAuth strategy + routes
    │   ├── linking.js           # Link/unlink OAuth & password accounts
    │   ├── articles.js          # Posts, comments
    │   ├── profile.js           # Headline, avatar, email, zip, phone, DOB
    │   ├── following.js          # Follow/unfollow
    │   └── uploadCloudinary.js    # Cloudinary upload middleware
    └── spec/                  # Jasmine API tests
```

## Features

- **Authentication** — register/login with username & password, or sign in with Google OAuth; link/unlink multiple login methods on one account
- **News feed** — create text posts with optional image uploads, view posts from yourself and people you follow
- **Comments** — comment on any visible post
- **Profiles** — editable headline, avatar, email, phone, zip code, and date of birth
- **Following** — follow/unfollow other users and view their public posts and profile info

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- A MongoDB instance (e.g. MongoDB Atlas)
- A Cloudinary account (for image uploads)
- A Google Cloud OAuth 2.0 client (for "Login with Google")

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` with:

```env
MONGO_URI=your_mongodb_connection_string
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Run the server:

```bash
npm start
```

Run the API tests:

```bash
npm test
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file in `frontend/` if you want to point at a local backend:

```env
VITE_API_URL=http://localhost:3000
```

Run the dev server:

```bash
npm run dev
```

Run the unit/integration tests:

```bash
npm test
```

Build for production:

```bash
npm run build
```

## Deployment

- **Frontend** is deployed to [Surge](https://surge.sh) via `npm run deploy` (builds and pushes `dist/` to `sakethbook.surge.sh`).
- **Backend** is deployed to [Heroku](https://heroku.com), using the included `Procfile`.
