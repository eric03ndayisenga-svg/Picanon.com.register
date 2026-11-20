# Picanon Business – Deployment Guide

This package contains the full **Picanon** full-stack web application (React + TypeScript + Vite frontend and Express API + SSE backend with persistent storage and Firebase Firestore sync).

## Requirements
- **Node.js 22.6+** (or Node.js 20+ using `npx tsx server.ts`)
- **npm** (or bun)

## Quick Deploy on Render (Free Plan – Zero-Error)
This package includes a `render.yaml` Blueprint file for one-click deployment on Render:
1. Unzip `picanon-business-publish.zip` and upload the contents to a GitHub repository.
2. On **Render.com**, choose **New → Web Service** (or **New → Blueprint** to auto-import `render.yaml`).
3. If configuring manually:
   - **Runtime:** `Node`
   - **Plan:** `Free ($0/month)`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `NODE_ENV=production npm start` *(or `NODE_ENV=production npx tsx server.ts`)*
   - **Health Check Path:** `/api/health`
   - **Environment Variables:** `NODE_ENV=production`, `NODE_VERSION=22.14.0`

## Manual / VPS / Railway / Cloud Run / Fly.io
1. Unzip the archive and enter the project folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the production frontend (`dist/`):
   ```bash
   npm run build
   ```
   *(A fresh pre-built `dist/` folder is already included in this zip, and rebuilding updates it cleanly.)*
4. Start the production server:
   ```bash
   NODE_ENV=production npm start
   ```
   *(If deploying on Node.js 18/20 instead of Node 22+, start with `NODE_ENV=production npx tsx server.ts`.)*

## Environment Variables
Copy `.env.example` to `.env` if needed:
- `PORT`: Defaults to `3000` (automatically respects platform `PORT`).
- `NODE_ENV`: Set to `production` to serve static files directly from `dist/`.
- `PICANON_SESSION_SECRET`: Recommended persistent secret on free hosts so sessions survive container restarts.

