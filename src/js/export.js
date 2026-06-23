/**
 * Export Engine
 * Renders the viewport to an offscreen canvas and triggers download.
 */
import * as Canvas from './canvas.js';
import { getImages } from './image.js';
import { getTexts } from './text.js';
import { getShapes } from './shapes.js';

export function exportCanvas(format = 'png', quality = 0.92, filename = 'cropcanvas-export') {
  const w = Canvas.getWidth();
  const h = Canvas.getHeight();

  const offscreen = document.createElement('canvas');
  offscreen.width = w;
  offscreen.height = h;
  const ctx = offscreen.getContext('2d');

  // Draw background
  ctx.fillStyle = Canvas.getCanvasBg();
  ctx.fillRect(0, 0, w, h);

  // Collect all visible elements sorted by DOM order
  const allElements = [];

  getImages().forEach(img => {
    if (!img.visible) return;
    allElements.push({ ...img, zIndex: getDomIndex(img.id) });
  });

  getTexts().forEach(txt => {
    if (!txt.visible) return;
    allElements.push({ ...txt, zIndex: getDomIndex(txt.id) });
  });

  getShapes().forEach(shp => {
    if (!shp.visible) return;
    allElements.push({ ...shp, zIndex: getDomIndex(shp.id) });
  });

  allElements.sort((a, b) => a.zIndex - b.zIndex);

  const drawPromises = allElements.map(el => {
    if (el.type === 'image') return drawImage(ctx, el);
    if (el.type === 'text') { drawText(ctx, el); return Promise.resolve(); }
    if (el.type === 'shape') { drawShape(ctx, el); return Promise.resolve(); }
    return Promise.resolve();
  });

  return Promise.all(drawPromises).then(() => {
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const q = format === 'jpeg' ? quality : undefined;
    const ext = format === 'jpeg' ? 'jpg' : 'png';

    offscreen.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, mimeType, q);
  });
}

function drawImage(ctx, data) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      ctx.save();
      ctx.globalAlpha = data.opacity;
      ctx.drawImage(img, data.x, data.y, data.width, data.height);
      ctx.restore();
      resolve();
    };
    img.onerror = resolve;
    img.src = data.src;
  });
}

function drawText(ctx, data) {
  ctx.save();
  ctx.globalAlpha = data.opacity;

  const weight = data.bold ? '700' : '400';
  const style = data.italic ? 'italic' : 'normal';
  ctx.font = `${style} ${weight} ${data.fontSize}px '${data.fontFamily}', sans-serif`;
  ctx.fillStyle = data.color;
  ctx.textBaseline = 'top';
  ctx.textAlign = data.textAlign || 'left';

  if (data.rotation !== 0) {
    const metrics = ctx.measureText(data.content);
    const textWidth = metrics.width;
    const textHeight = data.fontSize * 1.2;
    const cx = data.x + textWidth / 2;
    const cy = data.y + textHeight / 2;

    ctx.translate(cx, cy);
    ctx.rotate((data.rotation * Math.PI) / 180);
    ctx.textAlign = 'center';
    ctx.fillText(data.content, 0, -textHeight / 2);
  } else {
    let x = data.x + 8;
    if (data.textAlign === 'center') x = data.x + 8;
    if (data.textAlign === 'right') x = data.x + 8;
    ctx.textAlign = 'left'; // we position with left for canvas export
    ctx.fillText(data.content, x, data.y + 4);
  }

  ctx.restore();
}

function getDomIndex(id) {
  const el = document.querySelector(`[data-id="${id}"]`);
  if (!el) return 0;
  return Array.from(el.parentElement.children).indexOf(el);
}

function drawShape(ctx, data) {
  ctx.save();
  ctx.globalAlpha = data.opacity;

  if (data.rotation !== 0) {
    const cx = data.x + data.width / 2;
    const cy = data.y + data.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate((data.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }

  if (data.shapeType === 'rect') {
    const r = data.borderRadius || 0;
    ctx.beginPath();
    if (r > 0) {
      ctx.roundRect(data.x, data.y, data.width, data.height, r);
    } else {
      ctx.rect(data.x, data.y, data.width, data.height);
    }
    if (data.fill && data.fill !== 'transparent') {
      ctx.fillStyle = data.fill;
      ctx.fill();
    }
    if (data.strokeWidth > 0) {
      ctx.strokeStyle = data.stroke;
      ctx.lineWidth = data.strokeWidth;
      ctx.stroke();
    }
  } else if (data.shapeType === 'circle') {
    const cx = data.x + data.width / 2;
    const cy = data.y + data.height / 2;
    const rx = data.width / 2;
    const ry = data.height / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    if (data.fill && data.fill !== 'transparent') {
      ctx.fillStyle = data.fill;
      ctx.fill();
    }
    if (data.strokeWidth > 0) {
      ctx.strokeStyle = data.stroke;
      ctx.lineWidth = data.strokeWidth;
      ctx.stroke();
    }
  } else if (data.shapeType === 'line') {
    const midY = data.y + (data.height || 0) / 2;
    ctx.beginPath();
    ctx.moveTo(data.x, midY);
    ctx.lineTo(data.x + data.width, midY);
    ctx.strokeStyle = data.stroke;
    ctx.lineWidth = data.strokeWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
  } else if (data.shapeType === 'arrow') {
    const midY = data.y + (data.height || 0) / 2;
    const endX = data.x + data.width;
    const headLen = Math.min(16, data.width * 0.3);
    const headAngle = Math.PI / 6;

    ctx.beginPath();
    ctx.moveTo(data.x, midY);
    ctx.lineTo(endX, midY);
    ctx.strokeStyle = data.stroke;
    ctx.lineWidth = data.strokeWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(endX - headLen * Math.cos(headAngle), midY - headLen * Math.sin(headAngle));
    ctx.lineTo(endX, midY);
    ctx.lineTo(endX - headLen * Math.cos(headAngle), midY + headLen * Math.sin(headAngle));
    ctx.strokeStyle = data.stroke;
    ctx.lineWidth = data.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  ctx.restore();
}
