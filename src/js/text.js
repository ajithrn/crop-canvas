/**
 * Text Layer Manager
 * Handles text creation, editing, rotation, and properties.
 */
import * as Canvas from './canvas.js';
import { getImages } from './image.js';
import { getShapes } from './shapes.js';

let texts = [];
let idCounter = 0;

export function addText(options = {}) {
  const vw = Canvas.getWidth();
  const vh = Canvas.getHeight();

  const data = {
    id: 'txt-' + (++idCounter),
    type: 'text',
    name: 'Text ' + idCounter,
    content: options.content || 'Double-click to edit',
    x: options.x ?? Math.round(vw / 2 - 80),
    y: options.y ?? Math.round(vh / 2 - 12),
    width: 0,
    height: 0,
    fontFamily: options.fontFamily || 'Inter',
    fontSize: options.fontSize || 24,
    color: options.color || getDefaultTextColor(),
    bold: options.bold || false,
    italic: options.italic || false,
    underline: options.underline || false,
    textAlign: options.textAlign || 'left',
    rotation: options.rotation || 0,
    opacity: options.opacity ?? 1,
    visible: true,
  };

  texts.push(data);
  renderText(data);

  const dropZone = document.getElementById('drop-zone');
  if (dropZone) dropZone.classList.remove('show-welcome');

  return data;
}

export function renderText(data) {
  const container = Canvas.getViewportContent();

  const wrapper = document.createElement('div');
  wrapper.className = 'element-wrapper animate-in';
  wrapper.dataset.id = data.id;
  wrapper.dataset.type = 'text';
  wrapper.style.left = data.x + 'px';
  wrapper.style.top = data.y + 'px';
  wrapper.style.opacity = data.opacity;

  if (data.rotation !== 0) {
    wrapper.style.transform = `rotate(${data.rotation}deg)`;
  }

  const textEl = document.createElement('div');
  textEl.className = 'text-element';
  textEl.textContent = data.content;
  textEl.style.fontFamily = `'${data.fontFamily}', sans-serif`;
  textEl.style.fontSize = data.fontSize + 'px';
  textEl.style.color = data.color;
  textEl.style.fontWeight = data.bold ? '700' : '400';
  textEl.style.fontStyle = data.italic ? 'italic' : 'normal';
  textEl.style.textDecoration = data.underline ? 'underline' : 'none';
  textEl.style.textAlign = data.textAlign || 'left';
  wrapper.appendChild(textEl);

  ['nw', 'ne', 'sw', 'se'].forEach(dir => {
    const handle = document.createElement('div');
    handle.className = `resize-handle ${dir}`;
    handle.dataset.dir = dir;
    wrapper.appendChild(handle);
  });

  container.appendChild(wrapper);
  wrapper.addEventListener('animationend', () => wrapper.classList.remove('animate-in'), { once: true });
  return wrapper;
}

export function updateTextElement(data) {
  const el = document.querySelector(`[data-id="${data.id}"]`);
  if (!el) return;

  el.style.left = data.x + 'px';
  el.style.top = data.y + 'px';
  el.style.opacity = data.opacity;
  el.style.transform = data.rotation !== 0 ? `rotate(${data.rotation}deg)` : '';

  const textEl = el.querySelector('.text-element');
  if (textEl) {
    textEl.textContent = data.content;
    textEl.style.fontFamily = `'${data.fontFamily}', sans-serif`;
    textEl.style.fontSize = data.fontSize + 'px';
    textEl.style.color = data.color;
    textEl.style.fontWeight = data.bold ? '700' : '400';
    textEl.style.fontStyle = data.italic ? 'italic' : 'normal';
    textEl.style.textDecoration = data.underline ? 'underline' : 'none';
    textEl.style.textAlign = data.textAlign || 'left';
  }
}

export function startEditing(id) {
  const data = getById(id);
  if (!data) return;

  const el = document.querySelector(`[data-id="${id}"] .text-element`);
  if (!el) return;

  el.classList.add('editing');
  el.contentEditable = true;
  el.focus();

  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  const finishEdit = () => {
    el.classList.remove('editing');
    el.contentEditable = false;
    data.content = el.textContent || 'Text';
    el.removeEventListener('blur', finishEdit);
    el.removeEventListener('keydown', onKeyDown);
    document.dispatchEvent(new CustomEvent('text-edited', { detail: { id, data } }));
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); el.blur(); }
    if (e.key === 'Escape') { el.blur(); }
    e.stopPropagation();
  };

  el.addEventListener('blur', finishEdit);
  el.addEventListener('keydown', onKeyDown);
}

export function removeText(id) {
  texts = texts.filter(t => t.id !== id);
  const el = document.querySelector(`[data-id="${id}"]`);
  if (el) el.remove();

  if (texts.length === 0 && getImages().length === 0 && getShapes().length === 0) {
    const dropZone = document.getElementById('drop-zone');
    if (dropZone) dropZone.classList.add('show-welcome');
  }
}

export function getById(id) {
  return texts.find(t => t.id === id);
}

export function getTexts() { return texts; }

export function setTextState(newTexts) {
  texts.forEach(t => {
    const el = document.querySelector(`[data-id="${t.id}"]`);
    if (el) el.remove();
  });
  texts = newTexts;
  texts.forEach(t => renderText(t));
}

function getDefaultTextColor() {
  const theme = document.documentElement.getAttribute('data-theme');
  return theme === 'dark' ? '#ffffff' : '#18181b';
}
