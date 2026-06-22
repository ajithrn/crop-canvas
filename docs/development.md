# Development Guide

## Prerequisites

- Any modern web browser (Chrome, Firefox, Safari, Edge)
- A text editor
- (Optional) A local HTTP server for development

## Setup

```bash
git clone https://github.com/yourusername/CropCanvas.git
cd CropCanvas
```

## Running Locally

Since CropCanvas is pure HTML/CSS/JS with no build step, you can simply open the file:

```bash
open app/index.html
```

For a proper local server (recommended for consistent behavior):

```bash
# Using npx serve
npx serve app

# Using Python
python3 -m http.server 8000 --directory app

# Using PHP
php -S localhost:8000 -t app
```

## Project Structure

```
app/
├── index.html          # Main HTML — all UI structure
├── css/
│   └── style.css       # Design tokens, layout, components
└── js/
    ├── canvas.js       # CanvasManager — viewport, zoom, rulers
    ├── image.js        # ImageManager — image loading & manipulation
    ├── text.js         # TextManager — text creation & editing
    ├── export.js       # ExportEngine — offscreen canvas export
    └── app.js          # App — main controller, wires everything
```

## Module Overview

| Module | Global Object | Responsibility |
|--------|---------------|----------------|
| `canvas.js` | `CanvasManager` | Viewport sizing, zoom, rulers, coordinate mapping |
| `image.js` | `ImageManager` | Image file loading, positioning, resize data |
| `text.js` | `TextManager` | Text element CRUD, inline editing, rotation |
| `export.js` | `ExportEngine` | Render to offscreen canvas, download as blob |
| `app.js` | `App` | Event wiring, selection, drag/resize, undo/redo, UI |

## Script Load Order

Scripts must load in this order (each depends on previous):
1. `canvas.js` — no dependencies
2. `image.js` — depends on `CanvasManager`
3. `text.js` — depends on `CanvasManager`
4. `export.js` — depends on `CanvasManager`, `ImageManager`, `TextManager`
5. `app.js` — depends on all above

## CSS Design System

All styling uses CSS custom properties defined in `:root` and `[data-theme]` selectors:

- `--bg-*` — background colors
- `--text-*` — text colors
- `--border-*` — border colors
- `--accent` — primary accent (purple)
- `--shadow-*` — elevation shadows
- `--radius-*` — border radii
- `--transition-*` — animation timings

## Adding a New Tool

1. Add a button in `#toolbox` section of `index.html`
2. Add handler in `app.js` → `setTool()` function
3. Create a new manager module if needed (follow `TextManager` pattern)
4. Add properties UI in the right panel
5. Update `ExportEngine` to render the new element type

## Code Conventions

- **No frameworks or bundlers** — keep it vanilla
- **IIFE module pattern** — each file exposes one global
- **camelCase** for variables/functions, **PascalCase** for module names
- **Semantic HTML** with proper ARIA labels
- **CSS custom properties** for all theme-able values
