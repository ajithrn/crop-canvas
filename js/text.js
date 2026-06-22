/**
 * CropCanvas — Text Layer Manager
 * Handles text creation, editing, rotation, and properties.
 */

const TextManager = (() => {
  let texts = [];
  let idCounter = 0;

  function addText(options = {}) {
    const vw = CanvasManager.width;
    const vh = CanvasManager.height;

    const data = {
      id: 'txt-' + (++idCounter),
      type: 'text',
      name: 'Text ' + idCounter,
      content: options.content || 'Double-click to edit',
      x: options.x ?? Math.round(vw / 2 - 80),
      y: options.y ?? Math.round(vh / 2 - 12),
      fontFamily: options.fontFamily || 'Inter',
      fontSize: options.fontSize || 24,
      color: options.color || '#ffffff',
      bold: options.bold || false,
      italic: options.italic || false,
      rotation: options.rotation || 0,
      opacity: options.opacity ?? 1,
      visible: true
    };

    texts.push(data);
    renderText(data);

    // Hide drop zone
    const dropZone = document.getElementById('drop-zone');
    if (dropZone) dropZone.classList.remove('show-welcome');

    return data;
  }

  function renderText(data) {
    const container = CanvasManager.viewportContent;

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
    wrapper.appendChild(textEl);

    // Resize handles (fewer for text)
    ['nw', 'ne', 'sw', 'se'].forEach(dir => {
      const handle = document.createElement('div');
      handle.className = `resize-handle ${dir}`;
      handle.dataset.dir = dir;
      wrapper.appendChild(handle);
    });

    container.appendChild(wrapper);
    return wrapper;
  }

  function updateTextElement(data) {
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
    }
  }

  function startEditing(id) {
    const data = getById(id);
    if (!data) return;

    const el = document.querySelector(`[data-id="${id}"] .text-element`);
    if (!el) return;

    el.classList.add('editing');
    el.contentEditable = true;
    el.focus();

    // Select all text
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
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        el.blur();
      }
      if (e.key === 'Escape') {
        el.blur();
      }
      e.stopPropagation(); // Prevent workspace shortcuts while editing
    };

    el.addEventListener('blur', finishEdit);
    el.addEventListener('keydown', onKeyDown);
  }

  function removeText(id) {
    texts = texts.filter(t => t.id !== id);
    const el = document.querySelector(`[data-id="${id}"]`);
    if (el) el.remove();

    if (texts.length === 0 && ImageManager.getImages().length === 0) {
      const dropZone = document.getElementById('drop-zone');
      if (dropZone) dropZone.classList.add('show-welcome');
    }
  }

  function getById(id) {
    return texts.find(t => t.id === id);
  }

  function getTexts() { return texts; }

  function getAllElements() {
    return texts.map(t => ({ ...t }));
  }

  function setTextState(newTexts) {
    texts.forEach(t => {
      const el = document.querySelector(`[data-id="${t.id}"]`);
      if (el) el.remove();
    });
    texts = newTexts;
    texts.forEach(t => renderText(t));
  }

  return {
    addText,
    renderText,
    updateTextElement,
    startEditing,
    removeText,
    getById,
    getTexts,
    getAllElements,
    setTextState
  };
})();
