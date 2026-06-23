# Changelog

All notable changes to CropCanvas are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.0.0] - 2026-06-23

Complete rewrite with modular architecture, new UI, and expanded toolset.

### Added
- **Vite build system** - dev server with hot reload, optimized production builds
- **ES modules** - proper import/export, no more IIFE globals
- **Modular CSS** - 13 focused files (~50-80 lines each) instead of one monolithic stylesheet
- **Shape tools** - Rectangle (R), Circle (C), Line (L), Arrow (A) with fill, stroke, stroke width, and corner radius
- **Text alignment** - left/center/right alignment buttons
- **Custom color picker** - inline popover with saturation square, hue bar, hex input, and 20 preset swatches
- **Autosave** - state saved to localStorage on every change, restored on page load
- **Save button** - explicit save (Ctrl+S) in addition to autosave
- **Reset button** - clears canvas with confirmation
- **Help popup** - scrollable guide covering tools, zoom, properties, layers, shortcuts, export, and tips
- **Canvas grid** - 50px grid overlay on viewport with toggle
- **Canvas Settings** - collapsible card with background color picker and grid toggle
- **Center-origin rulers** - 0 at viewport center, counting outward
- **Viewport centering** - canvas always centered in workspace via CSS flexbox
- **Theme-aware defaults** - text color and canvas background adapt to light/dark mode
- **Responsive breakpoints** - UI adapts on smaller screens

### Changed
- **Default theme** - light mode (most print surfaces are white)
- **Default canvas** - 500x500
- **Topbar** - grouped controls (undo/redo | canvas size + presets | zoom), no export button
- **Tool rail** - icon-only left rail with shape tools, theme toggle at bottom, help button
- **Right panel** - always visible with Properties/Layers/Export tabs
- **Preset behavior** - shows canvas at 100% zoom
- **Bigger inputs** - 32px height, 12px font for accessibility
- **JS split** - app.js refactored into app.js, selection.js, history.js, properties.js, layers.js

### Removed
- Old IIFE module pattern
- Monolithic CSS file
- Manual script load order
- Resizable panel dividers
- Export button in topbar (use Export tab)
- Panel collapse toggle
- Delete button from tool rail (use keyboard or properties)
- OS native color picker

### Credits
- **Status bar credits** - author link (ajithrn.com), Buy Me a Coffee link, GitHub repo link in footer

## [1.0.0] - 2026-06-23

### Added
- **Canvas Setup** — configurable width × height with preset sizes (Instagram, OG, HD, 720p, Small)
- **Image Loading** — drag-and-drop and file picker support for PNG, JPEG, WebP, SVG
- **Image Manipulation** — drag to reposition, corner/edge handles to resize, aspect ratio lock
- **Overflow Visualization** — semi-transparent overlay dims content outside viewport
- **Text Tool** — add text elements with font family, size, color, bold/italic styling
- **Text Rotation** — slider and preset buttons (0°, 45°, 90°, −90°)
- **Inline Text Editing** — double-click to edit text content directly
- **Export** — PNG and JPEG export with quality control for JPEG
- **Undo / Redo** — 50-state history stack with Ctrl+Z / Ctrl+Shift+Z
- **Pixel Rulers** — horizontal and vertical rulers with tick marks synced to zoom/scroll
- **Zoom** — 25%–400% range with button controls, Ctrl+scroll, fit-to-screen
- **Dark / Light Mode** — theme toggle with localStorage persistence
- **Layers Panel** — element list with visibility toggle
- **Properties Panel** — context-sensitive controls for selected element
- **Status Bar** — canvas size, zoom level, mouse coordinates, selection info
- **Keyboard Shortcuts** — tool switching (V/T/I), delete, arrow nudge (1px / 10px)
- **GitHub Pages Deployment** — automated via GitHub Actions
- **Custom Domain Support** — CNAME for cc.trytoinnovate.com
- **Documentation** — architecture, development, and deployment guides
