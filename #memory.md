# 3D Print Tracker — Project Memory

## Stack
- **Runtime**: Electron v29 (Node.js main process + Chromium renderer)
- **UI**: Vanilla HTML / CSS / JavaScript — no frontend framework
- **Packaging**: electron-builder (Windows NSIS installer)
- **Data storage**: Local JSON files via Node.js `fs` (`data.json`, `settings.json` in AppData)
- **Mobile server**: Node.js `http` module (port 3000, same WiFi network)
- **API integration**: N3D Melbourne API (HTTPS proxy through main process)

## Project structure (as of v2.1.0 refactor)
```
3d-print-tracker/
├── main.js                    # Electron entry point (window + app lifecycle)
├── preload.js                 # Context bridge (exposes electronAPI to renderer)
├── package.json
├── .eslintrc.json             # ESLint config
├── src/
│   ├── index.html             # HTML shell + <script>/<link> tags only
│   ├── mobile.html            # Phone inventory companion UI
│   ├── styles/
│   │   └── main.css           # All app CSS (light + dark theme via CSS vars)
│   ├── js/                    # Renderer JS — all global scope, loaded in order
│   │   ├── utils.js           # esc(), colour helpers, getItems/getCategories/isReady
│   │   ├── state.js           # App state vars, loadData/saveData, init(), persist()
│   │   ├── render.js          # setView, setFilter, render, renderStats, updateDatalist
│   │   ├── products.js        # Product view, category sections, manage modal
│   │   ├── parts.js           # Part CRUD, status modal, sub-parts, completion modal
│   │   ├── inventory.js       # Inventory view, stock tracking, distribution log
│   │   ├── colours.js         # Colour view (group queued parts by filament)
│   │   ├── archive.js         # Archive view, archive/unarchive/delete product
│   │   ├── add-product.js     # Add product modal + image upload
│   │   ├── settings.js        # Settings modal, theme toggle, category manager
│   │   ├── files-3mf.js       # 3MF upload, slicer integration, folder handling
│   │   ├── import-export.js   # CSV import/export, conflict resolution flow
│   │   └── n3d.js             # N3D Melbourne design browser + import
│   └── main/                  # Electron main process modules (CommonJS)
│       ├── server.js          # Local HTTP server for mobile companion
│       └── ipc/
│           ├── data.js        # IPC: load-data, save-data, settings, local IP
│           ├── files.js       # IPC: CSV dialogs, 3MF upload, folder/image ops, slicer
│           └── n3d.js         # IPC: N3D API proxy
├── build-resources/
│   └── icon.ico
└── dist/                      # Built installer output (gitignored)
```

## Linting
- **Tool**: ESLint v8
- **Config**: `.eslintrc.json` in project root
- **Run**: `npm run lint` — checks all main process and renderer JS files
- **Auto-fix**: `npm run lint:fix`
- **On build**: lint runs automatically before `electron-builder` (`npm run build` = lint + build)
- **Rules summary**:
  - `eqeqeq` — enforce `===` (warn, null excepted)
  - `no-unused-vars` — warn on unused variables
  - `no-var` — prefer `let`/`const` (warn)
  - `prefer-const` — suggest const where possible (warn)
  - `semi` — require semicolons (warn)
  - `no-undef` — error on main process, warn on renderer (globals declared in config)
  - `no-duplicate-case`, `no-unreachable` — error/warn on logic bugs
- **Environments**: Node.js for `main.js`/`preload.js`/`src/main/**`, Browser for `src/js/**`

## Key conventions
- All renderer JS uses shared global scope (no ES modules / no bundler)
- Script load order in `index.html` matters — `utils.js` and `state.js` must load first
- Main process uses CommonJS `require`/`module.exports`
- IPC modules export a `register(ipcMain, ...)` function
- Data auto-saved to `AppData/Roaming/3d-print-tracker/data.json` on every change
- Git: ask for permission before committing

## Versions
- v1.0.0 — Initial release
- v2.0.0 — Category grouping, colour view, sub-parts, inventory, N3D integration, mobile companion
- v2.1.0 — UI polish, theme toggle, category manager, pre-sliced 3MF flag, manage modal, custom icon
- Codebase refactor — split index.html (2489 lines) and main.js into modular files
