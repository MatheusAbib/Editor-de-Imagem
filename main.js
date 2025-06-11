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
  shapeValue.textContent = 'Círculo';

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
  if (!img) return;

  ctx.clearRect(0, 0, 300, 300);
  ctx.save();

  const sliderVal = parseFloat(shapeSlider.value);
  const n = sliderToN(sliderVal);
  createSquirclePath(ctx, 150, 150, 300, n);
  ctx.clip();

  ctx.translate(150, 150);
  ctx.rotate(rotation * Math.PI / 180);
  ctx.translate(-150, -150);

  let filters = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  if (isBW) filters += " grayscale(100%)";
  ctx.filter = filters;

  const scale = Math.max(300 / img.width, 300 / img.height) * zoom;
const drawWidth = img.width * scale;
const drawHeight = img.height * scale;

const centerX = 150 - drawWidth / 2 + offsetX;
const centerY = 150 - drawHeight / 2 + offsetY;

ctx.drawImage(img, centerX, centerY, drawWidth, drawHeight);

  ctx.restore();

  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 2;
  createSquirclePath(ctx, 150, 150, 300, n);
  ctx.stroke();
}

canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  const rect = canvas.getBoundingClientRect();
  startX = e.clientX - rect.left - offsetX;
  startY = e.clientY - rect.top - offsetY;
  canvas.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const rect = canvas.getBoundingClientRect();
  offsetX = e.clientX - rect.left - startX;
  offsetY = e.clientY - rect.top - startY;
  draw();
});

document.addEventListener('mouseup', () => {
  isDragging = false;
  canvas.style.cursor = 'move';
});

shapeSlider.addEventListener('input', () => {
  const val = parseFloat(shapeSlider.value);
  if (val === 0) shapeValue.textContent = 'Círculo';
  else if (val < 30) shapeValue.textContent = 'Arredondado';
  else if (val < 50) shapeValue.textContent = 'Médio';
  else if (val < 80) shapeValue.textContent = 'Sem Ponta';
  else if (val <= 100) shapeValue.textContent = 'Quadrado';
  else shapeValue.textContent = val;

  document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
  draw();
});

zoomSlider.addEventListener('input', () => {
  const newZoom = parseFloat(zoomSlider.value);
  const zoomDiff = newZoom / zoom;
  zoom = newZoom;
  zoomValue.textContent = zoom.toFixed(1) + '×';
  offsetX = 150 + (offsetX - 150) * zoomDiff;
  offsetY = 150 + (offsetY - 150) * zoomDiff;
  draw();
});

rotateBtn.addEventListener('click', () => {
  rotation = (rotation + 90) % 360;
  draw();
});

function setShape(sliderVal) {
  shapeSlider.value = sliderVal;
  const val = parseFloat(sliderVal);
  if (val === 0) shapeValue.textContent = 'Círculo';
  else if (val < 30) shapeValue.textContent = 'Arredondado';
  else if (val < 50) shapeValue.textContent = 'Médio';
  else if (val < 80) shapeValue.textContent = 'Sem Ponta';
  else if (val <= 100) shapeValue.textContent = 'Quadrado';
  else shapeValue.textContent = val;

  document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  draw();
}

function setSize(size) {
  outputSize = size;
  document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function resetImage() {
  localStorage.removeItem('savedAvatarImage');
  uploadArea.style.display = 'block';
  editor.style.display = 'none';
  fileInput.value = '';
  img = null;
}

function downloadImage() {
  if (!img) return;

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = outputSize;
  outputCanvas.height = outputSize;
  const outputCtx = outputCanvas.getContext('2d');

  const scaleFactor = outputSize / 300;

  outputCtx.clearRect(0, 0, outputSize, outputSize);
  outputCtx.save();

  const sliderVal = parseFloat(shapeSlider.value);
  const n = sliderToN(sliderVal);
  createSquirclePath(outputCtx, outputSize / 2, outputSize / 2, outputSize, n);
  outputCtx.clip();

  outputCtx.translate(outputSize / 2, outputSize / 2);
  outputCtx.rotate(rotation * Math.PI / 180);
  outputCtx.translate(-outputSize / 2, -outputSize / 2);

  let filters = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  if (isBW) filters += " grayscale(100%)";
  outputCtx.filter = filters;

  // Aplica o mesmo cálculo de posição e escala que o draw() usa
  const baseScale = Math.max(300 / img.width, 300 / img.height);
  const finalScale = baseScale * zoom * scaleFactor;
  const drawWidth = img.width * finalScale;
  const drawHeight = img.height * finalScale;

  const centerX = outputSize / 2 - drawWidth / 2 + offsetX * scaleFactor;
  const centerY = outputSize / 2 - drawHeight / 2 + offsetY * scaleFactor;

  outputCtx.drawImage(img, centerX, centerY, drawWidth, drawHeight);

  outputCtx.restore();

  outputCanvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `squircle-avatar-${outputSize}x${outputSize}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
}
