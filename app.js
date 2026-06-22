import { removeBackground } from 'https://cdn.jsdelivr.net/npm/@imgly/background-removal/+esm';

const FRAME_W = 1122;
const FRAME_H = 1402;
const PHOTO_BOX = { x: 248, y: 228, w: 620, h: 620, r: 22 };

const photoInput = document.getElementById('photoInput');
const removeBgBtn = document.getElementById('removeBgBtn');
const useOriginalBtn = document.getElementById('useOriginalBtn');
const downloadBtn = document.getElementById('downloadBtn');
const scaleRange = document.getElementById('scaleRange');
const xRange = document.getElementById('xRange');
const yRange = document.getElementById('yRange');
const statusEl = document.getElementById('status');
const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');

const frameOverlay = await loadImage('assets/frame_overlay.png');
let originalImage = null;
let activeImage = null;
let activeObjectURL = null;

function setStatus(msg) {
  statusEl.textContent = msg;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawComposite() {
  ctx.clearRect(0, 0, FRAME_W, FRAME_H);

  if (activeImage) {
    const zoom = Number(scaleRange.value) / 100;
    const dx = Number(xRange.value);
    const dy = Number(yRange.value);

    const imgRatio = activeImage.width / activeImage.height;
    let drawW = PHOTO_BOX.w;
    let drawH = PHOTO_BOX.h;

    if (imgRatio > 1) {
      drawH = PHOTO_BOX.h * zoom;
      drawW = drawH * imgRatio;
    } else {
      drawW = PHOTO_BOX.w * zoom;
      drawH = drawW / imgRatio;
      if (drawH < PHOTO_BOX.h * zoom) {
        drawH = PHOTO_BOX.h * zoom;
        drawW = drawH * imgRatio;
      }
    }

    const px = PHOTO_BOX.x + (PHOTO_BOX.w - drawW) / 2 + dx;
    const py = PHOTO_BOX.y + (PHOTO_BOX.h - drawH) / 2 + dy;

    ctx.save();
    roundedRectPath(ctx, PHOTO_BOX.x, PHOTO_BOX.y, PHOTO_BOX.w, PHOTO_BOX.h, PHOTO_BOX.r);
    ctx.clip();
    ctx.filter = 'brightness(1.03) contrast(1.08) saturate(1.04)';
    ctx.drawImage(activeImage, px, py, drawW, drawH);
    ctx.restore();
    ctx.filter = 'none';
  }

  ctx.drawImage(frameOverlay, 0, 0, FRAME_W, FRAME_H);
}

async function fileToImage(file) {
  if (activeObjectURL) URL.revokeObjectURL(activeObjectURL);
  activeObjectURL = URL.createObjectURL(file);
  return await loadImage(activeObjectURL);
}

async function runBackgroundRemoval() {
  if (!originalImage || !photoInput.files?.[0]) return;
  setStatus('Removing background… this may take a few seconds.');
  removeBgBtn.disabled = true;
  try {
    const blob = await removeBackground(photoInput.files[0]);
    if (activeObjectURL) URL.revokeObjectURL(activeObjectURL);
    activeObjectURL = URL.createObjectURL(blob);
    activeImage = await loadImage(activeObjectURL);
    drawComposite();
    setStatus('Background removed. You can now adjust and download.');
  } catch (err) {
    console.error(err);
    activeImage = originalImage;
    drawComposite();
    setStatus('Background removal failed in this browser. You can still use the original photo or connect a server API after deployment.');
  } finally {
    removeBgBtn.disabled = false;
  }
}

photoInput.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setStatus('Loading your photo…');
  originalImage = await fileToImage(file);
  activeImage = originalImage;
  scaleRange.value = 100;
  xRange.value = 0;
  yRange.value = 0;
  drawComposite();
  removeBgBtn.disabled = false;
  useOriginalBtn.disabled = false;
  downloadBtn.disabled = false;
  setStatus('Photo loaded. Click “Auto remove background” or download as is.');
});

removeBgBtn.addEventListener('click', runBackgroundRemoval);
useOriginalBtn.addEventListener('click', () => {
  if (!originalImage) return;
  activeImage = originalImage;
  drawComposite();
  setStatus('Using the original photo.');
});

[scaleRange, xRange, yRange].forEach(el => el.addEventListener('input', drawComposite));

downloadBtn.addEventListener('click', () => {
  drawComposite();
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = 'rccg-middle-east-convention-attending-frame.png';
  a.click();
});

drawComposite();
