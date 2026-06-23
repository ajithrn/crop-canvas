/**
 * Selection — Select, deselect, delete, drag, resize
 */
import * as Canvas from './canvas.js';
import * as ImageManager from './image.js';
import * as TextManager from './text.js';
import * as ShapeManager from './shapes.js';
import { pushHistory } from './history.js';

let selectedId = null;
let isDragging = false;
let isResizing = false;
let dragStart = {};
let resizeDir = '';
let resizeStart = {};
let nudgeTimer = null;

let onSelectionChange = null;

export function setOnSelectionChange(fn) { onSelectionChange = fn; }
export function getSelectedId() { return selectedId; }

export function selectElement(id) {
  deselectAll();
  selectedId = id;
  const el = document.querySelector(`[data-id="${id}"]`);
  if (el) el.classList.add('selected');
  if (onSelectionChange) onSelectionChange(id);
}

export function deselectAll() {
  document.querySelectorAll('.element-wrapper.selected').forEach(el => el.classList.remove('selected'));
  selectedId = null;
  const elemProps = document.getElementById('element-properties');
  if (elemProps) elemProps.hidden = true;
  const noSelection = document.getElementById('no-selection');
  if (noSelection) noSelection.hidden = false;
  updateStatusSelection();
}

export function deleteSelected() {
  if (!selectedId) return;
  const data = getElementData(selectedId);
  if (!data) return;
  if (data.type === 'image') ImageManager.removeImage(selectedId);
  else if (data.type === 'text') TextManager.removeText(selectedId);
  else if (data.type === 'shape') ShapeManager.removeShape(selectedId);
  deselectAll();
  pushHistory();
}

export function getElementData(id) {
  return ImageManager.getById(id) || TextManager.getById(id) || ShapeManager.getById(id);
}

// --- Drag ---
export function startDrag(e) {
  isDragging = true;
  const data = getElementData(selectedId);
  if (!data) return;
  dragStart = { mx: e.clientX, my: e.clientY, ex: data.x, ey: data.y };
}

export function handleDrag(e) {
  if (!isDragging || !selectedId) return;
  const data = getElementData(selectedId);
  if (!data) return;
  const z = Canvas.getZoom();
  data.x = dragStart.ex + Math.round((e.clientX - dragStart.mx) / z);
  data.y = dragStart.ey + Math.round((e.clientY - dragStart.my) / z);
  updateElement(data);
}

// --- Resize ---
export function startResize(e, dir) {
  isResizing = true;
  isDragging = false;
  resizeDir = dir;
  const data = getElementData(selectedId);
  if (!data) return;
  resizeStart = { mx: e.clientX, my: e.clientY, x: data.x, y: data.y, w: data.width, h: data.height };
}

export function handleResize(e) {
  if (!isResizing || !selectedId) return;
  const data = getElementData(selectedId);
  if (!data || (data.type !== 'image' && data.type !== 'shape')) return;

  const z = Canvas.getZoom();
  const dx = Math.round((e.clientX - resizeStart.mx) / z);
  const dy = Math.round((e.clientY - resizeStart.my) / z);

  let { x, y, w, h } = { x: resizeStart.x, y: resizeStart.y, w: resizeStart.w, h: resizeStart.h };
  if (resizeDir.includes('e')) w += dx;
  if (resizeDir.includes('w')) { w -= dx; x += dx; }
  if (resizeDir.includes('s')) h += dy;
  if (resizeDir.includes('n')) { h -= dy; y += dy; }

  if (data.type === 'image' && data.lockRatio && data.aspectRatio) {
    if (resizeDir.includes('e') || resizeDir.includes('w')) h = Math.round(w / data.aspectRatio);
    else w = Math.round(h * data.aspectRatio);
  }

  data.x = x; data.y = y;
  data.width = Math.max(10, w);
  data.height = Math.max(10, h);
  updateElement(data);
}

export function endInteraction() {
  if (isDragging || isResizing) pushHistory();
  isDragging = false;
  isResizing = false;
}

export function getIsDragging() { return isDragging; }
export function getIsResizing() { return isResizing; }

// --- Nudge ---
export function nudge(key, shift) {
  if (!selectedId) return false;
  const data = getElementData(selectedId);
  if (!data) return false;
  const step = shift ? 10 : 1;
  if (key === 'ArrowUp') data.y -= step;
  if (key === 'ArrowDown') data.y += step;
  if (key === 'ArrowLeft') data.x -= step;
  if (key === 'ArrowRight') data.x += step;
  updateElement(data);
  clearTimeout(nudgeTimer);
  nudgeTimer = setTimeout(() => pushHistory(), 300);
  return true;
}

// --- Helpers ---
function updateElement(data) {
  if (data.type === 'image') ImageManager.updateImageElement(data);
  else if (data.type === 'text') TextManager.updateTextElement(data);
  else if (data.type === 'shape') ShapeManager.updateShapeElement(data);
}

function updateStatusSelection() {
  const el = document.getElementById('status-selection');
  if (selectedId) {
    const data = getElementData(selectedId);
    el.textContent = data ? `${data.type}: ${data.name || data.id}` : '';
  } else {
    el.textContent = 'No selection';
  }
}
