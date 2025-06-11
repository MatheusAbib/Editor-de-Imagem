const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const editor = document.getElementById('editor');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const shapeSlider = document.getElementById('shapeSlider');
const zoomSlider = document.getElementById('zoomSlider');
const shapeValue = document.getElementById('shapeValue');
const zoomValue = document.getElementById('zoomValue');

const brightnessSlider = document.getElementById('brightnessSlider');
const brightnessValue = document.getElementById('brightnessValue');
const contrastSlider = document.getElementById('contrastSlider');
const contrastValue = document.getElementById('contrastValue');
const saturationSlider = document.getElementById('saturationSlider');
const saturationValue = document.getElementById('saturationValue');
const rotateBtn = document.getElementById('rotateBtn');
const bwBtn = document.getElementById("bwBtn");

let isBW = false;
let img = null;
let offsetX = 0;
let offsetY = 0;
let zoom = 1;
let isDragging = false;
let startX, startY;
let outputSize = 512;

let brightness = 100;
let contrast = 100;
let saturation = 100;
let rotation = 0;

brightnessSlider.addEventListener("input", () => {
  brightness = brightnessSlider.value;
  brightnessValue.textContent = brightness + '%';
  draw();
});
contrastSlider.addEventListener("input", () => {
  contrast = contrastSlider.value;
  contrastValue.textContent = contrast + '%';
  draw();
});
saturationSlider.addEventListener("input", () => {
  saturation = saturationSlider.value;
  saturationValue.textContent = saturation + '%';
  draw();
});

bwBtn.addEventListener("click", () => {
  isBW = !isBW;
  bwBtn.classList.toggle("active");
  draw();
});

document.addEventListener('DOMContentLoaded', function() {
  const savedImage = localStorage.getItem('savedAvatarImage');
  if (savedImage) {
    loadImageFromData(savedImage);
  }
});

function sliderToN(sliderValue) {
  if (sliderValue >= 99) return Infinity;
  return 2 + Math.pow(sliderValue / 100, 2) * 50;
}

uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    loadImage(file);
  }
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) loadImage(file);
});

function loadImage(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    localStorage.setItem('savedAvatarImage', e.target.result);
    loadImageFromData(e.target.result);
  };
  reader.readAsDataURL(file);
}

function loadImageFromData(imageData) {
  img = new Image();
  img.onload = () => {
    uploadArea.style.display = 'none';
    editor.style.display = 'block';
    resetPosition();
    draw();
  };
  img.src = imageData;
}

function resetPosition() {
  zoom = 1;
  zoomSlider.value = 1;
  zoomValue.textContent = '1.0×';

  shapeSlider.value = 20;
  shapeValue.textContent = 'Soft';

  brightness = 100;
  contrast = 100;
  saturation = 100;
  rotation = 0;

  brightnessSlider.value = 100;
  contrastSlider.value = 100;
  saturationSlider.value = 100;
  brightnessValue.textContent = '100%';
  contrastValue.textContent = '100%';
  saturationValue.textContent = '100%';

  const scale = Math.max(300 / img.width, 300 / img.height) * zoom;
  offsetX = (300 - img.width * scale) / 2;
  offsetY = (300 - img.height * scale) / 2;

  isBW = false;
  bwBtn.classList.remove("active");
}

function createSquirclePath(ctx, cx, cy, size, n) {
  ctx.beginPath();
  if (n === Infinity) {
    const half = size / 2;
    ctx.rect(cx - half, cy - half, size, size);
  } else {
    for (let t = 0; t <= Math.PI * 2; t += 0.02) {
      const cos = Math.cos(t);
      const sin = Math.sin(t);
      const r = size / 2 / Math.pow(Math.pow(Math.abs(cos), n) + Math.pow(Math.abs(sin), n), 1/n);
      const x = cx + r * cos;
      const y = cy + r * sin;
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
}

function draw() {
  if (!img) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  ctx.clearRect(0, 0, 300, 300);
  ctx.save();

  const sliderVal = parseFloat(shapeSlider.value);
  const n = sliderToN(sliderVal);
  createSquirclePath(ctx, 150, 150, 300, n);
  ctx.clip();

  ctx.translate(150, 150);
  ctx.rotate(rotation * Math.PI / 180);
  ctx.translate(-150, -150);

  // Monta o filtro CSS do canvas (brilho, contraste, saturação e grayscale)
  let filters = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  if (isBW) filters += " grayscale(100%)";
  ctx.filter = filters;

  const scale = Math.max(300 / img.width, 300 / img.height) * zoom;
  ctx.drawImage(img, offsetX, offsetY, img.width * scale, img.height * scale);

  ctx.restore();

  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 2;
  createSquirclePath(ctx, 150, 150, 300, n);
  ctx.stroke();
}

// --- Drag & Touch Support ---

function getPointerPosition(evt) {
  const rect = canvas.getBoundingClientRect();
  if (evt.touches) {
    return {
      x: evt.touches[0].clientX - rect.left,
      y: evt.touches[0].clientY - rect.top
    };
  } else {
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  }
}

function startDrag(evt) {
  evt.preventDefault();
  if (!img) return;
  isDragging = true;
  const pos = getPointerPosition(evt);
  startX = pos.x - offsetX;
  startY = pos.y - offsetY;
  canvas.style.cursor = 'grabbing';
}

function duringDrag(evt) {
  if (!isDragging) return;
  evt.preventDefault();
  const pos = getPointerPosition(evt);
  offsetX = pos.x - startX;
  offsetY = pos.y - startY;
  draw();
}

function endDrag(evt) {
  if (!isDragging) return;
  evt.preventDefault();
  isDragging = false;
  canvas.style.cursor = 'move';
}

canvas.addEventListener('mousedown', startDrag);
canvas.addEventListener('touchstart', startDrag, {passive: false});
document.addEventListener('mousemove', duringDrag);
document.addEventListener('touchmove', duringDrag, {passive: false});
document.addEventListener('mouseup', endDrag);
document.addEventListener('touchend', endDrag);
document.addEventListener('touchcancel', endDrag);

shapeSlider.addEventListener('input', () => {
  const val = parseFloat(shapeSlider.value);
  if (val === 0) shapeValue.textContent = 'Circle';
  else if (val < 30) shapeValue.textContent = 'Soft';
  else if (val < 50) shapeValue.textContent = 'Medium';
  else if (val < 80) shapeValue.textContent = 'Hard';
  else if (val >= 100) shapeValue.textContent = 'Square';
  else shapeValue.textContent = val;

  document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
  draw();
});

zoomSlider.addEventListener('input', () => {
  if (!img) return;
  const newZoom = parseFloat(zoomSlider.value);
  const zoomDiff = newZoom / zoom;
  zoom = newZoom;
  zoomValue.textContent = zoom.toFixed(1) + '×';

  // Ajusta o offset para manter o centro da imagem
  const centerX = 150;
  const centerY = 150;
  offsetX = centerX - (centerX - offsetX) * zoomDiff;
  offsetY = centerY - (centerY - offsetY) * zoomDiff;

  draw();
});

rotateBtn.addEventListener('click', () => {
  if (!img) return;
  rotation = (rotation + 90) % 360;
  draw();
});

// Exporta a imagem final em PNG no tamanho definido
document.getElementById('exportBtn').addEventListener('click', () => {
  if (!img) return;

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = outputSize;
  exportCanvas.height = outputSize;
  const exportCtx = exportCanvas.getContext('2d');

  // Aplica o mesmo formato de recorte squircle
  exportCtx.save();

  const sliderVal = parseFloat(shapeSlider.value);
  const n = sliderToN(sliderVal);
  createSquirclePath(exportCtx, outputSize/2, outputSize/2, outputSize, n);
  exportCtx.clip();

  exportCtx.translate(outputSize / 2, outputSize / 2);
  exportCtx.rotate(rotation * Math.PI / 180);
  exportCtx.translate(-outputSize / 2, -outputSize / 2);

  // Aplica filtros
  let filters = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  if (isBW) filters += " grayscale(100%)";
  exportCtx.filter = filters;

  const scale = Math.max(outputSize / img.width, outputSize / img.height) * zoom;
  exportCtx.drawImage(img, offsetX * (outputSize / 300), offsetY * (outputSize / 300), img.width * scale, img.height * scale);

  exportCtx.restore();

  const dataUrl = exportCanvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = 'avatar.png';
  a.click();
});
