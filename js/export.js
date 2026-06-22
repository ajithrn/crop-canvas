/**
 * CropCanvas — Export Engine
 * Renders the viewport to an offscreen canvas and triggers download.
 */

const ExportEngine = (() => {

  function exportCanvas(format = 'png', quality = 0.92) {
    const w = CanvasManager.width;
    const h = CanvasManager.height;

    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    const ctx = offscreen.getContext('2d');

    // Draw background
    ctx.fillStyle = CanvasManager.canvasBg;
    ctx.fillRect(0, 0, w, h);

    // Collect all elements sorted by DOM order
    const allElements = [];

    // Get image elements
    ImageManager.getImages().forEach(img => {
      if (!img.visible) return;
      allElements.push({ ...img, zIndex: getDomIndex(img.id) });
    });

    // Get text elements
    TextManager.getTexts().forEach(txt => {
      if (!txt.visible) return;
      allElements.push({ ...txt, zIndex: getDomIndex(txt.id) });
    });

    // Sort by DOM order
    allElements.sort((a, b) => a.zIndex - b.zIndex);

    // Draw elements
    const drawPromises = allElements.map(el => {
      if (el.type === 'image') {
        return drawImage(ctx, el);
      } else if (el.type === 'text') {
        drawText(ctx, el);
        return Promise.resolve();
      }
      return Promise.resolve();
    });

    return Promise.all(drawPromises).then(() => {
      const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const q = format === 'jpeg' ? quality : undefined;

      offscreen.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cropcanvas-export.${format === 'jpeg' ? 'jpg' : 'png'}`;
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

    if (data.rotation !== 0) {
      // Calculate text metrics for center-based rotation
      const metrics = ctx.measureText(data.content);
      const textWidth = metrics.width;
      const textHeight = data.fontSize * 1.2;

      const cx = data.x + textWidth / 2;
      const cy = data.y + textHeight / 2;

      ctx.translate(cx, cy);
      ctx.rotate((data.rotation * Math.PI) / 180);
      ctx.fillText(data.content, -textWidth / 2, -textHeight / 2);
    } else {
      ctx.fillText(data.content, data.x + 8, data.y + 4); // Match CSS padding
    }

    ctx.restore();
  }

  function getDomIndex(id) {
    const el = document.querySelector(`[data-id="${id}"]`);
    if (!el) return 0;
    const parent = el.parentElement;
    return Array.from(parent.children).indexOf(el);
  }

  return { exportCanvas };
})();
