/**
 * Layers Panel - renders layer list with drag-to-reorder
 */
import * as ImageManager from './image.js';
import * as TextManager from './text.js';
import * as ShapeManager from './shapes.js';
import { getSelectedId, selectElement } from './selection.js';
import { pushHistory } from './history.js';

let draggedId = null;

export function updateLayers() {
  const list = document.getElementById('layers-list');
  const allImages = ImageManager.getImages();
  const allTexts = TextManager.getTexts();
  const allShapes = ShapeManager.getShapes();
  const selectedId = getSelectedId();

  if (allImages.length === 0 && allTexts.length === 0 && allShapes.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/>
            <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>
            <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/>
          </svg>
        </div>
        <p class="empty-state-text">No layers yet</p>
        <p class="empty-state-hint">Add images or text to build your composition</p>
      </div>`;
    return;
  }

  // Get elements sorted by DOM order (back to front), then reverse for list (top = first)
  const container = document.getElementById('viewport-content');
  const domElements = Array.from(container.querySelectorAll('.element-wrapper'));
  const allData = [...allImages, ...allTexts, ...allShapes];

  const sorted = allData
    .map(el => ({ data: el, index: domElements.findIndex(d => d.dataset.id === el.id) }))
    .filter(e => e.index >= 0)
    .sort((a, b) => b.index - a.index);

  list.innerHTML = '';

  // Move buttons header (operates on selected)
  const header = document.createElement('div');
  header.className = 'layers-header';
  header.innerHTML = `
    <span class="layers-title">Layers</span>
    <div class="layers-header-actions">
      <button class="layer-move-btn" id="layer-move-up" title="Move selected up" aria-label="Move up" ${!selectedId ? 'disabled' : ''}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
      </button>
      <button class="layer-move-btn" id="layer-move-down" title="Move selected down" aria-label="Move down" ${!selectedId ? 'disabled' : ''}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
    </div>`;
  list.appendChild(header);

  header.querySelector('#layer-move-up').addEventListener('click', () => {
    if (selectedId) moveLayer(selectedId, 'up');
  });
  header.querySelector('#layer-move-down').addEventListener('click', () => {
    if (selectedId) moveLayer(selectedId, 'down');
  });

  // Layer items
  sorted.forEach(entry => {
    const el = entry.data;
    const item = document.createElement('div');
    item.className = 'layer-item' + (el.id === selectedId ? ' selected' : '');
    item.dataset.layerId = el.id;
    item.draggable = true;

    item.innerHTML = `
      <span class="layer-drag-handle" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10"><circle cx="6" cy="6" r="1.5"/><circle cx="12" cy="6" r="1.5"/><circle cx="6" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="6" cy="18" r="1.5"/><circle cx="12" cy="18" r="1.5"/></svg>
      </span>
      <span class="layer-icon">${getLayerIcon(el)}</span>
      <span class="layer-name">${el.name || el.type}</span>
      <button class="layer-visibility${el.visible ? '' : ' hidden'}" data-id="${el.id}" aria-label="Toggle visibility">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>
      </button>`;

    // Select on click
    item.addEventListener('click', (e) => {
      if (!e.target.closest('.layer-visibility') && !e.target.closest('.layer-drag-handle') && !e.target.closest('.layer-name-input')) {
        selectElement(el.id);
      }
    });

    // Double-click layer name to rename
    const nameEl = item.querySelector('.layer-name');
    nameEl.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'layer-name-input';
      input.value = el.name || el.type;
      nameEl.replaceWith(input);
      input.focus();
      input.select();

      const finish = () => {
        const newName = input.value.trim() || el.name || el.type;
        el.name = newName;
        pushHistory();
        updateLayers();
      };

      input.addEventListener('blur', finish);
      input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); }
        if (ev.key === 'Escape') { input.value = el.name || el.type; input.blur(); }
        ev.stopPropagation();
      });
    });

    // Visibility
    item.querySelector('.layer-visibility').addEventListener('click', () => {
      el.visible = !el.visible;
      const wrapper = document.querySelector(`[data-id="${el.id}"]`);
      if (wrapper) wrapper.style.display = el.visible ? '' : 'none';
      pushHistory();
      updateLayers();
    });

    // Drag and drop reorder
    item.addEventListener('dragstart', (e) => {
      draggedId = el.id;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', el.id);
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      draggedId = null;
      list.querySelectorAll('.layer-item').forEach(i => i.classList.remove('drag-over'));
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (el.id !== draggedId) {
        item.classList.add('drag-over');
      }
    });

    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over');
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      item.classList.remove('drag-over');
      if (!draggedId || draggedId === el.id) return;
      reorderInDom(draggedId, el.id);
      pushHistory();
      updateLayers();
    });

    list.appendChild(item);
  });
}

/**
 * Reorder: move draggedId element to be at the same visual position as targetId
 * In the layers list, items are top-to-bottom = front-to-back
 * In the DOM, later = front. So "above in list" = "after in DOM"
 */
function reorderInDom(draggedId, targetId) {
  const container = document.getElementById('viewport-content');
  const draggedEl = container.querySelector(`[data-id="${draggedId}"]`);
  const targetEl = container.querySelector(`[data-id="${targetId}"]`);
  if (!draggedEl || !targetEl) return;

  // Get positions
  const children = Array.from(container.querySelectorAll('.element-wrapper'));
  const dragIdx = children.indexOf(draggedEl);
  const targetIdx = children.indexOf(targetEl);

  if (dragIdx < targetIdx) {
    // Dragged was behind target, move after target
    container.insertBefore(draggedEl, targetEl.nextSibling);
  } else {
    // Dragged was in front of target, move before target
    container.insertBefore(draggedEl, targetEl);
  }
}

function moveLayer(id, direction) {
  const container = document.getElementById('viewport-content');
  const el = container.querySelector(`[data-id="${id}"]`);
  if (!el) return;

  if (direction === 'up') {
    // Move forward (later in DOM = on top)
    const next = el.nextElementSibling;
    if (next && next.classList.contains('element-wrapper')) {
      container.insertBefore(next, el);
      pushHistory();
      updateLayers();
    }
  } else {
    // Move backward (earlier in DOM = behind)
    const prev = el.previousElementSibling;
    if (prev && prev.classList.contains('element-wrapper')) {
      container.insertBefore(el, prev);
      pushHistory();
      updateLayers();
    }
  }
}

function getLayerIcon(el) {
  if (el.type === 'image') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
  if (el.type === 'text') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>';
  if (el.shapeType === 'rect') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/></svg>';
  if (el.shapeType === 'circle') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>';
  if (el.shapeType === 'line') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="20" x2="20" y2="4"/></svg>';
  if (el.shapeType === 'arrow') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>';
}
