# 📖 LibraryPro — Library Management System (MERN)

React (Vite) + Express + MongoDB + JWT login.
Koi bhi **Sign up** karta hai to uske liye alag library + demo data (9 books, 5 members) ban jaata hai, aur use dashboard dikhta hai. Har user ka data doosre se alag rehta hai.

## Features

| Page | Kya hai |
|---|---|
| Login / Sign up | JWT auth, password bcrypt se hash, Logout |
| Dashboard | Stats, donut chart, 4-week activity chart, recent activity, recently issued, upcoming due, calendar |
| Books | Add / edit / delete, title-author-ISBN search, category filter, copies + available, cover URL, shelf |
| Members | Register, Student/Faculty/Public, membership active/expired + renew, history, pending fine |
| Issue / Return | Issue (due date auto), return, late fine, renew (max 2), fine collect |
| Reservations | Issued book reserve, queue, return par next member "Ready" + bell notification |
| Categories | Add / rename / delete, books count |
| Reports | Most issued, overdue list, fine collected/pending, monthly activity, Excel(CSV) export, PDF (print) |
| Settings | Loan days, fine/day, max books, admin name, password change, dark/light theme, reset demo data |
| AI Assistant | Library data par sawaal-jawab + report ka AI summary |

> **AI:** `ANTHROPIC_API_KEY` na ho tab bhi chalta hai (simple built-in jawab). Key daalne par Claude se full jawab milte hain.

---

## 1) Local par chalana

Zaroori: Node 18+, aur ek MongoDB (local ya Atlas).

```bash
# Terminal 1 — backend
cd backend
cp .env.example .env        # .env mein MONGO_URI aur JWT_SECRET bharein
npm install
npm run dev                 # http://localhost:5000

# Terminal 2 — frontend
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Browser mein `http://localhost:5173` kholein → **Sign up** karein.

---

## 2) Free hosting (MongoDB Atlas + Render + Vercel)

### Step A — MongoDB Atlas (free database)
1. https://www.mongodb.com/atlas par account banayein → **Create** → **M0 (Free)** cluster.
2. **Database Access** → naya user banayein (username + password yaad rakhein).
3. **Network Access** → **Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`). *(Render ka IP fixed nahi hota.)*
4. **Connect → Drivers** se connection string copy karein, aise dikhegi:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/librarypro?retryWrites=true&w=majority`
   (`<password>` ki jagah asli password, aur `/librarypro` database naam hona chahiye.)

### Step B — Code GitHub par daalein
Is poore folder ko ek GitHub repo mein push karein (`backend/` aur `frontend/` dono saath).

### Step C — Backend Render par
1. https://render.com → **New → Web Service** → apni GitHub repo chunein.
2. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
3. **Environment Variables:**
   - `MONGO_URI` = Atlas wali string
   - `JWT_SECRET` = koi lamba random text
   - `CLIENT_URL` = abhi khali chhod do, Vercel ke baad bharenge
   - *(optional)* `ANTHROPIC_API_KEY`
4. **Deploy** karein. Link milega, jaise `https://librarypro-api.onrender.com`.
   Test: `https://librarypro-api.onrender.com/api/health` → `{"ok":true}`.

*(Alternative: repo mein `render.yaml` hai, **New → Blueprint** se bhi ho jaata hai.)*

### Step D — Frontend Vercel par
1. https://vercel.com → **Add New → Project** → wahi GitHub repo.
2. **Root Directory:** `frontend` (Framework: Vite apne aap detect hoga).
3. **Environment Variables:**
   `VITE_API_URL` = `https://librarypro-api.onrender.com/api`   ← Render ka URL + `/api`
4. **Deploy.** Link milega, jaise `https://librarypro.vercel.app`.

### Step E — CORS jodein (zaroori)
Render → apni service → **Environment** → `CLIENT_URL` = `https://librarypro.vercel.app`
(end mein `/` nahi, multiple ho to comma se alag karein) → Save, service redeploy ho jaayegi.

Ho gaya! Vercel ka link kholkar Sign up karein 🎉

---

## ⚠️ Free plan ki baatein
- **Render free** service 15 min idle rehne par so jaati hai; pehla request 30-60 sec le sakta hai (login page par "server start ho raha hai" message dikhta hai). Isse bachne ke liye https://uptimerobot.com se `/api/health` ko har 10 min ping karwa sakte hain.
- **Vercel** par `vercel.json` se page refresh par 404 nahi aata.
- Environment variable badalne ke baad Vercel mein **Redeploy** zaroori hai (Vite build ke time par values leta hai).

## Folder structure
```
librarypro/
├─ backend/    Express API (models, routes, seed, auth)
├─ frontend/   React + Vite app (pages, components)
├─ render.yaml Render blueprint (optional)
└─ README.md
```

## API (sab `/api` ke neeche, login ke baad JWT header ke saath)
`/auth/*` · `/books` · `/members` · `/categories` · `/loans` (issue/return/renew/pay-fine) · `/reservations` · `/reports` (+ `/export.csv`) · `/dashboard` · `/settings` · `/ai/chat` · `/ai/summary`
