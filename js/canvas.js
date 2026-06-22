/**
 * CropCanvas — Canvas/Viewport Manager
 * Handles viewport sizing, workspace layout, rulers, zoom, and overflow masking.
 */

const CanvasManager = (() => {
  let viewportWidth = 500;
  let viewportHeight = 500;
  let zoom = 1;
  let canvasBg = '#ffffff';
  const PADDING = 200; // Extra space around viewport in workspace
  const ZOOM_MIN = 0.25;
  const ZOOM_MAX = 4;
  const ZOOM_STEP = 0.1;

  const els = {};

  function init() {
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

    // Scroll to center viewport
    requestAnimationFrame(() => {
      centerViewport();
      drawRulers();
    });

    // Redraw rulers on scroll
    els.workspace.addEventListener('scroll', () => drawRulers());

    // Handle workspace resize
    const ro = new ResizeObserver(() => {
      initRulers();
      drawRulers();
    });
    ro.observe(els.container);

    // Ctrl+scroll for zoom
    els.workspace.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        setZoom(zoom + delta, e.clientX, e.clientY);
      }
    }, { passive: false });
  }

  function setCanvasSize(w, h) {
    viewportWidth = Math.max(1, Math.min(8000, w));
    viewportHeight = Math.max(1, Math.min(8000, h));
    applyViewportSize();
    centerViewport();
    drawRulers();
    updateStatus();
  }

  function applyViewportSize() {
    const totalW = viewportWidth * zoom + PADDING * 2;
    const totalH = viewportHeight * zoom + PADDING * 2;

    els.canvasArea.style.width = totalW + 'px';
    els.canvasArea.style.height = totalH + 'px';

    els.viewport.style.left = PADDING + 'px';
    els.viewport.style.top = PADDING + 'px';
    els.viewport.style.width = (viewportWidth * zoom) + 'px';
    els.viewport.style.height = (viewportHeight * zoom) + 'px';
    els.viewport.style.backgroundColor = canvasBg;

    updateOverflowMask();
  }

  function updateOverflowMask() {
    const vw = viewportWidth * zoom;
    const vh = viewportHeight * zoom;
    // Use a massive box-shadow to create the dim effect around the viewport
    const spread = Math.max(4000, vw + vh);
    els.overflowMask.style.left = PADDING + 'px';
    els.overflowMask.style.top = PADDING + 'px';
    els.overflowMask.style.width = vw + 'px';
    els.overflowMask.style.height = vh + 'px';
    els.overflowMask.style.boxShadow = `0 0 0 ${spread}px var(--bg-overlay)`;
  }

  function centerViewport() {
    const containerRect = els.workspace.getBoundingClientRect();
    const totalW = viewportWidth * zoom + PADDING * 2;
    const totalH = viewportHeight * zoom + PADDING * 2;

    const scrollX = Math.max(0, (totalW - containerRect.width) / 2);
    const scrollY = Math.max(0, (totalH - containerRect.height) / 2);

    els.workspace.scrollLeft = scrollX;
    els.workspace.scrollTop = scrollY;
  }

  function setZoom(newZoom, clientX, clientY) {
    const oldZoom = zoom;
    zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.round(newZoom * 100) / 100));

    if (zoom === oldZoom) return;

    applyViewportSize();

    // Update elements transform
    els.viewportContent.style.transform = `scale(${zoom})`;
    els.viewportContent.style.transformOrigin = 'top left';
    els.viewportContent.style.width = viewportWidth + 'px';
    els.viewportContent.style.height = viewportHeight + 'px';

    drawRulers();
    updateStatus();

    // Dispatch event so other modules can react
    document.dispatchEvent(new CustomEvent('zoom-changed', { detail: { zoom } }));
  }

  function fitToScreen() {
    const containerRect = els.workspace.getBoundingClientRect();
    const scaleX = (containerRect.width - 80) / viewportWidth;
    const scaleY = (containerRect.height - 80) / viewportHeight;
    const fitZoom = Math.min(scaleX, scaleY, ZOOM_MAX);
    setZoom(fitZoom);
    requestAnimationFrame(() => centerViewport());
  }

  function zoomIn() { setZoom(zoom + ZOOM_STEP); }
  function zoomOut() { setZoom(zoom - ZOOM_STEP); }
  function resetZoom() { setZoom(1); requestAnimationFrame(() => centerViewport()); }

  // --- Rulers ---
  function initRulers() {
    const container = els.container.getBoundingClientRect();
    const rulerSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--ruler-size')) || 24;

    els.rulerH.width = container.width - rulerSize;
    els.rulerH.height = rulerSize;
    els.rulerV.width = rulerSize;
    els.rulerV.height = container.height - rulerSize;
  }

  function drawRulers() {
    drawHorizontalRuler();
    drawVerticalRuler();
  }

  function drawHorizontalRuler() {
    const canvas = els.rulerH;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const scrollLeft = els.workspace.scrollLeft;
    const style = getComputedStyle(document.documentElement);
    const tickColor = style.getPropertyValue('--ruler-tick').trim();
    const majorColor = style.getPropertyValue('--ruler-major').trim();
    const textColor = style.getPropertyValue('--ruler-text').trim();

    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Calculate visible range in canvas coordinates
    const startPx = scrollLeft - PADDING;
    const endPx = startPx + w;

    const step = zoom >= 0.5 ? 10 : (zoom >= 0.25 ? 20 : 50);
    const labelStep = zoom >= 1 ? 100 : (zoom >= 0.5 ? 200 : 500);

    const startTick = Math.floor(startPx / (step * zoom)) * step;
    const endTick = Math.ceil(endPx / (step * zoom)) * step;

    for (let px = startTick; px <= endTick; px += step) {
      const screenX = (px * zoom) - startPx;
      if (screenX < 0 || screenX > w) continue;

      const isMajor = px % labelStep === 0;
      const isMid = px % (labelStep / 2) === 0;

      ctx.beginPath();
      ctx.strokeStyle = isMajor ? majorColor : tickColor;
      ctx.lineWidth = isMajor ? 1 : 0.5;

      const tickH = isMajor ? h * 0.6 : (isMid ? h * 0.4 : h * 0.25);
      ctx.moveTo(Math.round(screenX) + 0.5, h);
      ctx.lineTo(Math.round(screenX) + 0.5, h - tickH);
      ctx.stroke();

      if (isMajor) {
        ctx.fillStyle = textColor;
        ctx.fillText(px.toString(), screenX, 2);
      }
    }
  }

  function drawVerticalRuler() {
    const canvas = els.rulerV;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const scrollTop = els.workspace.scrollTop;
    const style = getComputedStyle(document.documentElement);
    const tickColor = style.getPropertyValue('--ruler-tick').trim();
    const majorColor = style.getPropertyValue('--ruler-major').trim();
    const textColor = style.getPropertyValue('--ruler-text').trim();

    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const startPx = scrollTop - PADDING;
    const endPx = startPx + h;

    const step = zoom >= 0.5 ? 10 : (zoom >= 0.25 ? 20 : 50);
    const labelStep = zoom >= 1 ? 100 : (zoom >= 0.5 ? 200 : 500);

    const startTick = Math.floor(startPx / (step * zoom)) * step;
    const endTick = Math.ceil(endPx / (step * zoom)) * step;

    for (let px = startTick; px <= endTick; px += step) {
      const screenY = (px * zoom) - startPx;
      if (screenY < 0 || screenY > h) continue;

      const isMajor = px % labelStep === 0;
      const isMid = px % (labelStep / 2) === 0;

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
        ctx.fillText(px.toString(), 0, 0);
        ctx.restore();
      }
    }
  }

  function updateStatus() {
    const sizeEl = document.getElementById('status-canvas-size');
    const zoomEl = document.getElementById('status-zoom');
    const zoomBtn = document.getElementById('zoom-level');
    if (sizeEl) sizeEl.textContent = `Canvas: ${viewportWidth} × ${viewportHeight}`;
    if (zoomEl) zoomEl.textContent = `Zoom: ${Math.round(zoom * 100)}%`;
    if (zoomBtn) zoomBtn.textContent = `${Math.round(zoom * 100)}%`;
  }

  function setBackground(color) {
    canvasBg = color;
    els.viewport.style.backgroundColor = canvasBg;
  }

  function getMouseOnCanvas(clientX, clientY) {
    const rect = els.viewport.getBoundingClientRect();
    return {
      x: Math.round((clientX - rect.left) / zoom),
      y: Math.round((clientY - rect.top) / zoom)
    };
  }

  return {
    init,
    setCanvasSize,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    drawRulers,
    setBackground,
    getMouseOnCanvas,
    get width() { return viewportWidth; },
    get height() { return viewportHeight; },
    get zoom() { return zoom; },
    get viewportEl() { return els.viewport; },
    get viewportContent() { return els.viewportContent; },
    get workspace() { return els.workspace; },
    get canvasBg() { return canvasBg; },
    get PADDING() { return PADDING; }
  };
})();
