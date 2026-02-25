# Backend Setup (Google Sheets)

## 1) Create Google Sheet
- Create a Google Sheet and copy its ID from URL.
- Share the sheet with your service account email as Editor.

## 2) Configure env
- Copy `backend/.env.example` to `backend/.env`.
- Fill:
  - `JWT_SECRET`
  - `CORS_ORIGINS`
  - `GOOGLE_SHEET_ID`
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
  - `GOOGLE_PRIVATE_KEY`

For `GOOGLE_PRIVATE_KEY`, keep `\n` in the value exactly as shown in example.

## 3) Install and run
```bash
cd backend
npm install
npm start
```

App runs at `http://localhost:3000` and opens `login.html`.

## 4) First use
- Create account from login page (`Create Account`).
- Then login.
- Data is isolated per `user_id` and stored in your sheet tabs.

## Optional performance tuning
- You can set `SHEETS_CACHE_TTL_MS` in `.env` (default `10000`).
- Example: `SHEETS_CACHE_TTL_MS=15000`
- Higher value = fewer Google Sheets reads and faster page loads.

## Netlify + Backend deploy
If frontend is on Netlify and backend is hosted separately:

1. Deploy backend and note its public URL.
2. Set backend env `CORS_ORIGINS` with your Netlify origin.
   - Example: `CORS_ORIGINS=https://invoice-mgmt.netlify.app`
3. In project root `netlify.toml`, set redirect target:
   - `to = "https://YOUR_BACKEND_DOMAIN/api/:splat"`
4. Redeploy Netlify site.

This prevents `/api/*` login/register calls from returning `404` on Netlify.
