# THE VAULT - Cinematic Batch Archive

THE VAULT is a React + Vite web app with a cinematic archive theme.
It includes:

- Multi-section pages: Home, Directory, Gallery, Story, Guestbook
- Directory profile dossier view on card click
- Guestbook backed by a real Node.js API

## Tech Stack

- Frontend: React, Vite, Framer Motion
- Backend: Express
- Data storage: JSON file at [data/guestbook.json](data/guestbook.json)

## Project Structure

- Frontend app: [src/App.jsx](src/App.jsx)
- Backend server: [server.cjs](server.cjs)
- Vite config/proxy: [vite.config.js](vite.config.js)

## Installation

1. Install dependencies:

```bash
npm install
```

## Run in Development

Start backend and frontend in separate terminals.

1. Start API server:

```bash
npm run server
```

2. Start frontend:

```bash
npm run dev
```

Frontend runs on Vite dev server and proxies `/api/*` calls to `http://localhost:3001`.

## Build

```bash
npm run build
```

## Guestbook API

Base URL: `/api/guestbook`

- `GET /api/guestbook` -> list entries
- `POST /api/guestbook` -> create entry
- `PUT /api/guestbook/:id` -> update entry
- `DELETE /api/guestbook/:id` -> delete entry

## Notes

- Guestbook entries persist in [data/guestbook.json](data/guestbook.json).
- If backend is not running, Guestbook shows fallback seed data in the UI.
