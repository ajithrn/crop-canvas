/**
 * History — Undo/redo stack, autosave, restore, reset
 */
import * as Canvas from './canvas.js';
import * as ImageManager from './image.js';
import * as TextManager from './text.js';
import * as ShapeManager from './shapes.js';

let history = [];
let historyIndex = -1;
const MAX_HISTORY = 50;
const SAVE_KEY = 'cropcanvas-state';
let saveTimer = null;

let onRestore = null; // callback after state restore

export function setOnRestore(fn) { onRestore = fn; }

export function pushHistory() {
  const state = getSnapshot();
  history = history.slice(0, historyIndex + 1);
  history.push(state);
  if (history.length > MAX_HISTORY) history.shift();
  historyIndex = history.length - 1;
  updateButtons();
  autoSave();
}

export function undo() {
  if (historyIndex <= 0) return;
  historyIndex--;
  restoreState(history[historyIndex]);
}

export function redo() {
  if (historyIndex >= history.length - 1) return;
  historyIndex++;
  restoreState(history[historyIndex]);
}

export function resetHistory() {
  history = [];
  historyIndex = -1;
}

function restoreState(state) {
  Canvas.setCanvasSize(state.canvasW, state.canvasH);
  Canvas.setBackground(state.canvasBg);
  document.getElementById('canvas-width').value = state.canvasW;
  document.getElementById('canvas-height').value = state.canvasH;
  ImageManager.setImageState(JSON.parse(JSON.stringify(state.images)));
  TextManager.setTextState(JSON.parse(JSON.stringify(state.texts)));
  ShapeManager.setShapeState(JSON.parse(JSON.stringify(state.shapes || [])));
  updateButtons();
  if (onRestore) onRestore();
}

function updateButtons() {
  document.getElementById('undo-btn').disabled = historyIndex <= 0;
  document.getElementById('redo-btn').disabled = historyIndex >= history.length - 1;
}

// --- Autosave ---
function autoSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(getSnapshot())); } catch (e) {}
  }, 500);
}

export function forceSave() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(getSnapshot())); } catch (e) {}
}

export function restoreSavedState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const state = JSON.parse(raw);
    if (!state || !state.canvasW) return false;

    Canvas.setCanvasSize(state.canvasW, state.canvasH);
    if (state.canvasBg) Canvas.setBackground(state.canvasBg);
    document.getElementById('canvas-width').value = state.canvasW;
    document.getElementById('canvas-height').value = state.canvasH;
    ImageManager.setImageState(state.images || []);
    TextManager.setTextState(state.texts || []);
    ShapeManager.setShapeState(state.shapes || []);
    pushHistory();
    return true;
  } catch (e) {
    return false;
  }
}

export function clearSavedState() {
  localStorage.removeItem(SAVE_KEY);
}

function getSnapshot() {
  return {
    images: JSON.parse(JSON.stringify(ImageManager.getImages())),
    texts: JSON.parse(JSON.stringify(TextManager.getTexts())),
    shapes: JSON.parse(JSON.stringify(ShapeManager.getShapes())),
    canvasW: Canvas.getWidth(),
    canvasH: Canvas.getHeight(),
    canvasBg: Canvas.getCanvasBg(),
  };
}
