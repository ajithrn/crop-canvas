/**
 * Shapes Layer Manager
 * Handles rectangle, circle, line, and arrow creation, rendering, and properties.
 */
import * as Canvas from './canvas.js';
import { getImages } from './image.js';
import { getTexts } from './text.js';

let shapes = [];
let idCounter = 0;

export function addShape(type, options = {}) {
  const vw = Canvas.getWidth();
  const vh = Canvas.getHeight();

  const defaults = getShapeDefaults(type, vw, vh);
  const data = {
    id: 'shp-' + (++idCounter),
    type: 'shape',
    shapeType: type, // rect, circle, line, arrow
    name: getShapeName(type) + ' ' + idCounter,
    x: options.x ?? defaults.x,
    y: options.y ?? defaults.y,
    width: options.width ?? defaults.width,
    height: options.height ?? defaults.height,
    rotation: 0,
    opacity: options.opacity ?? 1,
    fill: options.fill ?? getDefaultFill(),
    stroke: options.stroke ?? '#000000',
    strokeWidth: options.strokeWidth ?? 2,
    borderRadius: options.borderRadius ?? 0,
    visible: true,
  };

  shapes.push(data);
  renderShape(data);

  const dropZone = document.getElementById('drop-zone');
  if (dropZone) dropZone.classList.remove('show-welcome');

  return data;
}

function getShapeDefaults(type, vw, vh) {
  switch (type) {
    case 'rect':
      return { x: Math.round(vw / 2 - 75), y: Math.round(vh / 2 - 50), width: 150, height: 100 };
    case 'circle':
      return { x: Math.round(vw / 2 - 50), y: Math.round(vh / 2 - 50), width: 100, height: 100 };
    case 'line':
      return { x: Math.round(vw / 2 - 75), y: Math.round(vh / 2), width: 150, height: 0 };
    case 'arrow':
      return { x: Math.round(vw / 2 - 75), y: Math.round(vh / 2), width: 150, height: 0 };
    default:
      return { x: 50, y: 50, width: 100, height: 100 };
  }
}

function getShapeName(type) {
  switch (type) {
    case 'rect': return 'Rectangle';
    case 'circle': return 'Circle';
    case 'line': return 'Line';
    case 'arrow': return 'Arrow';
    default: return 'Shape';
  }
}

function getDefaultFill() {
  const theme = document.documentElement.getAttribute('data-theme');
  return theme === 'dark' ? '#6366f1' : '#6366f1';
}

export function renderShape(data) {
  const container = Canvas.getViewportContent();

  const wrapper = document.createElement('div');
  wrapper.className = 'element-wrapper animate-in';
  wrapper.dataset.id = data.id;
  wrapper.dataset.type = 'shape';
  wrapper.dataset.shapeType = data.shapeType;
  wrapper.style.left = data.x + 'px';
  wrapper.style.top = data.y + 'px';
  wrapper.style.width = data.width + 'px';
  wrapper.style.opacity = data.opacity;

  if (data.shapeType === 'line' || data.shapeType === 'arrow') {
    wrapper.style.height = Math.max(data.strokeWidth + 4, 8) + 'px';
    renderLineShape(wrapper, data);
  } else {
    wrapper.style.height = data.height + 'px';
    renderBlockShape(wrapper, data);
  }

  if (data.rotation !== 0) {
    wrapper.style.transform = `rotate(${data.rotation}deg)`;
  }

  // Resize handles
  ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'].forEach(dir => {
    const handle = document.createElement('div');
    handle.className = `resize-handle ${dir}`;
    handle.dataset.dir = dir;
    wrapper.appendChild(handle);
  });

  container.appendChild(wrapper);
  wrapper.addEventListener('animationend', () => wrapper.classList.remove('animate-in'), { once: true });
  return wrapper;
}

function renderBlockShape(wrapper, data) {
  const el = document.createElement('div');
  el.className = 'shape-element';
  el.style.width = '100%';
  el.style.height = '100%';
  el.style.backgroundColor = data.fill;
  el.style.border = `${data.strokeWidth}px solid ${data.stroke}`;

  if (data.shapeType === 'rect') {
    el.style.borderRadius = data.borderRadius + 'px';
  } else if (data.shapeType === 'circle') {
    el.style.borderRadius = '50%';
  }

  wrapper.appendChild(el);
}

function renderLineShape(wrapper, data) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'shape-line-svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.style.position = 'absolute';
  svg.style.top = '0';
  svg.style.left = '0';
  svg.style.overflow = 'visible';

  const h = Math.max(data.strokeWidth + 4, 8);
  const midY = h / 2;

  if (data.shapeType === 'arrow') {
    // Arrow with marker
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    const markerId = 'arrow-' + data.id;
    marker.setAttribute('id', markerId);
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygon.setAttribute('fill', data.stroke);
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '0');
    line.setAttribute('y1', midY);
    line.setAttribute('x2', data.width);
    line.setAttribute('y2', midY);
    line.setAttribute('stroke', data.stroke);
    line.setAttribute('stroke-width', data.strokeWidth);
    line.setAttribute('marker-end', `url(#${markerId})`);
    svg.appendChild(line);
  } else {
    // Simple line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '0');
    line.setAttribute('y1', midY);
    line.setAttribute('x2', data.width);
    line.setAttribute('y2', midY);
    line.setAttribute('stroke', data.stroke);
    line.setAttribute('stroke-width', data.strokeWidth);
    line.setAttribute('stroke-linecap', 'round');
    svg.appendChild(line);
  }

  wrapper.appendChild(svg);
}

export function updateShapeElement(data) {
  const el = document.querySelector(`[data-id="${data.id}"]`);
  if (!el) return;

  el.style.left = data.x + 'px';
  el.style.top = data.y + 'px';
  el.style.width = data.width + 'px';
  el.style.opacity = data.opacity;
  el.style.transform = data.rotation !== 0 ? `rotate(${data.rotation}deg)` : '';

  if (data.shapeType === 'line' || data.shapeType === 'arrow') {
    el.style.height = Math.max(data.strokeWidth + 4, 8) + 'px';
    // Re-render SVG
    const oldSvg = el.querySelector('.shape-line-svg');
    if (oldSvg) oldSvg.remove();
    renderLineShape(el, data);
  } else {
    el.style.height = data.height + 'px';
    const shapeEl = el.querySelector('.shape-element');
    if (shapeEl) {
      shapeEl.style.backgroundColor = data.fill;
      shapeEl.style.border = `${data.strokeWidth}px solid ${data.stroke}`;
      if (data.shapeType === 'rect') {
        shapeEl.style.borderRadius = data.borderRadius + 'px';
      } else if (data.shapeType === 'circle') {
        shapeEl.style.borderRadius = '50%';
      }
    }
  }
}

export function removeShape(id) {
  shapes = shapes.filter(s => s.id !== id);
  const el = document.querySelector(`[data-id="${id}"]`);
  if (el) el.remove();

  if (shapes.length === 0 && getImages().length === 0 && getTexts().length === 0) {
    const dropZone = document.getElementById('drop-zone');
    if (dropZone) dropZone.classList.add('show-welcome');
  }
}

export function getById(id) {
  return shapes.find(s => s.id === id);
}

export function getShapes() { return shapes; }

export function setShapeState(newShapes) {
  shapes.forEach(s => {
    const el = document.querySelector(`[data-id="${s.id}"]`);
    if (el) el.remove();
  });
  shapes = newShapes;
  shapes.forEach(s => renderShape(s));
}
