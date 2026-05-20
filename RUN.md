# Running Mukti Portal

This document outlines the steps required to successfully build, run, and deploy the Mukti Portal application.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm, yarn, pnpm, or bun
- Python 3.9+ (if running the ML Service locally)
- A Firebase Project (See `FIREBASE.md` for setup instructions)

## Installation

1. **Install Frontend Dependencies:**
   ```bash
   npm install
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   cd ..
   ```

3. **Install ML Service Dependencies (Optional):**
   If you plan to run the ML Service locally:
   ```bash
   cd ml-service
   pip install -r requirements.txt
   cd ..
   ```

## Environment Setup

### 1. Root Environment Variables
Create a `.env` file in the root directory and add your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 2. Backend Environment Variables
Create a `.env` file in the `backend/` directory:

```env
PORT=5000
ML_SERVICE_URL=http://localhost:5001
VITE_FIREBASE_PROJECT_ID=your_project_id
GOOGLE_APPLICATION_CREDENTIALS=secrets/your-service-account-file.json
```

*(Note: You will need to place your Firebase Admin SDK service account JSON file in `backend/secrets/` as indicated above).*

## Running the Application Locally

The project is configured to run the Vite frontend and Express backend concurrently.

```bash
npm run dev:full
```

This will start:
- **Frontend** on `http://localhost:5173`
- **Backend** on `http://localhost:5000`

If you only want to start the frontend:
```bash
npm run dev
```

If you only want to start the backend:
```bash
npm run dev:server
```

### Running the ML Service

```bash
cd ml-service
python app.py
```
This starts the ML validation service on `http://localhost:5001`.

## Deployment Preparation

Before pushing to GitHub or deploying publicly, ensure the following:

### GitHub Push Safety Checklist
- [x] No hardcoded passwords, API keys, or JWT secrets in the codebase.
- [x] `.env` files are not committed (verify `.gitignore`).
- [x] `backend/secrets/` is not committed.
- [x] Demo logic and placeholder dummy accounts have been removed.

### Public Deployment Safety Checklist
- [x] Firebase Security Rules (`firestore.rules`) are properly configured to restrict unauthorized reads/writes.
- [x] Backend CORS is restricted to your frontend domain (update `backend/src/index.ts` from `*` to your exact Vercel/Netlify URL).
- [x] The Admin user (`shivashankrmali7@gmail.com`) password has been securely set in the Firebase console.

## Troubleshooting

- **CORS Errors:** Ensure your frontend URL is allowlisted in `backend/src/index.ts` and that your ML service is running if the backend tries to call it.
- **Firebase Auth Errors:** Check that Email/Password and Google sign-in are enabled in the Firebase Console. Ensure your `VITE_FIREBASE_API_KEY` is exact.
- **Port Conflicts:** If `5000` or `5173` are in use, kill the existing processes or change the ports in `.env` / `vite.config.ts`.
