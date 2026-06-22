/**
 * CropCanvas — Main Application Controller
 * Wires all modules together, handles selection, drag, resize, undo/redo, and UI events.
 */

const App = (() => {
  let currentTool = 'select';
  let selectedId = null;
  let isDragging = false;
  let isResizing = false;
  let dragStart = {};
  let resizeDir = '';
  let resizeStart = {};
  let history = [];
  let historyIndex = -1;
  const MAX_HISTORY = 50;

  function init() {
    CanvasManager.init();
    initTheme();
    bindToolbar();
    bindTools();
    bindWorkspace();
    bindProperties();
    bindExport();
    bindKeyboard();
    bindResizers();
    showWelcome();
    pushHistory();
  }

  // --- Theme ---
  function initTheme() {
    const saved = localStorage.getItem('cropcanvas-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    document.getElementById('theme-toggle').addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('cropcanvas-theme', next);
      CanvasManager.drawRulers();
    });
  }

  // --- Toolbar ---
  function bindToolbar() {
    // Canvas size
    document.getElementById('apply-size-btn').addEventListener('click', applyCanvasSize);
    document.getElementById('canvas-width').addEventListener('keydown', e => { if (e.key === 'Enter') applyCanvasSize(); });
    document.getElementById('canvas-height').addEventListener('keydown', e => { if (e.key === 'Enter') applyCanvasSize(); });

    // Presets
    const presetsBtn = document.getElementById('presets-btn');
    const presetsMenu = document.getElementById('presets-menu');
    presetsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      presetsMenu.classList.toggle('open');
    });
    document.addEventListener('click', () => presetsMenu.classList.remove('open'));
    presetsMenu.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        document.getElementById('canvas-width').value = item.dataset.width;
        document.getElementById('canvas-height').value = item.dataset.height;
        applyCanvasSize();
        presetsMenu.classList.remove('open');
      });
    });

    // Zoom
    document.getElementById('zoom-in-btn').addEventListener('click', () => CanvasManager.zoomIn());
    document.getElementById('zoom-out-btn').addEventListener('click', () => CanvasManager.zoomOut());
    document.getElementById('zoom-level').addEventListener('click', () => CanvasManager.resetZoom());
    document.getElementById('zoom-fit-btn').addEventListener('click', () => CanvasManager.fitToScreen());

    // Undo/Redo
    document.getElementById('undo-btn').addEventListener('click', undo);
    document.getElementById('redo-btn').addEventListener('click', redo);
  }

  function applyCanvasSize() {
    const w = parseInt(document.getElementById('canvas-width').value) || 500;
    const h = parseInt(document.getElementById('canvas-height').value) || 500;
    CanvasManager.setCanvasSize(w, h);
    pushHistory();
    setTimeout(() => CanvasManager.fitToScreen(), 50);
  }

  // --- Tools ---
  function bindTools() {
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => setTool(btn.dataset.tool));
    });
    document.getElementById('delete-selected-btn').addEventListener('click', deleteSelected);
  }

  function setTool(tool) {
    currentTool = tool;
    document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
    if (tool === 'image') {
      document.getElementById('image-file-input').click();
    }
    if (tool === 'text') {
      const data = TextManager.addText();
      selectElement(data.id);
      pushHistory();
      setTool('select');
    }
  }

  // --- Workspace Events ---
  function bindWorkspace() {
    const ws = CanvasManager.workspace;
    const fileInput = document.getElementById('image-file-input');

    // File input
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
    dropContainer.addEventListener('dragover', (e) => { e.preventDefault(); document.getElementById('drop-zone').classList.add('active'); });
    dropContainer.addEventListener('dragleave', (e) => {
      if (!dropContainer.contains(e.relatedTarget)) document.getElementById('drop-zone').classList.remove('active');
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

    // Mouse tracking for status bar
    ws.addEventListener('mousemove', (e) => {
      const pos = CanvasManager.getMouseOnCanvas(e.clientX, e.clientY);
      document.getElementById('status-mouse').textContent = `Mouse: ${pos.x}, ${pos.y}`;
      if (isDragging) handleDrag(e);
      if (isResizing) handleResize(e);
    });

    // Element selection and drag start
    ws.addEventListener('mousedown', (e) => {
      const wrapper = e.target.closest('.element-wrapper');
      const handle = e.target.closest('.resize-handle');

      if (handle && selectedId) {
        startResize(e, handle.dataset.dir);
        return;
      }
      if (wrapper) {
        selectElement(wrapper.dataset.id);
        startDrag(e, wrapper);
        return;
      }
      // Click on workspace background = deselect
      if (e.target === ws || e.target.id === 'canvas-area' || e.target.id === 'viewport' || e.target.id === 'viewport-content') {
        deselectAll();
      }
    });

    ws.addEventListener('mouseup', () => {
      if (isDragging || isResizing) pushHistory();
      isDragging = false;
      isResizing = false;
    });

    // Double-click for text editing
    ws.addEventListener('dblclick', (e) => {
      const wrapper = e.target.closest('.element-wrapper');
      if (wrapper && wrapper.dataset.type === 'text') {
        TextManager.startEditing(wrapper.dataset.id);
      }
    });
  }

  // --- Drag ---
  function startDrag(e, wrapper) {
    isDragging = true;
    const data = getElementData(wrapper.dataset.id);
    if (!data) return;
    dragStart = { mx: e.clientX, my: e.clientY, ex: data.x, ey: data.y };
  }

  function handleDrag(e) {
    if (!isDragging || !selectedId) return;
    const data = getElementData(selectedId);
    if (!data) return;
    const zoom = CanvasManager.zoom;
    data.x = dragStart.ex + Math.round((e.clientX - dragStart.mx) / zoom);
    data.y = dragStart.ey + Math.round((e.clientY - dragStart.my) / zoom);
    if (data.type === 'image') ImageManager.updateImageElement(data);
    else TextManager.updateTextElement(data);
    updatePropertiesPanel();
  }

  // --- Resize ---
  function startResize(e, dir) {
    isResizing = true;
    isDragging = false;
    resizeDir = dir;
    const data = getElementData(selectedId);
    if (!data) return;
    resizeStart = { mx: e.clientX, my: e.clientY, x: data.x, y: data.y, w: data.width, h: data.height };
  }

  function handleResize(e) {
    if (!isResizing || !selectedId) return;
    const data = getElementData(selectedId);
    if (!data || data.type !== 'image') return;

    const zoom = CanvasManager.zoom;
    const dx = Math.round((e.clientX - resizeStart.mx) / zoom);
    const dy = Math.round((e.clientY - resizeStart.my) / zoom);

    let { x, y, w, h } = { x: resizeStart.x, y: resizeStart.y, w: resizeStart.w, h: resizeStart.h };

    if (resizeDir.includes('e')) w += dx;
    if (resizeDir.includes('w')) { w -= dx; x += dx; }
    if (resizeDir.includes('s')) h += dy;
    if (resizeDir.includes('n')) { h -= dy; y += dy; }

    if (data.lockRatio && data.aspectRatio) {
      if (resizeDir.includes('e') || resizeDir.includes('w')) { h = Math.round(w / data.aspectRatio); }
      else { w = Math.round(h * data.aspectRatio); }
    }

    data.x = x; data.y = y;
    data.width = Math.max(10, w);
    data.height = Math.max(10, h);
    ImageManager.updateImageElement(data);
    updatePropertiesPanel();
  }

  // --- Selection ---
  function selectElement(id) {
    deselectAll();
    selectedId = id;
    const el = document.querySelector(`[data-id="${id}"]`);
    if (el) el.classList.add('selected');
    document.getElementById('delete-selected-btn').disabled = false;
    switchToTab('properties');
    updatePropertiesPanel();
    updateLayers();
    updateStatusSelection();
  }

  function deselectAll() {
    document.querySelectorAll('.element-wrapper.selected').forEach(el => el.classList.remove('selected'));
    selectedId = null;
    document.getElementById('delete-selected-btn').disabled = true;
    const elemProps = document.getElementById('element-properties');
    if (elemProps) elemProps.hidden = true;
    const noSelection = document.getElementById('no-selection');
    if (noSelection) noSelection.hidden = false;
    updateStatusSelection();
  }

  function deleteSelected() {
    if (!selectedId) return;
    const data = getElementData(selectedId);
    if (!data) return;
    if (data.type === 'image') ImageManager.removeImage(selectedId);
    else TextManager.removeText(selectedId);
    deselectAll();
    pushHistory();
    updateLayers();
  }

  function getElementData(id) {
    return ImageManager.getById(id) || TextManager.getById(id);
  }

  // --- Properties Panel ---
  function bindProperties() {
    // Panel tabs
    document.querySelectorAll('.panel-tab').forEach(tab => {
      tab.addEventListener('click', () => switchToTab(tab.dataset.tab));
    });



    // Element properties
    const elemProps = ['prop-elem-x', 'prop-elem-y', 'prop-elem-w', 'prop-elem-h', 'prop-elem-rot', 'prop-elem-opacity'];
    elemProps.forEach(id => {
      document.getElementById(id).addEventListener('input', () => applyProps());
    });

    document.getElementById('prop-elem-delete').addEventListener('click', () => {
      if (selectedId) deleteSelected();
    });

    document.getElementById('prop-elem-rot-reset').addEventListener('click', () => {
      document.getElementById('prop-elem-rot').value = 0;
      applyProps();
    });

    // Text properties
    document.getElementById('prop-text-content').addEventListener('input', () => applyProps());
    const textProps = ['prop-text-size', 'prop-text-lh', 'prop-text-spacing'];
    textProps.forEach(id => {
      document.getElementById(id).addEventListener('input', () => applyProps());
    });
    document.getElementById('prop-text-font').addEventListener('change', () => applyProps());
    document.getElementById('prop-text-weight').addEventListener('change', () => applyProps());
    document.getElementById('prop-text-color').addEventListener('input', () => applyProps());

    // Style toggles
    document.getElementById('prop-text-bold').addEventListener('click', (e) => {
      e.target.closest('button').classList.toggle('active');
      applyProps();
    });
    document.getElementById('prop-text-italic').addEventListener('click', (e) => {
      e.target.closest('button').classList.toggle('active');
      applyProps();
    });
    document.getElementById('prop-text-underline').addEventListener('click', (e) => {
      e.target.closest('button').classList.toggle('active');
      applyProps();
    });

    // Canvas background
    const bgInput = document.getElementById('prop-canvas-bg');
    if (bgInput) {
      bgInput.addEventListener('input', (e) => {
        CanvasManager.setBackground(e.target.value);
      });
    }

    // Text edited event
    document.addEventListener('text-edited', () => {
      updatePropertiesPanel();
      updateLayers();
      pushHistory();
    });
  }

  function applyProps() {
    if (!selectedId) return;
    const imgData = ImageManager.getById(selectedId);
    const txtData = TextManager.getById(selectedId);
    const data = imgData || txtData;
    if (!data) return;

    data.x = parseInt(document.getElementById('prop-elem-x').value) || 0;
    data.y = parseInt(document.getElementById('prop-elem-y').value) || 0;
    data.rotation = parseInt(document.getElementById('prop-elem-rot').value) || 0;
    data.opacity = parseInt(document.getElementById('prop-elem-opacity').value) / 100;

    if (data.type === 'image') {
      data.width = Math.max(1, parseInt(document.getElementById('prop-elem-w').value) || 1);
      data.height = Math.max(1, parseInt(document.getElementById('prop-elem-h').value) || 1);
      ImageManager.updateImageElement(data);
    } else if (data.type === 'text') {
      // Text size can't be easily driven by W/H box without recalculating, so just allow reading them but text flows automatically
      data.content = document.getElementById('prop-text-content').value || 'Text';
      data.fontFamily = document.getElementById('prop-text-font').value;
      data.fontSize = parseInt(document.getElementById('prop-text-size').value) || 16;
      data.color = document.getElementById('prop-text-color').value;
      data.bold = document.getElementById('prop-text-bold').classList.contains('active') || document.getElementById('prop-text-weight').value === 'bold';
      data.italic = document.getElementById('prop-text-italic').classList.contains('active');
      data.underline = document.getElementById('prop-text-underline').classList.contains('active');
      TextManager.updateTextElement(data);
    }
    pushHistory();
  }

  function switchToTab(tab) {
    document.querySelectorAll('.panel-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    const layers = document.getElementById('layers-content');
    const props = document.getElementById('properties-content');
    const exp = document.getElementById('export-content');
    if (layers) layers.classList.toggle('active', tab === 'layers');
    if (props) props.classList.toggle('active', tab === 'properties');
    if (exp) exp.classList.toggle('active', tab === 'export');
  }

  function updatePropertiesPanel() {
    const noSelection = document.getElementById('no-selection');
    const elemProps = document.getElementById('element-properties');
    
    if (!selectedId) {
      if (noSelection) noSelection.hidden = false;
      if (elemProps) elemProps.hidden = true;
      return;
    }
    
    if (noSelection) noSelection.hidden = true;
    if (elemProps) elemProps.hidden = false;

    const data = getElementData(selectedId);
    if (!data) return;

    document.getElementById('prop-elem-title').textContent = (data.name || data.type).toUpperCase();
    document.getElementById('prop-elem-x').value = Math.round(data.x);
    document.getElementById('prop-elem-y').value = Math.round(data.y);
    document.getElementById('prop-elem-rot').value = Math.round(data.rotation || 0);
    document.getElementById('prop-elem-opacity').value = Math.round((data.opacity !== undefined ? data.opacity : 1) * 100);

    const txtSection = document.getElementById('prop-text-section');

    if (data.type === 'image') {
      txtSection.hidden = true;
      document.getElementById('prop-elem-w').value = Math.round(data.width);
      document.getElementById('prop-elem-h').value = Math.round(data.height);
      document.getElementById('prop-elem-w').disabled = false;
      document.getElementById('prop-elem-h').disabled = false;
    } else if (data.type === 'text') {
      txtSection.hidden = false;
      document.getElementById('prop-elem-w').value = Math.round(data.width || 0);
      document.getElementById('prop-elem-h').value = Math.round(data.height || 0);
      document.getElementById('prop-elem-w').disabled = true;
      document.getElementById('prop-elem-h').disabled = true;
      
      document.getElementById('prop-text-content').value = data.content;
      document.getElementById('prop-text-font').value = data.fontFamily || 'Inter';
      document.getElementById('prop-text-size').value = Math.round(data.fontSize || 16);
      document.getElementById('prop-text-color').value = data.color || '#000000';
      document.getElementById('prop-text-weight').value = data.bold ? 'bold' : 'normal';
      
      document.getElementById('prop-text-bold').classList.toggle('active', !!data.bold);
      document.getElementById('prop-text-italic').classList.toggle('active', !!data.italic);
      document.getElementById('prop-text-underline').classList.toggle('active', !!data.underline);
    }
  }

  // --- Layers ---
  function updateLayers() {
    const list = document.getElementById('layers-list');
    const allImages = ImageManager.getImages();
    const allTexts = TextManager.getTexts();

    if (allImages.length === 0 && allTexts.length === 0) {
      list.innerHTML = `
        <div class="empty-layers">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
          <p>No elements added yet</p>
          <p class="subtle">Add an image or add text to get started</p>
        </div>`;
      return;
    }

    list.innerHTML = '';
    const all = [...allImages, ...allTexts];
    all.reverse().forEach(el => {
      const item = document.createElement('div');
      item.className = 'layer-item' + (el.id === selectedId ? ' selected' : '');
      
      const iconHtml = el.type === 'image' 
        ? `<svg class="layer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`
        : `<svg class="layer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>`;

      item.innerHTML = `
        ${iconHtml}
        <span class="layer-name">${el.name || el.type}</span>
        <button class="layer-visibility${el.visible ? '' : ' hidden'}" data-id="${el.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
            <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      `;
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.layer-visibility')) selectElement(el.id);
      });
      item.querySelector('.layer-visibility').addEventListener('click', () => {
        el.visible = !el.visible;
        const wrapper = document.querySelector(`[data-id="${el.id}"]`);
        if (wrapper) wrapper.style.display = el.visible ? '' : 'none';
        updateLayers();
      });
      list.appendChild(item);
    });
  }

  // --- Export ---
  function bindExport() {
    document.getElementById('export-btn').addEventListener('click', () => switchToTab('export'));
    document.getElementById('export-format').addEventListener('change', (e) => {
      document.getElementById('jpeg-quality-row').hidden = e.target.value !== 'jpeg';
    });
    document.getElementById('export-quality').addEventListener('input', (e) => {
      document.getElementById('export-quality-val').textContent = e.target.value + '%';
    });
    document.getElementById('export-download-btn').addEventListener('click', () => {
      const fmt = document.getElementById('export-format').value;
      const q = parseInt(document.getElementById('export-quality').value) / 100;
      ExportEngine.exportCanvas(fmt, q);
    });
  }

  // --- History (Undo/Redo) ---
  function pushHistory() {
    const state = {
      images: JSON.parse(JSON.stringify(ImageManager.getImages())),
      texts: JSON.parse(JSON.stringify(TextManager.getTexts())),
      canvasW: CanvasManager.width,
      canvasH: CanvasManager.height,
      canvasBg: CanvasManager.canvasBg
    };
    // Trim future states
    history = history.slice(0, historyIndex + 1);
    history.push(state);
    if (history.length > MAX_HISTORY) history.shift();
    historyIndex = history.length - 1;
    updateHistoryButtons();
  }

  function undo() {
    if (historyIndex <= 0) return;
    historyIndex--;
    restoreState(history[historyIndex]);
  }

  function redo() {
    if (historyIndex >= history.length - 1) return;
    historyIndex++;
    restoreState(history[historyIndex]);
  }

  function restoreState(state) {
    CanvasManager.setCanvasSize(state.canvasW, state.canvasH);
    CanvasManager.setBackground(state.canvasBg);
    document.getElementById('canvas-width').value = state.canvasW;
    document.getElementById('canvas-height').value = state.canvasH;
    ImageManager.setImageState(JSON.parse(JSON.stringify(state.images)));
    TextManager.setTextState(JSON.parse(JSON.stringify(state.texts)));
    deselectAll();
    updateLayers();
    updateHistoryButtons();
  }

  function updateHistoryButtons() {
    document.getElementById('undo-btn').disabled = historyIndex <= 0;
    document.getElementById('redo-btn').disabled = historyIndex >= history.length - 1;
  }

  // --- Keyboard ---
  function bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      // Don't intercept when typing in inputs
      if (e.target.matches('input, select, [contenteditable="true"]')) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) { e.preventDefault(); redo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
      if (e.key === 'Delete' || e.key === 'Backspace') { if (selectedId) { e.preventDefault(); deleteSelected(); } }
      if (e.key === 'v' || e.key === 'V') setTool('select');
      if (e.key === 't' || e.key === 'T') setTool('text');
      if (e.key === 'i' || e.key === 'I') setTool('image');

      // Arrow key nudge
      if (selectedId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const data = getElementData(selectedId);
        if (!data) return;
        const step = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowUp') data.y -= step;
        if (e.key === 'ArrowDown') data.y += step;
        if (e.key === 'ArrowLeft') data.x -= step;
        if (e.key === 'ArrowRight') data.x += step;
        if (data.type === 'image') ImageManager.updateImageElement(data);
        else TextManager.updateTextElement(data);
        updatePropertiesPanel();
        pushHistory();
      }
    });
  }

  // --- Resizers ---
  function bindResizers() {
    const resizerLeft = document.getElementById('resizer-left');
    const resizerRight = document.getElementById('resizer-right');
    
    let resizing = null;
    
    resizerLeft.addEventListener('mousedown', () => { resizing = 'left'; resizerLeft.classList.add('active'); document.body.style.cursor = 'col-resize'; });
    resizerRight.addEventListener('mousedown', () => { resizing = 'right'; resizerRight.classList.add('active'); document.body.style.cursor = 'col-resize'; });
    
    document.addEventListener('mousemove', (e) => {
      if (!resizing) return;
      if (resizing === 'left') {
        const newWidth = Math.max(160, Math.min(e.clientX, window.innerWidth / 2));
        document.documentElement.style.setProperty('--toolbox-width', `${newWidth}px`);
      } else if (resizing === 'right') {
        const newWidth = Math.max(200, Math.min(window.innerWidth - e.clientX, window.innerWidth / 2));
        document.documentElement.style.setProperty('--properties-width', `${newWidth}px`);
      }
      CanvasManager.drawRulers();
    });
    
    document.addEventListener('mouseup', () => {
      if (resizing) {
        resizing = null;
        resizerLeft.classList.remove('active');
        resizerRight.classList.remove('active');
        document.body.style.cursor = '';
        CanvasManager.fitToScreen();
      }
    });
  }

  // --- Helpers ---
  function showWelcome() {
    const dz = document.getElementById('drop-zone');
    if (ImageManager.getImages().length === 0 && TextManager.getTexts().length === 0) {
      dz.classList.add('show-welcome');
    }
  }

  function updateStatusSelection() {
    const el = document.getElementById('status-selection');
    if (selectedId) {
      const data = getElementData(selectedId);
      el.textContent = data ? `${data.type}: ${data.name || data.id}` : 'No selection';
    } else {
      el.textContent = 'No selection';
    }
  }

  // Init on DOM ready
  document.addEventListener('DOMContentLoaded', init);
  return { init };
})();
