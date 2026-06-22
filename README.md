# CropCanvas

> A lightweight, browser-based image editor for precise canvas-cropped exports.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Deploy](https://img.shields.io/badge/deploy-GitHub%20Pages-brightgreen)

## Overview

CropCanvas lets you define a fixed-size canvas (e.g. 1200×630), drop an image onto it, reposition and resize the image freely, add rotatable text labels, and export **only what's inside the canvas viewport**. Overflow content is visible but dimmed during editing and excluded from the final export.

**Live:** [cc.trytoinnovate.com](https://cc.trytoinnovate.com)

## Features

- **Canvas Setup** — Define width × height with presets (Instagram, OG, HD, etc.)
- **Image Drop** — Drag-and-drop or file picker for PNG, JPEG, WebP, SVG
- **Image Manipulation** — Drag to reposition, handles to resize, aspect ratio lock
- **Overflow Visualization** — Content outside viewport shown dimmed
- **Text Tool** — Add, edit, style, and rotate text labels
- **Export** — PNG or JPEG export of viewport area only
- **Undo / Redo** — Full history stack (50 states) with keyboard shortcuts
- **Pixel Rulers** — Horizontal and vertical rulers with px tick marks
- **Zoom** — 25%–400% with scroll-to-zoom and fit-to-screen
- **Light / Dark Mode** — Toggle with localStorage persistence

## Quick Start

No build step required. Just open `index.html` in a browser:

```bash
# Clone the repo
git clone https://github.com/yourusername/CropCanvas.git
cd CropCanvas

# Open in browser
open index.html
# or use a local server
npx serve .
```

## Tech Stack

- **Pure HTML + CSS + JavaScript** — zero dependencies, no build step
- **HTML5 Canvas API** — for rendering and export
- Runs entirely in the browser — no server needed

## Project Structure

```
CropCanvas/
├── index.html              # Main HTML
├── css/
│   └── style.css           # Design system & styles
├── js/
│   ├── app.js              # Main controller
│   ├── canvas.js           # Viewport/workspace/zoom/rulers
│   ├── image.js            # Image loading & manipulation
│   ├── text.js             # Text creation & editing
│   └── export.js           # Offscreen canvas export
├── docs/                   # Documentation
│   ├── architecture.md     # System architecture
│   ├── development.md      # Dev guide
│   ├── deployment.md       # Deploy & hosting
│   └── changelog.md        # Version history
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Pages deploy action
├── CNAME                   # Custom domain for GitHub Pages
└── README.md               # This file
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `V` | Select tool |
| `T` | Add text |
| `I` | Add image |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Delete` / `Backspace` | Delete selected |
| `Arrow keys` | Nudge 1px |
| `Shift + Arrow` | Nudge 10px |
| `Ctrl + Scroll` | Zoom |

## Documentation

- [Architecture](docs/architecture.md) — System design and module overview
- [Development](docs/development.md) — Setup and contribution guide
- [Deployment](docs/deployment.md) — GitHub Pages deployment with custom domain
- [Changelog](docs/changelog.md) — Version history

## License

MIT License — see [LICENSE](LICENSE) for details.
