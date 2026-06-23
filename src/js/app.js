/**
 * Main Application Controller — slim orchestrator
 * Wires modules, handles toolbar, tools, workspace events, keyboard, help.
 */
import * as Canvas from './canvas.js';
import * as ImageManager from './image.js';
import * as TextManager from './text.js';
import * as ShapeManager from './shapes.js';
import { exportCanvas } from './export.js';
import { pushHistory, undo, redo, resetHistory, forceSave, restoreSavedState, clearSavedState, setOnRestore } from './history.js';
import { selectElement, deselectAll, deleteSelected, getSelectedId, startDrag, handleDrag, startResize, handleResize, endInteraction, getIsDragging, getIsResizing, nudge, setOnSelectionChange } from './selection.js';
import { bindProperties, switchToTab, updatePropertiesPanel } from './properties.js';
import { updateLayers } from './layers.js';

export function init() {
  Canvas.init();
  initTheme();
  bindToolbar();
  bindTools();
  bindWorkspace();
  bindProperties();
  bindExport();
  bindKeyboard();
  bindHelp();
  bindCanvasSettings();
  bindSaveReset();

  // Wire callbacks
  setOnRestore(() => { deselectAll(); updateLayers(); updateExportInfo(); });
  setOnSelectionChange(() => { switchToTab('properties'); updatePropertiesPanel(); updateLayers(); });

  // Restore or start fresh
  if (!restoreSavedState()) {
    showWelcome();
    pushHistory();
  } else {
    updateLayers();
    updateExportInfo();
    if (ImageManager.getImages().length === 0 && TextManager.getTexts().length === 0 && ShapeManager.getShapes().length === 0) {
      showWelcome();
    }
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => Canvas.resetZoom());
  });
}

// --- Theme ---
function initTheme() {
  const saved = localStorage.getItem('cropcanvas-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('cropcanvas-theme', next);
    Canvas.drawRulers();
  });
}

// --- Toolbar ---
function bindToolbar() {
  const wInput = document.getElementById('canvas-width');
  const hInput = document.getElementById('canvas-height');

  wInput.addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); });
  hInput.addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); });
  wInput.addEventListener('blur', applyCanvasSize);
  hInput.addEventListener('blur', applyCanvasSize);

  document.getElementById('canvas-presets').addEventListener('change', (e) => {
    const val = e.target.value;
    if (!val) return;
    const [w, h] = val.split('x').map(Number);
    wInput.value = w;
    hInput.value = h;
    Canvas.setCanvasSize(w, h);
    pushHistory();
    updateExportInfo();
    setTimeout(() => Canvas.resetZoom(), 50);
  });

  document.getElementById('zoom-in-btn').addEventListener('click', () => Canvas.zoomIn());
  document.getElementById('zoom-out-btn').addEventListener('click', () => Canvas.zoomOut());
  document.getElementById('zoom-level').addEventListener('click', () => Canvas.resetZoom());
  document.getElementById('zoom-fit-btn').addEventListener('click', () => Canvas.fitToScreen());

  document.getElementById('undo-btn').addEventListener('click', undo);
  document.getElementById('redo-btn').addEventListener('click', redo);
}

function applyCanvasSize() {
  const w = parseInt(document.getElementById('canvas-width').value) || 500;
  const h = parseInt(document.getElementById('canvas-height').value) || 500;
  Canvas.setCanvasSize(w, h);
  pushHistory();
  updateExportInfo();
  setTimeout(() => Canvas.resetZoom(), 50);
}

// --- Tools ---
function bindTools() {
  document.querySelectorAll('.rail-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => setTool(btn.dataset.tool));
  });
}

function setTool(tool) {
  document.querySelectorAll('.rail-btn[data-tool]').forEach(b => {
    b.classList.toggle('active', b.dataset.tool === tool);
  });
  if (tool === 'image') {
    document.getElementById('image-file-input').click();
  } else if (tool === 'text') {
    const data = TextManager.addText();
    selectElement(data.id);
    pushHistory();
    updateLayers();
    setTool('select');
  } else if (['rect', 'circle', 'line', 'arrow'].includes(tool)) {
    const data = ShapeManager.addShape(tool);
    selectElement(data.id);
    pushHistory();
    updateLayers();
    setTool('select');
  }
}

// --- Workspace ---
function bindWorkspace() {
  const ws = Canvas.getWorkspace();
  const fileInput = document.getElementById('image-file-input');

  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) {
      ImageManager.loadImage(e.target.files[0]).then(data => {
        selectElement(data.id);
        pushHistory();
        updateLayers();
      });
    }
    e.target.value = '';
    setTool('select');
  });

  // Drag and drop
  const dropContainer = document.getElementById('workspace-container');
  dropContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    document.getElementById('drop-zone').classList.add('active');
  });
  dropContainer.addEventListener('dragleave', (e) => {
    if (!dropContainer.contains(e.relatedTarget))
      document.getElementById('drop-zone').classList.remove('active');
  });
  dropContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    document.getElementById('drop-zone').classList.remove('active');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      ImageManager.loadImage(file).then(data => {
        selectElement(data.id);
        pushHistory();
        updateLayers();
      });
    }
  });

  // Mouse tracking
  ws.addEventListener('mousemove', (e) => {
    const pos = Canvas.getMouseOnCanvas(e.clientX, e.clientY);
    document.getElementById('status-mouse').textContent = `${pos.x}, ${pos.y}`;
    if (getIsDragging()) { e.preventDefault(); handleDrag(e); updatePropertiesPanel(); }
    if (getIsResizing()) { e.preventDefault(); handleResize(e); updatePropertiesPanel(); }
  });

  ws.addEventListener('mousedown', (e) => {
    const wrapper = e.target.closest('.element-wrapper');
    const handle = e.target.closest('.resize-handle');
    if (handle && getSelectedId()) { e.preventDefault(); startResize(e, handle.dataset.dir); return; }
    if (wrapper) { e.preventDefault(); selectElement(wrapper.dataset.id); startDrag(e); return; }
    if (e.target === ws || e.target.id === 'canvas-area' ||
        e.target.id === 'viewport' || e.target.id === 'viewport-content') {
      deselectAll();
    }
  });

  ws.addEventListener('mouseup', () => endInteraction());

  ws.addEventListener('dblclick', (e) => {
    const wrapper = e.target.closest('.element-wrapper');
    if (wrapper && wrapper.dataset.type === 'text') {
      TextManager.startEditing(wrapper.dataset.id);
    }
  });

  // Paste image from clipboard (Ctrl+V)
  document.addEventListener('paste', (e) => {
    if (e.target.matches('input, select, [contenteditable="true"]')) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          ImageManager.loadImage(file).then(data => {
            selectElement(data.id);
            pushHistory();
            updateLayers();
          });
        }
        break;
      }
    }
  });
}

// --- Export ---
function bindExport() {
  document.getElementById('export-format').addEventListener('change', (e) => {
    document.getElementById('jpeg-quality-row').hidden = e.target.value !== 'jpeg';
  });
  document.getElementById('export-quality').addEventListener('input', (e) => {
    document.getElementById('export-quality-val').textContent = e.target.value + '%';
  });
  document.getElementById('export-download-btn').addEventListener('click', () => {
    const fmt = document.getElementById('export-format').value;
    const q = parseInt(document.getElementById('export-quality').value) / 100;
    const filename = document.getElementById('export-filename').value || 'cropcanvas-export';
    exportCanvas(fmt, q, filename);
  });
  updateExportInfo();
}

function updateExportInfo() {
  const el = document.getElementById('export-dimensions');
  if (el) el.textContent = `Output: ${Canvas.getWidth()} \u00d7 ${Canvas.getHeight()} px`;
}

// --- Keyboard ---
function bindKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, select, [contenteditable="true"]')) return;

    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) { e.preventDefault(); redo(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      forceSave();
      const saveBtn = document.getElementById('save-btn');
      saveBtn.classList.add('saved');
      setTimeout(() => saveBtn.classList.remove('saved'), 1000);
    }
    if (e.key === 'Delete' || e.key === 'Backspace') { if (getSelectedId()) { e.preventDefault(); deleteSelected(); updateLayers(); } }
    if (e.key === 'v' || e.key === 'V') setTool('select');
    if (e.key === 't' || e.key === 'T') setTool('text');
    if (e.key === 'i' || e.key === 'I') setTool('image');
    if (e.key === 'r' || e.key === 'R') setTool('rect');
    if (e.key === 'c' || e.key === 'C') setTool('circle');
    if (e.key === 'l' || e.key === 'L') setTool('line');
    if (e.key === 'a' || e.key === 'A') setTool('arrow');

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      if (nudge(e.key, e.shiftKey)) {
        e.preventDefault();
        updatePropertiesPanel();
      }
    }
  });
}

// --- Help ---
function bindHelp() {
  const overlay = document.getElementById('help-overlay');
  document.getElementById('help-btn').addEventListener('click', () => { overlay.hidden = false; });
  document.getElementById('help-close').addEventListener('click', () => { overlay.hidden = true; });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.hidden = true; });
  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hidden) overlay.hidden = true;
  });
}

// --- Canvas Settings Card ---
function bindCanvasSettings() {
  const toggle = document.getElementById('canvas-settings-toggle');
  const body = document.getElementById('canvas-settings-body');
  // Default: collapsed
  toggle.setAttribute('aria-expanded', 'false');
  body.hidden = true;

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', !expanded);
    body.hidden = expanded;
  });

  document.getElementById('toggle-grid').addEventListener('change', (e) => {
    const grid = document.getElementById('viewport-grid');
    if (grid) grid.style.display = e.target.checked ? '' : 'none';
  });
}

// --- Save & Reset ---
function bindSaveReset() {
  const saveBtn = document.getElementById('save-btn');
  saveBtn.addEventListener('click', () => {
    forceSave();
    // Visual feedback
    saveBtn.classList.add('saved');
    setTimeout(() => saveBtn.classList.remove('saved'), 1000);
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    if (!confirm('Reset canvas? This will clear all elements and start fresh.')) return;
    clearSavedState();
    ImageManager.setImageState([]);
    TextManager.setTextState([]);
    ShapeManager.setShapeState([]);
    Canvas.setCanvasSize(500, 500);
    const defaultBg = document.documentElement.getAttribute('data-theme') === 'dark' ? '#1e1e22' : '#ffffff';
    Canvas.setBackground(defaultBg);
    document.getElementById('canvas-width').value = 500;
    document.getElementById('canvas-height').value = 500;
    deselectAll();
    resetHistory();
    pushHistory();
    updateLayers();
    updateExportInfo();
    showWelcome();
    setTimeout(() => Canvas.resetZoom(), 50);
  });
}

// --- Helpers ---
function showWelcome() {
  if (ImageManager.getImages().length === 0 && TextManager.getTexts().length === 0 && ShapeManager.getShapes().length === 0) {
    document.getElementById('drop-zone').classList.add('show-welcome');
  }
}
