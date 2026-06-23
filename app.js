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

let frameOverlay = null;
let originalImage = null;
let activeImage = null;
let activeObjectURL = null;
let originalFile = null;

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

  if (frameOverlay) {
    ctx.drawImage(frameOverlay, 0, 0, FRAME_W, FRAME_H);
  }
}

async function fileToImage(file) {
  if (activeObjectURL) URL.revokeObjectURL(activeObjectURL);
  activeObjectURL = URL.createObjectURL(file);
  return await loadImage(activeObjectURL);
}

function imageToReducedDataURL(image, maxSide = 1600) {
  const ratio = image.width / image.height;
  let w = image.width;
  let h = image.height;

  if (Math.max(w, h) > maxSide) {
    if (w > h) {
      w = maxSide;
      h = Math.round(maxSide / ratio);
    } else {
      h = maxSide;
      w = Math.round(maxSide * ratio);
    }
  }

  const temp = document.createElement('canvas');
  temp.width = w;
  temp.height = h;
  const tctx = temp.getContext('2d');
  tctx.drawImage(image, 0, 0, w, h);
  return temp.toDataURL('image/jpeg', 0.9);
}

async function runBackgroundRemoval() {
  if (!originalImage || !originalFile) return;

  setStatus('Removing background… please wait until it says completed.');
  removeBgBtn.disabled = true;

  try {
    const imageData = imageToReducedDataURL(originalImage);

    const response = await fetch('/api/remove-bg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Background removal failed.');
    }

    activeImage = await loadImage(result.imageData);
    drawComposite();
    setStatus('Background removed. Adjust the photo, then download.');
  } catch (err) {
    console.error(err);
    activeImage = originalImage;
    drawComposite();
    setStatus(err.message || 'Background removal failed. Check your Vercel REMOVE_BG_API_KEY setting.');
  } finally {
    removeBgBtn.disabled = false;
  }
}

photoInput.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    setStatus('Please upload an image file.');
    return;
  }

  setStatus('Loading your photo…');

  try {
    originalFile = file;
    originalImage = await fileToImage(file);
    activeImage = originalImage;

    scaleRange.value = 100;
    xRange.value = 0;
    yRange.value = 0;

    drawComposite();

    removeBgBtn.disabled = false;
    useOriginalBtn.disabled = false;
    downloadBtn.disabled = false;

    setStatus('Photo loaded. Click “Remove background” and wait before downloading.');
  } catch (err) {
    console.error(err);
    setStatus('The photo did not load. Try a smaller JPG or PNG image.');
  }
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

(async function init() {
  try {
    frameOverlay = await loadImage('assets/frame_overlay.png');
    drawComposite();
    setStatus('Upload a picture to begin.');
  } catch (err) {
    console.error(err);
    setStatus('Frame asset could not load. Make sure the assets folder uploaded correctly.');
  }
})();
