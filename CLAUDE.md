# 3D Print Tracker — Project Memory

## Stack
- **Runtime**: Electron v29 (Node.js main process + Chromium renderer)
- **UI**: React 18 + Vite v5 (JSX, hooks, Context API — no external UI library)
- **Packaging**: electron-builder (Windows NSIS installer)
- **Data storage**: Local JSON files via Node.js `fs` (`data.json`, `settings.json` in AppData)
- **Mobile server**: Node.js `http` module (port 3000, auto-retries up to +10), serves `src/mobile.html`
- **API integration**: N3D Melbourne API (HTTPS proxy through main process — CORS workaround)

## Project structure
```
3d-print-tracker/
├── main.js                      # Electron entry point (window, protocol, app lifecycle)
├── preload.js                   # Context bridge (exposes electronAPI to renderer)
├── vite.config.js               # Vite config — root: src, base: './', outDir: ../dist-web
├── package.json
├── .eslintrc.json               # ESLint config (Node for main, Browser+JSX for src/**/*.jsx)
├── src/
│   ├── index.html               # Vite entry HTML (mounts #root)
│   ├── main.jsx                 # React root — renders <AppProvider><App /></AppProvider>
│   ├── App.jsx                  # Top-level layout, view routing, modal rendering
│   ├── mobile.html              # Phone inventory companion (vanilla JS, served by local server)
│   ├── styles/
│   │   └── main.css             # All app CSS (light + dark theme via CSS vars)
│   ├── context/
│   │   └── AppContext.jsx       # Single source of truth — all state, actions, IPC calls
│   ├── components/
│   │   ├── TopBar.jsx           # Nav bar, view buttons, search, export CSV
│   │   └── Stats.jsx            # Summary stat pills
│   ├── views/
│   │   ├── ProductView.jsx      # Product list, category sections, parts table
│   │   ├── ArchiveView.jsx      # Archived products
│   │   ├── ColourView.jsx       # Colour/filament grouping view
│   │   └── InventoryView.jsx    # Inventory tracking view
│   ├── modals/
│   │   ├── PartModal.jsx        # Add/edit part
│   │   ├── AddProductModal.jsx  # Add product (with duplicate name warning)
│   │   ├── ManageProductModal.jsx
│   │   ├── SettingsModal.jsx    # Settings, categories, storage locations, outgoing dests
│   │   ├── StatusModal.jsx      # Change part/sub-part status
│   │   ├── QuickAddModal.jsx
│   │   ├── CompletionModal.jsx
│   │   ├── SubpartModal.jsx
│   │   ├── N3DModal.jsx         # N3D Melbourne design browser (Electron-only, CORS proxy)
│   │   ├── ImportModal.jsx      # CSV import
│   │   ├── ConflictModal.jsx    # CSV import conflict resolution
│   │   ├── AddInventoryModal.jsx
│   │   └── RenameCatModal.jsx
│   └── main/                    # Electron main process modules (CommonJS)
│       ├── server.js            # Local HTTP server for mobile companion
│       └── ipc/
│           ├── data.js          # IPC: load-data, save-data, settings, local IP
│           ├── files.js         # IPC: CSV dialogs, 3MF upload, folder/image ops, slicer
│           └── n3d.js           # IPC: N3D API proxy (Node https — bypasses CORS)
├── build-resources/
│   └── icon.ico
├── dist-web/                    # Vite production build output (gitignored)
└── dist/                        # electron-builder installer output (gitignored)
```

## Dev workflow
- **Dev (both)**: `npm run dev` — starts Vite dev server (port 5173) + Electron pointing at it
- **Dev (web only)**: `npm run dev:web` — Vite only, opens browser
- **Lint**: `npm run lint` — ESLint across main process JS and all JSX
- **Lint fix**: `npm run lint:fix`
- **Build**: `npm run build` — lint → `vite build` → `electron-builder --win` → produces `dist/3D Print Tracker Setup X.X.X.exe`

## Key conventions
- React Context (`AppContext`) is the single source of truth — all state and actions live there
- `isElectron` flag gates all `window.electronAPI` calls (file dialogs, IPC, local images)
- `localFileUrl(path)` converts local filesystem paths to `localfile://` URLs for Electron's custom protocol handler
- `localfile://` protocol registered in `main.js` — lets renderer load images from disk when served over HTTP in dev
- Main process uses CommonJS `require`/`module.exports`; renderer uses ES modules
- IPC modules export a `register(ipcMain, ...)` function
- Data auto-saved to `AppData/Roaming/3d-print-tracker/data.json` on every change
- Git: ask for permission before committing

## Electron-only features (won't work in browser)
- Data persistence (IPC to main process for file read/write)
- File dialogs (image upload, CSV, 3MF)
- Local image loading via `localfile://` protocol
- N3D API (CORS — must proxy through Node)
- Mobile companion server (starts in main process)

## Remote mobile access
- On local WiFi: phone connects to `http://<PC-IP>:3000` automatically
- Outside local network: use **Tailscale** (free) — install on PC + phone, no code changes needed

## Versions
- v1.0.0 — Initial release
- v2.0.0 — Category grouping, colour view, sub-parts, inventory, N3D integration, mobile companion
- v2.1.0 — UI polish, theme toggle, category manager, pre-sliced 3MF flag, manage modal, custom icon
- Codebase refactor — split monolithic index.html + main.js into React/Vite modular structure
- v3.0.0 — Printing/Commenced/Ready workflow, main search, +inv popup, N3D select-all, stocktake mode, mobile collapsible sections, port auto-retry, React migration, production build pipeline

## Recent fixes (on main, not yet committed)
- **3MF badge stale ref fix**: `ProductCard` now computes `has3mf` directly from `products` state prop instead of `productHas3mf()` (which read from `productsRef` — a `useEffect`-synced ref that lagged one render behind after upload)
- **3MF upload toast**: `handle3mfUpload` wrapper in `ProductView` shows a fixed bottom toast for 3s after upload (`uploadProduct3mf` returns file count)
- **ColourView search**: search bar filters by colour name, product name, or part name
- **ColourView clickable products**: product name subtitle is a clickable link — calls `setView('products')` + `toggleProduct(item)` to navigate and expand

## Branch: feature/web-app (NOT YET CREATED — start here next session)

### Goal
Public web app with cloud sync — any user visits a URL, signs up, and their data follows them across PC, phone, and tablet. Electron desktop app stays unchanged on `main`.

### To create the branch
Run on your Windows machine: `git checkout -b feature/web-app`

### Architecture decisions
- **Backend**: Supabase (free tier — supabase.com). Postgres + auth + real-time. No self-hosting needed.
- **Data model**: One row per user in `user_data` table. Columns: `user_id`, `data` (jsonb — mirrors current `data.json`), `settings` (jsonb — mirrors `settings.json`), `updated_at`
- **Auth**: Supabase Auth — email/password + magic link option
- **Hosting**: Netlify (free) — auto-deploys from GitHub on push
- **Images**: Hidden on web for now (`isElectron` gate) — Supabase Storage can be added later
- **N3D Melbourne**: Hidden on web (needs CORS proxy, not worth it for public users)
- **Electron app**: Zero changes — still reads/writes local files, no login required

### Supabase SQL to run (in Supabase SQL editor when project is created)
```sql
create table public.user_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  data jsonb not null default '{}',
  settings jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

create policy "Users can view own data" on public.user_data
  for select using (auth.uid() = user_id);

create policy "Users can insert own data" on public.user_data
  for insert with check (auth.uid() = user_id);

create policy "Users can update own data" on public.user_data
  for update using (auth.uid() = user_id);
```

### Files to create (new)
- `src/lib/supabase.js` — Supabase client (reads from `import.meta.env.VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`)
- `src/components/AuthModal.jsx` — sign in / sign up screen shown on web when not logged in
- `netlify.toml` — build command + publish dir + SPA redirect rule
- `.env.example` — template (safe to commit): `VITE_SUPABASE_URL=` and `VITE_SUPABASE_ANON_KEY=`

### Files to modify
- `src/context/AppContext.jsx` — replace localStorage fallback (lines 18–33) with Supabase reads/writes; add `user` + `authChecked` state; `init()` waits for auth on web; `supabase.auth.onAuthStateChange` listener
- `src/App.jsx` — add auth gate: if web + `!user` → show `<AuthModal />` instead of main app
- `package.json` — add `@supabase/supabase-js` to dependencies; add `"deploy": "vite build"` script

### Auth flow (web only)
1. App loads → `supabase.auth.getSession()` → sets `user` + `authChecked`
2. If no session → `<AuthModal />` (sign in / sign up)
3. On login → `onAuthStateChange` fires → `user` set → `init()` runs → data loads from Supabase
4. On logout → `user` cleared → `<AuthModal />` shown again
5. Electron: skips all of this, `user` set to a fake local sentinel, `init()` runs immediately

### AppContext data flow (web branch)
- `loadData()` → `supabase.from('user_data').select('data').eq('user_id', user.id).single()`
- `saveData(d)` → `supabase.from('user_data').upsert({ user_id, data: d }, { onConflict: 'user_id' })`
- `loadSettings()` → same table, `select('settings')`
- `saveSettings(s)` → same table, upsert `settings` column

### Netlify setup (user does this after code is ready)
1. Push `feature/web-app` branch to GitHub
2. Go to app.netlify.com → New site → Import from GitHub → select repo
3. Branch: `feature/web-app` (or `main` once merged)
4. Build command: `npm run build:web`
5. Publish directory: `dist-web`
6. Add env vars: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (from Supabase project Settings → API)
