# Architecture

## Overview

CropCanvas is a client-side web application built with vanilla HTML, CSS, and JavaScript. It uses Vite as a build tool for development and production optimization, with ES modules for code organization and modular CSS split by concern.

No UI framework. No runtime dependencies. The build output is static HTML/CSS/JS.

## Module Architecture

```
src/main.js (entry point)
 ├── imports all CSS modules (13 files)
 └── imports & initializes app.js

src/js/
 ├── app.js ─────────── Main orchestrator (init, toolbar, tools, workspace, keyboard, help)
 │   ├── imports canvas.js, image.js, text.js, shapes.js, export.js
 │   ├── imports selection.js, history.js, properties.js, layers.js
 │   └── imports colorpicker.js
 │
 ├── canvas.js ──────── Viewport, zoom, rulers, coordinates
 ├── image.js ───────── Image layer manager
 ├── text.js ────────── Text layer manager
 ├── shapes.js ──────── Shape layer manager (rect, circle, line, arrow)
 ├── export.js ──────── Offscreen canvas render & download
 ├── selection.js ───── Select, deselect, drag, resize, nudge
 ├── history.js ─────── Undo/redo stack, autosave, restore, reset
 ├── properties.js ──── Panel bindings, applyProps, updatePropertiesPanel
 ├── layers.js ──────── Layer list rendering
 └── colorpicker.js ─── Custom inline color picker
```

## CSS Architecture

CSS is split into 13 files, imported in order by `main.js`:

| File | Responsibility |
|------|---------------|
| `tokens.css` | Design tokens, color themes (dark/light), spacing, radii |
| `base.css` | Reset, body, #app layout, scrollbar |
| `topbar.css` | Header bar, logo, canvas size inputs, zoom controls |
| `toolbar.css` | Left tool rail (icon buttons, dividers) |
| `workspace.css` | Canvas area grid, rulers, viewport, grid overlay, overflow mask |
| `dropzone.css` | Image drop zone overlay |
| `panel.css` | Right panel container, tabs, empty states |
| `properties.css` | Property form fields, inputs, selects, color fields |
| `layers.css` | Layer list items, drag-to-reorder, rename input |
| `export.css` | Export section (range slider, download button) |
| `elements.css` | Canvas element wrappers, resize handles, text/image/shape elements |
| `colorpicker.css` | Custom color picker popover |
| `help.css` | Help popup overlay, sections, tools list |
| `utilities.css` | Status bar, theme icons, animations, focus states, responsive |

## Data Flow

1. User actions (clicks, drags, key presses) are captured by `app.js`
2. `app.js` delegates to selection.js for interaction, then to element modules
3. Each element module (image, text, shapes) manages its own data array and DOM rendering
4. State changes trigger `pushHistory()` in history.js for undo/redo and autosave
5. Layer order is determined by DOM order in viewport-content (later = on top)
6. Export reads all visible elements sorted by DOM index, draws sequentially to respect stacking

## State Management

- No framework - state is held in module-scoped variables/arrays
- History - JSON snapshots of all element arrays, max 50 states
- Autosave - debounced localStorage persistence after every state change
- ID counters - each module tracks its own idCounter, updated on state restore to prevent duplicate IDs
- Theme - persisted via localStorage
- Canvas size - held in canvas module, reflected in topbar inputs

## UI Layout

```
┌─────────────────────────────────────────────────────────┐
│ TOPBAR: logo | undo/redo | W x H preset | zoom | save/reset │
├────┬────────────────────────────────────────────┬───────┤
│    │  ┌─ ruler (center-origin) ──────────────┐  │       │
│ T  │  │                                      │  │ PANEL │
│ O  │ R│   ┌─────────────────────┐            │  │       │
│ O  │ U│   │  VIEWPORT + GRID    │            │  │ Props │
│ L  │ L│   │  (centered, export) │            │  │ Layer │
│    │ E│   └─────────────────────┘            │  │ Export│
│ R  │ R│       dimmed overflow                │  │       │
│ A  │  └──────────────────────────────────────┘  │ Canvas│
│ I  │            WORKSPACE + GRID                │ Setngs│
│ L  │                                            │       │
├────┴────────────────────────────────────────────┴───────┤
│ STATUSBAR: size . zoom . mouse . selection              │
└─────────────────────────────────────────────────────────┘
```

- **Left:** Compact icon-only tool rail (Select, Text, Image, shapes, theme, help)
- **Center:** Workspace with centered viewport, rulers, grid
- **Right:** Properties/Layers/Export tabs + Canvas Settings card

## Key Design Decisions

1. **DOM-based elements** - elements are HTML divs/imgs/svgs for native interaction. Only export uses the Canvas API.
2. **Overflow mask via box-shadow** - a single div with a massive box-shadow creates the crop preview.
3. **ES modules** - proper import/export for clean dependency management. Vite handles bundling.
4. **Zoom via CSS transform** - viewport content scales via transform: scale(), keeping coordinate math simple.
5. **Center-origin coordinates** - rulers and mouse position use 0,0 at viewport center.
6. **Modular CSS** - no preprocessor needed. Plain CSS split by component.
7. **Autosave** - debounced localStorage save so work is never lost.
8. **DOM order = layer order** - element stacking is controlled by DOM position, not z-index values. Reordering layers moves DOM nodes directly.
9. **Sequential export** - elements are drawn one at a time in DOM order to guarantee correct stacking in the output file.
10. **Clipboard integration** - paste event listener handles image data from clipboard for quick image insertion.
