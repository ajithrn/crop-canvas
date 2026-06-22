# Architecture

## Overview

CropCanvas is a client-side only web application built with vanilla HTML, CSS, and JavaScript. It has no build step, no dependencies, and runs entirely in the browser.

## Module Architecture

```
┌──────────────────────────────────────────────────┐
│                    index.html                     │
│              (DOM structure & layout)             │
├──────────────┬───────────────────────────────────┤
│  style.css   │           JavaScript Modules       │
│  (Design     │  ┌─────────────────────────────┐  │
│   System)    │  │          app.js              │  │
│              │  │  (Main Controller)           │  │
│              │  │  - Event wiring              │  │
│              │  │  - Selection management      │  │
│              │  │  - Drag / Resize logic       │  │
│              │  │  - Undo / Redo history       │  │
│              │  │  - Keyboard shortcuts        │  │
│              │  │  - Properties panel          │  │
│              │  │  - Layers panel              │  │
│              │  └──────┬──────────────────────┘  │
│              │         │ coordinates              │
│              │  ┌──────┴──────────────────────┐  │
│              │  │       canvas.js              │  │
│              │  │  (Viewport & Workspace)      │  │
│              │  │  - Canvas size management    │  │
│              │  │  - Zoom (25%–400%)           │  │
│              │  │  - Pixel rulers              │  │
│              │  │  - Overflow mask             │  │
│              │  │  - Mouse-to-canvas mapping   │  │
│              │  └─────────────────────────────┘  │
│              │  ┌─────────────────────────────┐  │
│              │  │       image.js               │  │
│              │  │  - Image loading (DnD/file)  │  │
│              │  │  - Position & resize data    │  │
│              │  │  - DOM element rendering     │  │
│              │  └─────────────────────────────┘  │
│              │  ┌─────────────────────────────┐  │
│              │  │       text.js                │  │
│              │  │  - Text element creation     │  │
│              │  │  - Inline editing            │  │
│              │  │  - Font/color/rotation       │  │
│              │  └─────────────────────────────┘  │
│              │  ┌─────────────────────────────┐  │
│              │  │       export.js              │  │
│              │  │  - Offscreen canvas render   │  │
│              │  │  - PNG/JPEG blob download    │  │
│              │  └─────────────────────────────┘  │
└──────────────┴───────────────────────────────────┘
```

## Data Flow

1. **User actions** (clicks, drags, key presses) are captured by `app.js`
2. `app.js` delegates to the appropriate module (`ImageManager`, `TextManager`, `CanvasManager`)
3. Each module manages its own data array and DOM rendering
4. State changes trigger `pushHistory()` in `app.js` for undo/redo
5. Export reads all element data and renders to an offscreen `<canvas>`

## State Management

- **No framework** — state is held in module-scoped arrays/variables
- **History** — JSON snapshots of all element arrays, max 50 states
- **Theme** — persisted via `localStorage`
- **Canvas size** — held in `CanvasManager`, reflected in toolbar inputs

## UI Layout

Three-panel layout inspired by professional design tools:
- **Left:** Tool palette (Select, Text, Image, Delete)
- **Center:** Zoomable workspace with pixel rulers and viewport
- **Right:** Layers list + context-sensitive properties panel

## Key Design Decisions

1. **DOM-based elements** instead of canvas-rendered: elements are HTML `<div>`/`<img>` for easy interaction (drag, click, contentEditable). Only export uses the Canvas API.
2. **Overflow mask via box-shadow**: A single `<div>` with a massive box-shadow creates the viewport crop preview without clipping actual elements.
3. **Module pattern (IIFE)**: Each JS file exposes a single global object. No module bundler needed.
4. **Zoom via CSS transform**: The viewport content container scales via `transform: scale()`, keeping coordinate math simple.
