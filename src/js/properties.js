/**
 * Properties Panel — binds inputs, applies changes, updates UI
 */
import * as Canvas from './canvas.js';
import * as ImageManager from './image.js';
import * as TextManager from './text.js';
import * as ShapeManager from './shapes.js';
import { openPicker } from './colorpicker.js';
import { getSelectedId, getElementData, deleteSelected } from './selection.js';
import { pushHistory } from './history.js';

export function bindProperties() {
  // Tabs
  document.querySelectorAll('.panel-tab').forEach(tab => {
    tab.addEventListener('click', () => switchToTab(tab.dataset.tab));
  });

  // Transform inputs
  ['prop-elem-x', 'prop-elem-y', 'prop-elem-w', 'prop-elem-h', 'prop-elem-rot', 'prop-elem-opacity'].forEach(id => {
    document.getElementById(id).addEventListener('input', applyProps);
  });

  document.getElementById('prop-elem-delete').addEventListener('click', deleteSelected);

  // Layer rename from properties header
  const titleInput = document.getElementById('prop-elem-title');
  titleInput.addEventListener('input', () => {
    const id = getSelectedId();
    if (!id) return;
    const data = getElementData(id);
    if (data) data.name = titleInput.value.trim() || data.type;
  });
  titleInput.addEventListener('blur', () => pushHistory());
  titleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); titleInput.blur(); }
  });

  document.getElementById('prop-elem-rot-reset').addEventListener('click', () => {
    document.getElementById('prop-elem-rot').value = 0;
    applyProps();
  });

  // Text props
  document.getElementById('prop-text-content').addEventListener('input', applyProps);
  ['prop-text-size', 'prop-text-lh', 'prop-text-spacing'].forEach(id => {
    document.getElementById(id).addEventListener('input', applyProps);
  });
  document.getElementById('prop-text-font').addEventListener('change', applyProps);
  document.getElementById('prop-text-weight').addEventListener('change', applyProps);

  // Text color
  bindColorField('prop-text-color', 'prop-text-color-hex', () => applyProps());

  // Text style toggles
  ['prop-text-bold', 'prop-text-italic', 'prop-text-underline'].forEach(id => {
    document.getElementById(id).addEventListener('click', (e) => {
      e.target.closest('button').classList.toggle('active');
      applyProps();
    });
  });

  // Text alignment
  document.querySelectorAll('.style-btn-align').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.style-btn-align').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyProps();
    });
  });

  // Canvas background
  bindColorField('prop-canvas-bg', 'prop-canvas-bg-hex', (hex) => {
    Canvas.setBackground(hex);
    pushHistory();
  });

  // Shape props
  bindColorField('prop-shape-fill', 'prop-shape-fill-hex', () => applyProps());
  bindColorField('prop-shape-stroke', 'prop-shape-stroke-hex', () => applyProps());
  document.getElementById('prop-shape-stroke-width').addEventListener('input', applyProps);
  document.getElementById('prop-shape-radius').addEventListener('input', applyProps);

  // Text edited event
  document.addEventListener('text-edited', () => {
    updatePropertiesPanel();
    pushHistory();
  });
}

function bindColorField(inputId, hexId, onChange) {
  const input = document.getElementById(inputId);
  const field = input.closest('.color-field');
  field.style.cursor = 'pointer';
  field.addEventListener('click', (e) => {
    e.preventDefault();
    openPicker(field, input.value, (hex) => {
      input.value = hex;
      document.getElementById(hexId).textContent = hex;
      onChange(hex);
    });
  });
  input.addEventListener('click', (e) => e.preventDefault());
}

export function switchToTab(tab) {
  document.querySelectorAll('.panel-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('properties-content').classList.toggle('active', tab === 'properties');
  document.getElementById('layers-content').classList.toggle('active', tab === 'layers');
  document.getElementById('export-content').classList.toggle('active', tab === 'export');
}

function applyProps() {
  const selectedId = getSelectedId();
  if (!selectedId) return;
  const data = getElementData(selectedId);
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
    data.content = document.getElementById('prop-text-content').value || 'Text';
    data.fontFamily = document.getElementById('prop-text-font').value;
    data.fontSize = parseInt(document.getElementById('prop-text-size').value) || 16;
    data.color = document.getElementById('prop-text-color').value;
    data.bold = document.getElementById('prop-text-bold').classList.contains('active') ||
                document.getElementById('prop-text-weight').value === 'bold';
    data.italic = document.getElementById('prop-text-italic').classList.contains('active');
    data.underline = document.getElementById('prop-text-underline').classList.contains('active');
    const activeAlign = document.querySelector('.style-btn-align.active');
    data.textAlign = activeAlign ? activeAlign.dataset.align : 'left';
    TextManager.updateTextElement(data);
  } else if (data.type === 'shape') {
    data.width = Math.max(1, parseInt(document.getElementById('prop-elem-w').value) || 1);
    data.height = Math.max(1, parseInt(document.getElementById('prop-elem-h').value) || 1);
    data.fill = document.getElementById('prop-shape-fill').value;
    data.stroke = document.getElementById('prop-shape-stroke').value;
    data.strokeWidth = parseInt(document.getElementById('prop-shape-stroke-width').value) || 0;
    data.borderRadius = parseInt(document.getElementById('prop-shape-radius').value) || 0;
    ShapeManager.updateShapeElement(data);
  }
  pushHistory();
}

export function updatePropertiesPanel() {
  const selectedId = getSelectedId();
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

  document.getElementById('prop-elem-title').value = data.name || data.type;
  document.getElementById('prop-elem-x').value = Math.round(data.x);
  document.getElementById('prop-elem-y').value = Math.round(data.y);
  document.getElementById('prop-elem-rot').value = Math.round(data.rotation || 0);
  document.getElementById('prop-elem-opacity').value = Math.round((data.opacity ?? 1) * 100);

  const txtSection = document.getElementById('prop-text-section');
  const shapeSection = document.getElementById('prop-shape-section');

  if (data.type === 'image') {
    txtSection.hidden = true;
    shapeSection.hidden = true;
    document.getElementById('prop-elem-w').value = Math.round(data.width);
    document.getElementById('prop-elem-h').value = Math.round(data.height);
    document.getElementById('prop-elem-w').disabled = false;
    document.getElementById('prop-elem-h').disabled = false;
  } else if (data.type === 'text') {
    txtSection.hidden = false;
    shapeSection.hidden = true;
    document.getElementById('prop-elem-w').value = '';
    document.getElementById('prop-elem-h').value = '';
    document.getElementById('prop-elem-w').disabled = true;
    document.getElementById('prop-elem-h').disabled = true;
    document.getElementById('prop-text-content').value = data.content;
    document.getElementById('prop-text-font').value = data.fontFamily || 'Inter';
    document.getElementById('prop-text-size').value = Math.round(data.fontSize || 16);
    document.getElementById('prop-text-color').value = data.color || getDefaultColor();
    document.getElementById('prop-text-color-hex').textContent = data.color || getDefaultColor();
    document.getElementById('prop-text-weight').value = data.bold ? 'bold' : 'normal';
    document.getElementById('prop-text-bold').classList.toggle('active', !!data.bold);
    document.getElementById('prop-text-italic').classList.toggle('active', !!data.italic);
    document.getElementById('prop-text-underline').classList.toggle('active', !!data.underline);
    document.querySelectorAll('.style-btn-align').forEach(b => {
      b.classList.toggle('active', b.dataset.align === (data.textAlign || 'left'));
    });
  } else if (data.type === 'shape') {
    txtSection.hidden = true;
    shapeSection.hidden = false;
    document.getElementById('prop-elem-w').value = Math.round(data.width);
    document.getElementById('prop-elem-h').value = Math.round(data.height);
    document.getElementById('prop-elem-w').disabled = false;
    document.getElementById('prop-elem-h').disabled = (data.shapeType === 'line' || data.shapeType === 'arrow');
    document.getElementById('prop-shape-fill').value = data.fill || '#6366f1';
    document.getElementById('prop-shape-fill-hex').textContent = data.fill || '#6366f1';
    document.getElementById('prop-shape-stroke').value = data.stroke || '#000000';
    document.getElementById('prop-shape-stroke-hex').textContent = data.stroke || '#000000';
    document.getElementById('prop-shape-stroke-width').value = data.strokeWidth || 2;
    document.getElementById('prop-shape-radius').value = data.borderRadius || 0;
    document.getElementById('prop-shape-radius-field').hidden = (data.shapeType !== 'rect');
  }
}

function getDefaultColor() {
  const theme = document.documentElement.getAttribute('data-theme');
  return theme === 'dark' ? '#ffffff' : '#18181b';
}
