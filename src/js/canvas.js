/**
 * Canvas/Viewport Manager
 * Handles viewport sizing, workspace layout, rulers, zoom, and overflow masking.
 */

let viewportWidth = 500;
let viewportHeight = 500;
let zoom = 1;
let canvasBg = '';

const PADDING = 200;
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.1;

const els = {};

export function init() {
  // Set theme-aware default background
  if (!canvasBg) {
    const theme = document.documentElement.getAttribute('data-theme');
    canvasBg = theme === 'dark' ? '#1e1e22' : '#ffffff';
  }

  els.workspace = document.getElementById('workspace');
  els.canvasArea = document.getElementById('canvas-area');
  els.viewport = document.getElementById('viewport');
  els.viewportContent = document.getElementById('viewport-content');
  els.overflowMask = document.getElementById('overflow-mask');
  els.rulerH = document.getElementById('ruler-h');
  els.rulerV = document.getElementById('ruler-v');
  els.container = document.getElementById('workspace-container');

  applyViewportSize();
  initRulers();

  requestAnimationFrame(() => {
    centerViewport();
    drawRulers();
  });

  els.workspace.addEventListener('scroll', () => drawRulers());

  const ro = new ResizeObserver(() => {
    initRulers();
    drawRulers();
  });
  ro.observe(els.container);

  els.workspace.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom(zoom + delta);
    }
  }, { passive: false });
}

// --- Public getters ---
export function getWidth() { return viewportWidth; }
export function getHeight() { return viewportHeight; }
export function getZoom() { return zoom; }
export function getCanvasBg() { return canvasBg; }
export function getWorkspace() { return els.workspace; }
export function getViewportContent() { return els.viewportContent; }

// --- Canvas size ---
export function setCanvasSize(w, h) {
  viewportWidth = Math.max(1, Math.min(8000, w));
  viewportHeight = Math.max(1, Math.min(8000, h));
  applyViewportSize();
  centerViewport();
  drawRulers();
  updateStatus();
}

function applyViewportSize() {
  const vpW = viewportWidth * zoom;
  const vpH = viewportHeight * zoom;

  // Minimal padding for drag overflow
  const pad = 100;
  const totalW = vpW + pad * 2;
  const totalH = vpH + pad * 2;

  els.canvasArea.style.width = totalW + 'px';
  els.canvasArea.style.height = totalH + 'px';
  els.viewport.style.left = pad + 'px';
  els.viewport.style.top = pad + 'px';
  els.viewport.style.width = vpW + 'px';
  els.viewport.style.height = vpH + 'px';

  els._pad = pad;
  updateOverflowMask();
}

function updateOverflowMask() {
  const vw = viewportWidth * zoom;
  const vh = viewportHeight * zoom;
  const spread = Math.max(4000, vw + vh);
  const pad = els._pad || 100;
  els.overflowMask.style.left = pad + 'px';
  els.overflowMask.style.top = pad + 'px';
  els.overflowMask.style.width = vw + 'px';
  els.overflowMask.style.height = vh + 'px';
  els.overflowMask.style.boxShadow = `0 0 0 ${spread}px var(--overlay)`;
}

function centerViewport() {
  // Let CSS handle centering via flexbox on #workspace
  // Just reset scroll to show the centered content
  const wsRect = els.workspace.getBoundingClientRect();
  const contentW = parseFloat(els.canvasArea.style.width);
  const contentH = parseFloat(els.canvasArea.style.height);
  els.workspace.scrollLeft = Math.max(0, (contentW - wsRect.width) / 2);
  els.workspace.scrollTop = Math.max(0, (contentH - wsRect.height) / 2);
}

// --- Zoom ---
export function setZoom(newZoom) {
  const oldZoom = zoom;
  zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.round(newZoom * 100) / 100));
  if (zoom === oldZoom) return;

  applyViewportSize();
  els.viewportContent.style.transform = `scale(${zoom})`;
  els.viewportContent.style.transformOrigin = 'top left';
  els.viewportContent.style.width = viewportWidth + 'px';
  els.viewportContent.style.height = viewportHeight + 'px';

  drawRulers();
  updateStatus();
  document.dispatchEvent(new CustomEvent('zoom-changed', { detail: { zoom } }));
}

export function fitToScreen() {
  const containerRect = els.workspace.getBoundingClientRect();
  const scaleX = (containerRect.width - 80) / viewportWidth;
  const scaleY = (containerRect.height - 80) / viewportHeight;
  setZoom(Math.min(scaleX, scaleY, ZOOM_MAX));
  requestAnimationFrame(() => centerViewport());
}

export function zoomIn() { setZoom(zoom + ZOOM_STEP); }
export function zoomOut() { setZoom(zoom - ZOOM_STEP); }
export function resetZoom() {
  zoom = 1;
  applyViewportSize();
  els.viewportContent.style.transform = `scale(${zoom})`;
  els.viewportContent.style.transformOrigin = 'top left';
  els.viewportContent.style.width = viewportWidth + 'px';
  els.viewportContent.style.height = viewportHeight + 'px';
  drawRulers();
  updateStatus();
  requestAnimationFrame(() => centerViewport());
}

// --- Mouse mapping (center-origin: 0,0 = center of viewport) ---
export function getMouseOnCanvas(clientX, clientY) {
  const vpRect = els.viewport.getBoundingClientRect();
  return {
    x: Math.round((clientX - vpRect.left) / zoom - viewportWidth / 2),
    y: Math.round((clientY - vpRect.top) / zoom - viewportHeight / 2),
  };
}

// --- Background ---
export function setBackground(color) {
  canvasBg = color;
  els.viewport.style.backgroundColor = color;
}

// --- Rulers ---
function initRulers() {
  const container = els.container.getBoundingClientRect();
  const rulerSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--ruler-size')) || 20;
  els.rulerH.width = container.width - rulerSize;
  els.rulerH.height = rulerSize;
  els.rulerV.width = rulerSize;
  els.rulerV.height = container.height - rulerSize;
}

export function drawRulers() {
  drawHorizontalRuler();
  drawVerticalRuler();
}

function drawHorizontalRuler() {
  const canvas = els.rulerH;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const style = getComputedStyle(document.documentElement);
  const tickColor = style.getPropertyValue('--ruler-tick').trim();
  const majorColor = style.getPropertyValue('--ruler-major').trim();
  const textColor = style.getPropertyValue('--ruler-text').trim();

  ctx.font = '9px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // Get viewport center position relative to ruler canvas
  const vpRect = els.viewport.getBoundingClientRect();
  const rulerRect = canvas.getBoundingClientRect();
  const vpCenterOnRuler = (vpRect.left + vpRect.width / 2) - rulerRect.left;

  const step = zoom >= 0.5 ? 10 : (zoom >= 0.25 ? 20 : 50);
  const labelStep = zoom >= 1 ? 100 : (zoom >= 0.5 ? 200 : 500);
  const pxPerUnit = zoom; // 1 canvas unit = zoom pixels on screen

  // Calculate range of values visible
  const startVal = Math.floor((-vpCenterOnRuler / pxPerUnit) / step) * step;
  const endVal = Math.ceil(((w - vpCenterOnRuler) / pxPerUnit) / step) * step;

  for (let val = startVal; val <= endVal; val += step) {
    const screenX = vpCenterOnRuler + val * pxPerUnit;
    if (screenX < 0 || screenX > w) continue;

    const absVal = Math.abs(val);
    const isMajor = absVal % labelStep === 0;
    const isMid = absVal % (labelStep / 2) === 0;

    ctx.beginPath();
    ctx.strokeStyle = isMajor ? majorColor : tickColor;
    ctx.lineWidth = isMajor ? 1 : 0.5;
    const tickH = isMajor ? h * 0.6 : (isMid ? h * 0.4 : h * 0.25);
    ctx.moveTo(Math.round(screenX) + 0.5, h);
    ctx.lineTo(Math.round(screenX) + 0.5, h - tickH);
    ctx.stroke();

    if (isMajor) {
      ctx.fillStyle = textColor;
      ctx.fillText(val.toString(), screenX, 2);
    }
  }
}

function drawVerticalRuler() {
  const canvas = els.rulerV;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const style = getComputedStyle(document.documentElement);
  const tickColor = style.getPropertyValue('--ruler-tick').trim();
  const majorColor = style.getPropertyValue('--ruler-major').trim();
  const textColor = style.getPropertyValue('--ruler-text').trim();

  ctx.font = '9px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Get viewport center position relative to ruler canvas
  const vpRect = els.viewport.getBoundingClientRect();
  const rulerRect = canvas.getBoundingClientRect();
  const vpCenterOnRuler = (vpRect.top + vpRect.height / 2) - rulerRect.top;

  const step = zoom >= 0.5 ? 10 : (zoom >= 0.25 ? 20 : 50);
  const labelStep = zoom >= 1 ? 100 : (zoom >= 0.5 ? 200 : 500);
  const pxPerUnit = zoom;

  const startVal = Math.floor((-vpCenterOnRuler / pxPerUnit) / step) * step;
  const endVal = Math.ceil(((h - vpCenterOnRuler) / pxPerUnit) / step) * step;

  for (let val = startVal; val <= endVal; val += step) {
    const screenY = vpCenterOnRuler + val * pxPerUnit;
    if (screenY < 0 || screenY > h) continue;

    const absVal = Math.abs(val);
    const isMajor = absVal % labelStep === 0;
    const isMid = absVal % (labelStep / 2) === 0;

    ctx.beginPath();
    ctx.strokeStyle = isMajor ? majorColor : tickColor;
    ctx.lineWidth = isMajor ? 1 : 0.5;
    const tickW = isMajor ? w * 0.6 : (isMid ? w * 0.4 : w * 0.25);
    ctx.moveTo(w, Math.round(screenY) + 0.5);
    ctx.lineTo(w - tickW, Math.round(screenY) + 0.5);
    ctx.stroke();

    if (isMajor) {
      ctx.save();
      ctx.translate(6, screenY);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = textColor;
      ctx.fillText(val.toString(), 0, 0);
      ctx.restore();
    }
  }
}

function updateStatus() {
  const sizeEl = document.getElementById('status-canvas-size');
  const zoomEl = document.getElementById('status-zoom');
  const zoomBtn = document.getElementById('zoom-level');
  if (sizeEl) sizeEl.textContent = `${viewportWidth} \u00d7 ${viewportHeight}`;
  if (zoomEl) zoomEl.textContent = `${Math.round(zoom * 100)}%`;
  if (zoomBtn) zoomBtn.textContent = `${Math.round(zoom * 100)}%`;
}
