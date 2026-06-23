/**
 * Layers Panel — renders layer list
 */
import * as ImageManager from './image.js';
import * as TextManager from './text.js';
import * as ShapeManager from './shapes.js';
import { getSelectedId, selectElement } from './selection.js';

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

  list.innerHTML = '';
  const all = [...allImages, ...allTexts, ...allShapes];
  all.reverse().forEach(el => {
    const item = document.createElement('div');
    item.className = 'layer-item' + (el.id === selectedId ? ' selected' : '');
    item.innerHTML = `
      <span class="layer-icon">${getLayerIcon(el)}</span>
      <span class="layer-name">${el.name || el.type}</span>
      <button class="layer-visibility${el.visible ? '' : ' hidden'}" data-id="${el.id}" aria-label="Toggle visibility">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>
      </button>`;

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

function getLayerIcon(el) {
  if (el.type === 'image') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
  if (el.type === 'text') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>';
  if (el.shapeType === 'rect') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/></svg>';
  if (el.shapeType === 'circle') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>';
  if (el.shapeType === 'line') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="20" x2="20" y2="4"/></svg>';
  if (el.shapeType === 'arrow') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>';
}
