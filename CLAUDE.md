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
