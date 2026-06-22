/**
 * CropCanvas — Image Layer Manager
 * Handles image loading, drag, resize, and properties.
 */

const ImageManager = (() => {
  let images = []; // Array of image data objects
  let idCounter = 0;

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const data = createImageData(img, e.target.result, file.name);
          images.push(data);
          renderImage(data);
          resolve(data);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function createImageData(img, src, name) {
    const vw = CanvasManager.width;
    const vh = CanvasManager.height;

    // Fit image to viewport if larger
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    const ratio = w / h;

    if (w > vw || h > vh) {
      if (ratio > vw / vh) {
        w = vw;
        h = w / ratio;
      } else {
        h = vh;
        w = h * ratio;
      }
    }

    // Center on viewport
    const x = Math.round((vw - w) / 2);
    const y = Math.round((vh - h) / 2);

    return {
      id: 'img-' + (++idCounter),
      type: 'image',
      name: name || 'Image',
      src,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      x, y,
      width: Math.round(w),
      height: Math.round(h),
      opacity: 1,
      lockRatio: true,
      visible: true,
      aspectRatio: ratio
    };
  }

  function renderImage(data) {
    const container = CanvasManager.viewportContent;

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'element-wrapper animate-in';
    wrapper.dataset.id = data.id;
    wrapper.dataset.type = 'image';
    wrapper.style.left = data.x + 'px';
    wrapper.style.top = data.y + 'px';
    wrapper.style.width = data.width + 'px';
    wrapper.style.height = data.height + 'px';
    wrapper.style.opacity = data.opacity;

    // Image element
    const img = document.createElement('img');
    img.className = 'image-element';
    img.src = data.src;
    img.style.width = '100%';
    img.style.height = '100%';
    img.draggable = false;
    wrapper.appendChild(img);

    // Resize handles
    ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'].forEach(dir => {
      const handle = document.createElement('div');
      handle.className = `resize-handle ${dir}`;
      handle.dataset.dir = dir;
      wrapper.appendChild(handle);
    });

    container.appendChild(wrapper);

    // Hide drop zone
    const dropZone = document.getElementById('drop-zone');
    if (dropZone) dropZone.classList.remove('show-welcome');

    return wrapper;
  }

  function updateImageElement(data) {
    const el = document.querySelector(`[data-id="${data.id}"]`);
    if (!el) return;
    el.style.left = data.x + 'px';
    el.style.top = data.y + 'px';
    el.style.width = data.width + 'px';
    el.style.height = data.height + 'px';
    el.style.opacity = data.opacity;
  }

  function removeImage(id) {
    images = images.filter(img => img.id !== id);
    const el = document.querySelector(`[data-id="${id}"]`);
    if (el) el.remove();

    // Show drop zone if no elements
    if (images.length === 0 && TextManager.getTexts().length === 0) {
      const dropZone = document.getElementById('drop-zone');
      if (dropZone) dropZone.classList.add('show-welcome');
    }
  }

  function getById(id) {
    return images.find(img => img.id === id);
  }

  function getImages() { return images; }

  function getAllElements() {
    return images.map(img => ({ ...img }));
  }

  function setImageState(newImages) {
    // Clear all rendered images
    images.forEach(img => {
      const el = document.querySelector(`[data-id="${img.id}"]`);
      if (el) el.remove();
    });
    images = newImages;
    images.forEach(img => renderImage(img));
  }

  return {
    loadImage,
    renderImage,
    updateImageElement,
    removeImage,
    getById,
    getImages,
    getAllElements,
    setImageState,
    createImageData
  };
})();
