# 3D Print Tracker — assistant project memory

Permanent context for AI coding agents working in this repo: stack, layout, conventions, sharp edges, and planned work. Update this file when architecture or workflows materially change.

---

## Stack

- **Desktop**: Electron 29 (CommonJS `main` + `preload`), Chromium renderer.
- **UI**: React 18, Vite 5, JSX, Context API only (no component library).
- **Packaging**: electron-builder, Windows NSIS → `dist/`.
- **Data**: `data.json` + `settings.json` under the app userData dir (typically `%APPDATA%\3d-print-tracker\` on Windows).
- **Companion**: Node `http` server in `src/main/server.js`, binds `0.0.0.0`, port 3000 with auto-retry up to +10; serves `src/mobile.html`.
- **N3D Melbourne**: HTTPS `https://www.n3dmelbourne.com/api/v1` — primary path is **renderer `fetch`** (`src/lib/n3dClient.js`, Bearer auth per [public API summary](https://www.n3dmelbourne.com/llms.txt) / [designs API docs](https://www.n3dmelbourne.com/resources/docs/designs-api)); **fallback** to main-process proxy (`src/main/ipc/n3d.js`) on transport failures in Electron only.

---

## Repository layout (high-signal files)

```
3d-print-tracker/
├── main.js                 # BrowserWindow, localfile:// protocol, IPC registration, server start
├── preload.js              # contextBridge → window.electronAPI (invoke + subscription cleanup)
├── vite.config.js
├── package.json
├── .eslintrc.json          # Node: main/preload/src/main; browser: src/**/*.jsx, src/lib
├── CLAUDE.md               # This file — agent-oriented project memory
├── src/
│   ├── index.html, main.jsx, App.jsx
│   ├── mobile.html         # Phone UI; relative fetch to /data, /inventory
│   ├── styles/main.css
│   ├── context/AppContext.jsx   # All app state + persistence + most IPC wrappers
│   ├── views/, modals/          # ProductView, InventoryView, N3DModal, …
│   ├── lib/n3dClient.js    # fetch-first N3D client + Electron IPC fallback
│   └── main/
│       ├── server.js         # GET /data, POST /inventory (validated), GET /
│       └── ipc/data.js, files.js, n3d.js
```

---

## Commands

- **`npm run dev`**: Vite (5173) + Electron (loads dev URL).
- **`npm run dev:web`**: Vite only (browser; no `electronAPI` except stubs — localStorage for data in context).
- **`npm run lint` / `lint:fix`**: ESLint (`main.js`, `preload.js`, `src/main/**/*.js`, `src/lib/**/*.js`, `src/**/*.jsx`).
- **`npm run build`**: lint → `vite build` → `electron-builder --win`.
- **`npm run build:web`**: production static assets → `dist-web/`.

---

## Conventions

- **`AppContext.jsx`** is the single source of truth: state, derived helpers, save/load, modal triggers.
- **`isElectron`**: `!!window.electronAPI` — gates dialogs, disk paths, `localfile://` images, optional N3D image download to product folder.
- **`localFileUrl(path)`** (in `AppContext.jsx`): maps absolute disk paths to `localfile:///…` for the custom protocol in `main.js` (dev + prod).
- **IPC modules** export `register(ipcMain, …)`.
- **Main = CommonJS**; **renderer = ESM**.
- **Persistence shape** written by `saveData`: `{ parts, products, inventory, expandedCats }` (+ whatever else the app adds over time).
- **`threeMfFiles`**: array of **filename strings** (e.g. from 3MF upload IPC returning `fileName`); not `{ files: [] }`.
- **Git**: confirm with the user before committing.

---

## Mobile server & security posture

- Binds **LAN-wide** by design (`0.0.0.0`). **`POST /inventory`**:
  - Max body **512 KiB**; rejects invalid JSON; validates a **normalized inventory row** (safe `id`, required `name`, numeric `built`, sanitized `storage` map, capped `distributions`).
  - Merges into an existing row by `id` so old/extra fields are preserved; appends if new.
- **`GET /data`**: full snapshot (any device on LAN can read). Accepted for this project.
- CORS: `*` for simple phone client.

---

## N3D UI behaviour (`N3DModal.jsx`)

- Query params align with API: **`category`**: `'' | standard | character`; **`profile`**: `ams | split` (default **ams**).
- **`loadPage`** does not gate on stale `totalPages`; API pagination is authoritative.
- **Auto-connect**: on first open, if `appSettings.n3dApiKey` was already set, validates via `/version` then loads page 1; **Strict Mode**: async work cancelled on unmount to avoid double state updates dominating.
- Cover images for imports: Electron + `threeMfFolder` only; web can still browse/import metadata.

---

## Known integration details

- **`userData` path**: `main.js` calls `app.setPath('userData', …/3d-print-tracker)` so the **installed EXE** and **`npm start`** share `%APPDATA%\3d-print-tracker`. Without this, Windows used different Roaming folder names from `productName` vs package `name`, which looked like “data wiped” (sample data only).
- **`upload-image` IPC** returns `{ ok, destPath }` (not `path`). Call sites accept `destPath || path`.
- **`upload-3mf` IPC** returns `{ fileName, destPath, productFolder }` or `{ error }` — not `files[]`.
- **`get-local-ip` IPC** returns **`IPv4:port`** (e.g. `192.168.1.5:3000`). Inventory UI explains host/port and warns if host looks like localhost.
- **`onInventoryUpdated` in preload**: registers listener and returns **cleanup**; `AppContext` unsubscribes on unmount.

---

## Optional future: `feature/web-app` (not started)

Goal: hosted SPA + cloud sync while keeping Electron on local files.

| Area | Direction |
|------|-----------|
| Backend | Supabase (auth + Postgres JSON for `data` / `settings` mirroring current JSON) |
| Hosting | Netlify; build `dist-web`; env `VITE_SUPABASE_*` |
| Renderer | `AuthModal`, `src/lib/supabase.js`, gate `App.jsx` when web + no session |
| **N3D on web** | Already feasible via `n3dClient.js` fetch; hide or rate-limit if needed for public users |

Detailed SQL / Netlify steps were in older notes; re-derive from Supabase docs when implementing.

---

## Changelog (recent substantive work)

- **Phase 3**: Deleted `src/js/` (13 vanilla JS files). Confirmed dead code — React app loads `src/index.html` via Vite, never referenced `src/js`. Removed `src/js` ESLint override.
- Renderer **N3D** `fetch` + IPC fallback; modal enabled on web with copy about local-only images.
- **N3D filters** synced to API enums; link to official API docs.
- **Inventory phone URL** clarified (host/port + localhost hint).
- **Mobile `POST /inventory`**: size cap + validation + merge updates.
- **IPC image / 3MF** result shape fixes in `AppContext` / `AddProductModal`.
- **ProductView** render-time `products` mutation removed.
- **preload** inventory listener cleanup; **image download** redirect handling in `ipc/files.js`.
- Removed unused **`optionalDependencies`** Linux Rollup stub from `package.json`.

---

## When editing

- Match existing style: minimal diffs, no drive-by refactors.
- After logic changes in `src/` or `main`, run **`npm run lint`**.
- Do not expand scope beyond the task unless the user asks.
