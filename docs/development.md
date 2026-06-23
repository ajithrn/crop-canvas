# Development Guide

## Prerequisites

- **Node.js** 18+ (for Vite dev server and build)
- Any modern browser (Chrome, Firefox, Safari, Edge)

## Setup

```bash
git clone https://github.com/yourusername/CropCanvas.git
cd CropCanvas
npm install
```

## Running Locally

```bash
npm run dev
```

Opens a dev server at `http://localhost:5173` with hot module replacement.

## Building for Production

```bash
npm run build
npm run preview  # preview the build
```

## Project Structure

```
├── index.html              # App shell (Vite entry point)
├── package.json
├── vite.config.js
├── public/CNAME
├── src/
│   ├── main.js            # Entry: imports CSS + initializes app
│   ├── css/               # 13 modular CSS files
│   └── js/                # 11 ES module files
└── docs/
```

## Module Overview

| Module | Responsibility |
|--------|----------------|
| `app.js` | Orchestrator - init, toolbar, tools, workspace events, keyboard, help, settings |
| `canvas.js` | Viewport sizing, zoom, rulers, coordinate mapping, background |
| `image.js` | Image file loading, positioning, resize |
| `text.js` | Text element CRUD, inline editing, alignment |
| `shapes.js` | Shape creation (rect, circle, line, arrow), rendering, properties |
| `export.js` | Render all elements to offscreen canvas, download |
| `selection.js` | Select, deselect, delete, drag, resize, nudge |
| `history.js` | Undo/redo stack, autosave to localStorage, restore, reset |
| `properties.js` | Panel input bindings, apply changes, update display |
| `layers.js` | Render layer list with icons and visibility toggles |
| `colorpicker.js` | Custom inline color picker (HSV + hex + swatches) |

## CSS Organization

| File | What to edit here |
|------|-------------------|
| `tokens.css` | Colors, spacing, radii, transitions, theme variables |
| `base.css` | Global reset, body styles, scrollbar |
| `topbar.css` | Header bar, logo, size inputs, zoom, control groups |
| `toolbar.css` | Left tool rail buttons, dividers |
| `workspace.css` | Canvas grid, rulers, viewport, overflow mask |
| `dropzone.css` | Drop overlay inside viewport |
| `panel.css` | Right panel shell, tabs, empty states |
| `properties.css` | Form inputs, selects, color fields, style buttons |
| `layers.css` | Layer list items |
| `export.css` | Export section UI |
| `elements.css` | Element wrappers, resize handles, shapes |
| `colorpicker.css` | Color picker popover |
| `help.css` | Help popup and sections |
| `utilities.css` | Statusbar, animations, focus, responsive |

## Adding a New Tool

1. Add a `<button>` in the `#tool-rail` section of `index.html`
2. Handle it in `app.js` -> `setTool()` function
3. Create a new module in `src/js/` if needed (follow `shapes.js` pattern)
4. Import it in `app.js`
5. Add properties UI in the right panel
6. Update `properties.js` to bind and apply the new properties
7. Update `export.js` to render the new element type
8. Update `selection.js` if the element needs special drag/resize behavior
9. Update `history.js` snapshot if new state arrays are added
10. Add CSS in a new or existing `src/css/` file and import in `main.js`

## Code Conventions

- **ES modules** - use import/export, no globals
- **No framework** - keep it vanilla JS
- **camelCase** for variables/functions
- **Modular CSS** - one file per UI concern, CSS custom properties for theming
- **Semantic HTML** with aria-label on interactive elements
- Prefer `const` over `let`, avoid `var`
- No emdashes in user-facing text (use hyphens)
