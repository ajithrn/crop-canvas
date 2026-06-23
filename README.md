# CropCanvas

> A lightweight, browser-based image editor for precise canvas-cropped exports.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Deploy](https://img.shields.io/badge/deploy-GitHub%20Pages-brightgreen)

## Overview

CropCanvas lets you define a fixed-size canvas, drop images onto it, add text and shapes, reposition everything freely, and export only what's inside the canvas viewport. Overflow content is visible but dimmed during editing and excluded from the final export.

**Live:** [cc.trytoinnovate.com](https://cc.trytoinnovate.com)

## Features

- **Canvas presets** - 500x500, 1080x1080, 1200x630, 1920x1080, and more
- **Image drop** - drag-and-drop or file picker for PNG, JPEG, WebP, SVG
- **Shape tools** - rectangle, circle, line, arrow with fill/stroke controls
- **Text tool** - editable text with font, size, weight, color, alignment, rotation
- **Custom color picker** - inline hue/saturation picker with swatches
- **Undo/Redo** - full history stack (50 states)
- **Autosave** - work persists across page refreshes
- **Clipboard paste** - Ctrl+V to paste images from clipboard
- **Layer reorder** - drag-and-drop or up/down buttons, rename via double-click
- **Export** - PNG or JPEG with custom filename, respects layer order
- **Center-origin rulers** - 0 at canvas center
- **Zoom** - 25%-400% with Ctrl+scroll and fit-to-screen
- **Light/Dark mode** - theme toggle with persistence
- **Help guide** - built-in usage reference with tool icons and shortcuts

## Quick Start

```bash
git clone https://github.com/yourusername/CropCanvas.git
cd CropCanvas
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |

## Tech Stack

- **Vanilla HTML + CSS + JavaScript** - no UI framework
- **Vite** - dev server and optimized builds
- **ES Modules** - proper import/export
- **Modular CSS** - 13 focused files by concern

## Project Structure

```
├── index.html          # App shell (Vite entry)
├── package.json        # Scripts and dependencies
├── vite.config.js      # Build config
├── public/             # Static assets (CNAME)
├── src/css/            # 13 modular CSS files
├── src/js/             # 11 ES module files
└── docs/               # Architecture, dev guide, deployment, changelog
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `V` | Select tool |
| `T` | Add text |
| `I` | Add image |
| `R` | Rectangle |
| `C` | Circle |
| `L` | Line |
| `A` | Arrow |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+S` | Save |
| `Ctrl+V` | Paste image from clipboard |
| `Delete` / `Backspace` | Delete selected |
| `Arrow keys` | Nudge 1px |
| `Shift + Arrow` | Nudge 10px |
| `Ctrl + Scroll` | Zoom |

## Documentation

- [Architecture](docs/architecture.md) - System design and module overview
- [Development](docs/development.md) - Setup and contribution guide
- [Deployment](docs/deployment.md) - GitHub Pages deployment
- [Changelog](docs/changelog.md) - Version history

## License

MIT - see [LICENSE](LICENSE) for details.
