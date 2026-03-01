const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function createIcon(size) {
  const scale = 4;
  const renderSize = size * scale;
  const canvas = createCanvas(renderSize, renderSize);
  const ctx = canvas.getContext('2d');

  // Rounded rectangle background
  const pad = renderSize * 0.02;
  const corner = renderSize * 0.18;
  const bgColor = '#236432';

  ctx.beginPath();
  ctx.roundRect(pad, pad, renderSize - pad * 2, renderSize - pad * 2, corner);
  ctx.fillStyle = bgColor;
  ctx.fill();

  // Text settings - bold
  const fontSize = Math.floor(renderSize * 0.28);
  const fontStr = `900 ${fontSize}px Arial, sans-serif`;
  const strokeWidth = 6;
  const text = '성경';

  // Measure actual text bounds including descenders
  ctx.font = fontStr;
  const metrics = ctx.measureText(text);
  const actualTop = metrics.actualBoundingBoxAscent;
  const actualBottom = metrics.actualBoundingBoxDescent;
  const actualLeft = metrics.actualBoundingBoxLeft;
  const actualRight = metrics.actualBoundingBoxRight;
  const textWidth = actualLeft + actualRight + strokeWidth * 2;
  const textHeight = actualTop + actualBottom + strokeWidth * 2;

  // Draw text on temporary canvas with enough room for descenders
  const margin = 10;
  const txtCanvas = createCanvas(Math.ceil(textWidth) + margin * 2, Math.ceil(textHeight) + margin * 2);
  const txtCtx = txtCanvas.getContext('2d');
  txtCtx.font = fontStr;
  txtCtx.fillStyle = '#ffffff';
  txtCtx.strokeStyle = '#ffffff';
  txtCtx.lineWidth = strokeWidth;
  txtCtx.lineJoin = 'round';
  txtCtx.textAlign = 'left';
  txtCtx.textBaseline = 'alphabetic';

  // Position text so ascenders and descenders both fit
  const tx = actualLeft + strokeWidth + margin;
  const ty = actualTop + strokeWidth + margin;

  // Stroke first for extra thickness, then fill
  txtCtx.strokeText(text, tx, ty);
  txtCtx.fillText(text, tx, ty);

  // Draw text centered on main canvas (no stretch for Korean)
  const destWidth = txtCanvas.width;
  const destHeight = txtCanvas.height;
  const dx = (renderSize - destWidth) / 2;
  const dy = (renderSize - destHeight) / 2;

  ctx.drawImage(txtCanvas, 0, 0, txtCanvas.width, txtCanvas.height, dx, dy, destWidth, destHeight);

  // Downscale to target size
  const finalCanvas = createCanvas(size, size);
  const finalCtx = finalCanvas.getContext('2d');
  finalCtx.drawImage(canvas, 0, 0, renderSize, renderSize, 0, 0, size, size);

  return finalCanvas;
}

const outDir = path.join(__dirname, '..', 'public');

[512, 192].forEach(size => {
  const canvas = createIcon(size);
  const buffer = canvas.toBuffer('image/png');
  const filePath = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, buffer);
  console.log(`Created ${filePath} (${size}x${size})`);
});

// Also create icon.png (same as 512)
const canvas512 = createIcon(512);
fs.writeFileSync(path.join(outDir, 'icon.png'), canvas512.toBuffer('image/png'));
console.log('Created icon.png (512x512)');

// Also copy to data/icon.png
fs.writeFileSync(path.join(outDir, 'data', 'icon.png'), canvas512.toBuffer('image/png'));
console.log('Created data/icon.png (512x512)');
