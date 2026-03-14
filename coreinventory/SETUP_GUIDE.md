# CoreInventory — Complete Setup Guide

## Project Structure

```
coreinventory/
├── backend/
│   ├── config/         → db.js (MongoDB connection)
│   ├── controllers/    → authController.js, operationsController.js, productController.js
│   ├── middleware/     → auth.js, errorHandler.js
│   ├── models/         → User.js, Product.js, Stock.js, StockMove.js, Warehouse.js
│   ├── routes/         → auth.js, index.js
│   ├── utils/          → jwt.js, email.js
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── context/    → AuthContext.jsx
    │   ├── services/   → api.js
    │   ├── components/ → ProtectedRoute.jsx, layout/AppLayout.jsx
    │   ├── pages/
    │   │   ├── auth/   → Login.jsx, Register.jsx, ForgotPassword.jsx
    │   │   ├── dashboard/ → Dashboard.jsx
    │   │   ├── products/  → Products.jsx
    │   │   ├── operations/ → Operations.jsx, History.jsx
    │   │   ├── settings/  → Settings.jsx
    │   │   └── profile/   → Profile.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── postcss.config.js
```

---

## Prerequisites

Make sure you have these installed before starting:

- **Node.js** v18 or higher → https://nodejs.org
- **VS Code** → https://code.visualstudio.com
- **MongoDB Atlas account** → https://cloud.mongodb.com (free tier)
- **Gmail account** (for OTP emails)

---

## Step 1 — Set Up MongoDB Atlas

1. Go to https://cloud.mongodb.com and sign up or log in
2. Click **"Build a Database"** → choose **"Free (M0)"**
3. Select your cloud provider and region → click **"Create"**
4. Create a database user:
   - Username: `coreinventory_user`
   - Password: generate a strong password (copy it!)
5. Under **"Network Access"** → click **"Add IP Address"** → choose **"Allow Access From Anywhere"** (for development)
6. Click **"Connect"** → **"Drivers"** → copy the connection string. It looks like:
   ```
   mongodb+srv://coreinventory_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

---

## Step 2 — Set Up Gmail App Password (for OTP)

1. Go to your Google account → **Security**
2. Enable **2-Step Verification** if not already done
3. Go to **Security** → **App passwords**
4. Create a new app password (name it "CoreInventory")
5. Copy the 16-character password — you'll use it in the `.env` file

---

## Step 3 — Set Up the Backend

Open VS Code, open the `coreinventory/backend` folder in the terminal.

### 3.1 — Install dependencies
```bash
cd coreinventory/backend
npm install
```

### 3.2 — Create your .env file
Copy the example file and fill in your values:
```bash
cp .env.example .env
```

Open `.env` in VS Code and fill these in:
```env
MONGODB_URI=mongodb+srv://coreinventory_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/coreinventory?retryWrites=true&w=majority

JWT_SECRET=make_this_a_long_random_string_at_least_32_chars_abc123xyz
JWT_REFRESH_SECRET=another_long_random_string_different_from_above_xyz789
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

OTP_EXPIRE_MINUTES=10

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_char_app_password

PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 3.3 — Start the backend
```bash
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:5000
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
```

---

## Step 4 — Set Up the Frontend

Open a **new terminal** in VS Code (keep backend running).

### 4.1 — Install dependencies
```bash
cd coreinventory/frontend
npm install
```

### 4.2 — Start the frontend
```bash
npm run dev
```

You should see:
```
VITE v5.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

Open http://localhost:5173 in your browser. ✅

---

## Step 5 — First Run Checklist

When you open the app for the first time:

1. **Register** your first account at `/register`
   - This creates an admin user
2. **Go to Settings** → create your first warehouse (e.g. "Main Warehouse", code "WH-001")
3. **Go to Products** → add a few products with SKU and category
4. **Try a Receipt** → Operations → Receipts → New Receipt → validate it
5. **Check Dashboard** → KPIs should update

---

## Step 6 — VS Code Recommended Extensions

Install these for the best development experience:

| Extension | What it does |
|---|---|
| ES7+ React/Redux/React-Native snippets | React code snippets |
| Tailwind CSS IntelliSense | Autocomplete for Tailwind classes |
| Prettier | Auto-format code |
| Thunder Client | Test your API routes (like Postman) |
| MongoDB for VS Code | Browse your Atlas DB visually |
| GitLens | Better git history |

---

## API Routes Reference

### Auth Routes (`/api/auth`)

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login | Public |
| POST | `/api/auth/logout` | Logout | Private |
| POST | `/api/auth/refresh` | Refresh access token | Public (cookie) |
| GET | `/api/auth/me` | Get current user | Private |
| POST | `/api/auth/forgot-password` | Send OTP to email | Public |
| POST | `/api/auth/verify-otp` | Verify OTP | Public |
| POST | `/api/auth/reset-password` | Reset password | Public |
| PUT | `/api/auth/update-password` | Change password | Private |

### Products Routes (`/api/products`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/products` | List products (with search & filter) |
| POST | `/api/products` | Create product |
| GET | `/api/products/:id` | Get single product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Deactivate product |

### Operations Routes (`/api/operations`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/operations/dashboard` | Dashboard KPIs |
| GET | `/api/operations` | List all moves (filter by type, status) |
| POST | `/api/operations` | Create new move |
| GET | `/api/operations/:id` | Get single move |
| PUT | `/api/operations/:id/validate` | Validate (commits stock change) |
| PUT | `/api/operations/:id/cancel` | Cancel operation |

### Warehouses Routes (`/api/warehouses`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/warehouses` | List warehouses |
| POST | `/api/warehouses` | Create warehouse |
| PUT | `/api/warehouses/:id` | Update warehouse |

---

## Authentication System — How It Works

```
1. User logs in → Server returns:
   - accessToken (15 min) → stored in localStorage
   - refreshToken (7 days) → stored in HTTP-only cookie (secure)

2. Every API request → accessToken sent in Authorization header

3. Token expires → Axios interceptor auto-calls /api/auth/refresh
   - Uses refreshToken cookie (automatic, no code needed)
   - Gets new accessToken → retries the original request
   - User never sees an error

4. Logout → refreshToken deleted from DB + cookie cleared

5. Account lockout → 5 failed logins = 15 min lock

6. OTP Password Reset:
   Step 1: POST /forgot-password (email) → OTP sent to email (hashed in DB)
   Step 2: POST /verify-otp (email + otp) → returns resetToken
   Step 3: POST /reset-password (email + resetToken + newPassword) → done
```

---

## Deployment (After Hackathon)

### Frontend → Vercel (free)
1. Push code to GitHub
2. Go to https://vercel.com → import repository
3. Set root directory to `frontend`
4. Deploy → get a live URL

### Backend → Render (free)
1. Go to https://render.com → New → Web Service
2. Connect GitHub repo, set root to `backend`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add all env variables from your `.env` file
6. Deploy

### Update Frontend API URL for production
In `frontend/vite.config.js`, the proxy only works in dev.
For production, set `VITE_API_URL` env var in Vercel and update `api.js`:
```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  ...
})
```

---

## Common Issues & Fixes

| Problem | Fix |
|---|---|
| `MongoDB connection error` | Check MONGODB_URI, whitelist your IP in Atlas |
| `Cannot find module` | Run `npm install` in that folder |
| `CORS error` | Check CLIENT_URL in backend .env matches frontend URL |
| OTP email not sending | Check Gmail App Password, not your regular password |
| `Token expired` errors | Normal — Axios auto-refreshes, check console for real errors |
| Port already in use | Run `npx kill-port 5000` or `npx kill-port 5173` |

---

## Security Features Built In

- ✅ Passwords hashed with bcrypt (12 salt rounds)
- ✅ JWT access tokens (15 min expiry)
- ✅ HTTP-only cookie for refresh tokens (XSS safe)
- ✅ Account lockout after 5 failed logins (15 min)
- ✅ OTP hashed before DB storage
- ✅ Max 5 OTP attempts before invalidation
- ✅ Rate limiting on all auth routes
- ✅ CORS configured for specific origin only
- ✅ Security headers (XSS, clickjacking protection)
- ✅ MongoDB transactions for stock operations (atomic)
- ✅ Role-based access control (admin / manager / staff)
