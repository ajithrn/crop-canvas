/**
 * Custom Inline Color Picker
 * Provides a popover with saturation/brightness square, hue slider, and preset swatches.
 */

let activePickerEl = null;
let activePicker = null;
let currentCallback = null;

const SWATCHES = [
  '#ffffff', '#000000', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#fecaca', '#fed7aa', '#fef08a', '#bbf7d0', '#a5f3fc',
  '#bfdbfe', '#ddd6fe', '#fbcfe8', '#6b7280', '#374151',
];

export function openPicker(targetEl, currentColor, onChange) {
  closePicker();
  currentCallback = onChange;

  const rect = targetEl.getBoundingClientRect();
  const picker = document.createElement('div');
  picker.className = 'cp-popover';
  picker.innerHTML = `
    <div class="cp-sat-wrap">
      <canvas class="cp-sat" width="180" height="140"></canvas>
      <div class="cp-sat-cursor"></div>
    </div>
    <canvas class="cp-hue" width="180" height="14"></canvas>
    <div class="cp-hue-cursor"></div>
    <div class="cp-footer">
      <input type="text" class="cp-hex-input" maxlength="7" spellcheck="false">
    </div>
    <div class="cp-swatches">${SWATCHES.map(c => `<button class="cp-swatch" data-color="${c}" style="background:${c}"></button>`).join('')}</div>
  `;

  document.body.appendChild(picker);

  // Position popover
  const pickerW = 210;
  let left = rect.left;
  let top = rect.bottom + 6;
  if (left + pickerW > window.innerWidth) left = window.innerWidth - pickerW - 8;
  if (top + 280 > window.innerHeight) top = rect.top - 280;
  picker.style.left = left + 'px';
  picker.style.top = top + 'px';

  activePicker = picker;
  activePickerEl = targetEl;

  const satCanvas = picker.querySelector('.cp-sat');
  const hueCanvas = picker.querySelector('.cp-hue');
  const satCursor = picker.querySelector('.cp-sat-cursor');
  const hueCursor = picker.querySelector('.cp-hue-cursor');
  const hexInput = picker.querySelector('.cp-hex-input');

  // Parse initial color
  let hsv = hexToHsv(currentColor || '#ffffff');

  function render() {
    drawSaturation(satCanvas, hsv.h);
    drawHue(hueCanvas);
    updateCursors();
    const hex = hsvToHex(hsv.h, hsv.s, hsv.v);
    hexInput.value = hex;
    if (currentCallback) currentCallback(hex);
  }

  function updateCursors() {
    const sw = satCanvas.width;
    const sh = satCanvas.height;
    satCursor.style.left = (hsv.s * sw) + 'px';
    satCursor.style.top = ((1 - hsv.v) * sh) + 'px';
    hueCursor.style.left = (hsv.h / 360 * hueCanvas.width) + 'px';
  }

  // Saturation/Brightness interaction
  function satDown(e) {
    e.preventDefault();
    const update = (ev) => {
      const rect = satCanvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height));
      hsv.s = x;
      hsv.v = 1 - y;
      render();
    };
    update(e);
    const move = (ev) => update(ev);
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }
  satCanvas.addEventListener('mousedown', satDown);

  // Hue interaction
  function hueDown(e) {
    e.preventDefault();
    const update = (ev) => {
      const rect = hueCanvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      hsv.h = x * 360;
      render();
    };
    update(e);
    const move = (ev) => update(ev);
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }
  hueCanvas.addEventListener('mousedown', hueDown);

  // Hex input
  hexInput.addEventListener('input', () => {
    const val = hexInput.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      hsv = hexToHsv(val);
      render();
    }
  });

  // Swatches
  picker.querySelectorAll('.cp-swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      hsv = hexToHsv(btn.dataset.color);
      render();
    });
  });

  // Close on outside click (delayed to avoid immediate close)
  setTimeout(() => {
    document.addEventListener('mousedown', outsideClick);
  }, 10);

  render();
}

function outsideClick(e) {
  if (activePicker && !activePicker.contains(e.target) && e.target !== activePickerEl) {
    closePicker();
  }
}

export function closePicker() {
  if (activePicker) {
    activePicker.remove();
    activePicker = null;
    activePickerEl = null;
    currentCallback = null;
    document.removeEventListener('mousedown', outsideClick);
  }
}

// --- Drawing ---
function drawSaturation(canvas, hue) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // Base hue fill
  ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
  ctx.fillRect(0, 0, w, h);

  // White gradient left to right
  const white = ctx.createLinearGradient(0, 0, w, 0);
  white.addColorStop(0, 'rgba(255,255,255,1)');
  white.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = white;
  ctx.fillRect(0, 0, w, h);

  // Black gradient top to bottom
  const black = ctx.createLinearGradient(0, 0, 0, h);
  black.addColorStop(0, 'rgba(0,0,0,0)');
  black.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.fillStyle = black;
  ctx.fillRect(0, 0, w, h);
}

function drawHue(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grad = ctx.createLinearGradient(0, 0, w, 0);
  for (let i = 0; i <= 6; i++) {
    grad.addColorStop(i / 6, `hsl(${i * 60}, 100%, 50%)`);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

// --- Color math ---
function hexToHsv(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

function hsvToHex(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r, g, b;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const toHex = (n) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
