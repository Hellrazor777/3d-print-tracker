# 3D Print Tracker

A desktop application for tracking 3D printing projects, parts, filament colours and inventory — built with Electron for Windows.

---

## Features

### Products & Parts
- Organise parts under products with category grouping
- Track status per part: **planning → queue → printing → ready to build → done**
- Sub-parts with their own status and printed count
- Multi-colour filament tracking per part with colour swatches
- Inline quantity editing directly on the part row
- Shiny variant flag (✨) for alternate colour versions
- Designer, source (Patreon / Thangs / MakersWorld / Other) and description per product

### 3MF File Management
- Upload pre-sliced .3MF files organised into per-product folders
- Mark files as **pre-sliced and ready to print** (green ✓ badge)
- Open product folder in Windows Explorer with one click
- Open .3MF files in Bambu Studio or Orca Slicer
- Filter products by 3MF status

### N3D Melbourne API Integration
- Browse the full N3D Melbourne design catalogue inside the app
- Import designs with filament colours, print times and thumbnails auto-filled
- Supports AMS, Split and MC print profiles
- Requires an active [N3D Melbourne Patreon](https://www.patreon.com/n3dmelbourne) subscription and API key

### Inventory Tracking
- Add completed builds with built / distributed / on hand counts
- Box and shelf location split with locked totals
- Log outgoing stock by destination: store, markets, or website
- Shelf-first stock deduction with box stock alert
- Archive completed products with restart-from-scratch option

### Colour View
- Groups all queued parts by filament colour
- See at a glance which colours to load for your next print run

### Mobile Companion
- Access inventory from your phone browser on the same WiFi network
- Large tap-friendly +/- buttons — no keyboard needed
- Real-time sync back to the desktop app

---

## Requirements

- Windows 10 or later
- [Node.js LTS](https://nodejs.org) — for building only

---

## Installation

### Option 1 — Download the installer
Download the latest `3D Print Tracker Setup 2.0.0.exe` from the [Releases](../../releases) page and run it.

### Option 2 — Build from source

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/3d-print-tracker.git
cd 3d-print-tracker

# Install dependencies
npm install

# Run without installing (dev mode)
npm start

# Build the Windows installer (run terminal as Administrator)
npm run build
```

The installer will be at `dist/3D Print Tracker Setup 2.0.0.exe`.

---

## First-time Setup

1. **Set your 3MF folder** — click ⚙ Settings and choose a root folder for .3MF files. A subfolder is created automatically for each product.
2. **Set your slicer** — choose Bambu Studio or Orca Slicer in Settings. Set a custom path if installed in a non-default location.
3. **N3D API key** — if you have an N3D Melbourne Patreon subscription, click **N3D browse** and enter your API key from [n3dmelbourne.com/dashboard/tools](https://www.n3dmelbourne.com/dashboard/tools?tab=api).

---

## Mobile Companion

1. Make sure your phone and PC are on the same WiFi network
2. Open the **Inventory** tab and click **show phone URL**
3. Type that URL into your phone's browser (e.g. `http://192.168.1.x:3000`)
4. Bookmark it to your home screen for quick access

---

## Data Location

Your data is stored locally on your PC:

| File | Location |
|------|----------|
| App data | `C:\Users\<Name>\AppData\Roaming\3d-print-tracker\data.json` |
| Settings | `C:\Users\<Name>\AppData\Roaming\3d-print-tracker\settings.json` |

Back up these files to preserve your data across reinstalls.

---

## Tech Stack

- [Electron](https://www.electronjs.org/) — desktop app framework
- [electron-builder](https://www.electron.build/) — Windows installer packaging
- Vanilla HTML / CSS / JavaScript — no frontend framework
- Node.js `http` / `https` — local mobile server and N3D API proxy

---

## Changelog

### v2.1.0
- Capitalised all toolbar buttons, tab labels and stat headings
- Renamed "rename" to "Manage" — now includes delete product option
- Theme toggle in Settings: Auto / Light / Dark with persistent preference
- Category manager in Settings — add, rename and delete categories globally
- Pre-sliced 3MF flag with green ✓ badge and dedicated filter
- Fixed N3D website link URL (/design/ not /designs/)
- Designer and source fields added to product details
- Custom app icon (3D printer)

### v2.0.0
- Category grouping with collapsible sections
- In-progress section floats to top of Products view
- Planning status added to the workflow
- Colour tab groups queued parts by filament colour
- Sub-parts with individual qty, count and status
- Product image / icon support with N3D auto-download
- Designer, source and description fields per product
- Pre-sliced 3MF flag with green ✓ badge
- Shiny variant flag with ✨ badge
- N3D website link per product
- Mobile companion inventory app
- Inventory with box/shelf split and outgoing distribution log
- Archive with restart-from-scratch while keeping history
- Settings panel for 3MF folder and slicer paths

### v1.0.0
- Initial release

---

## License

MIT — free to use, modify and distribute.
