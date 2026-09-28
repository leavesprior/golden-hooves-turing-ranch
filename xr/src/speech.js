// Rung 6, contact: diegetic words that float by Hattie's mouth (no panel, no
// chat window), and three small question cards by the player's left hand.
import { CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace } from 'three';

function wrap(ctx, text, maxW) {
  const lines = [];
  let line = '';
  for (const w of text.split(/\s+/)) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Floating words: transparent, text only with a soft shadow so it reads on any real wall. */
export function buildWords() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 320;
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const mesh = new Mesh(new PlaneGeometry(0.72, 0.225), new MeshBasicMaterial({ map: texture, transparent: true, opacity: 0, depthWrite: false }));
  mesh.visible = false;
  mesh.renderOrder = 10; // her words are never hidden behind a virtual post
  mesh.material.depthTest = false;
  mesh.raycast = () => {};
  const draw = (text) => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 1024, 320);
    ctx.font = '50px Georgia, serif';
    const size = wrap(ctx, text, 960).length > 3 ? 40 : 50;
    ctx.font = `${size}px Georgia, serif`;
    const wrapped = wrap(ctx, text, 960).slice(0, 6);
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#f6ecd6';
    const lh = size * 1.2;
    let y = 160 - ((wrapped.length - 1) * lh) / 2 + size / 3;
    for (const l of wrapped) {
      ctx.fillText(l, 512, y);
      y += lh;
    }
    texture.needsUpdate = true;
  };
  return { mesh, draw };
}

/** One small question card: a slip of paper, pinch to ask. */
export function buildCard(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(236, 224, 196, 0.92)';
  ctx.fillRect(0, 0, 512, 160);
  ctx.strokeStyle = '#6b4a2f';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 506, 154);
  ctx.fillStyle = '#2b1d10';
  let size = 34;
  let lines;
  do {
    ctx.font = `${size}px Georgia, serif`;
    lines = wrap(ctx, text, 470);
    size -= 2;
  } while (lines.length * (size + 8) > 140 && size > 18);
  ctx.textAlign = 'center';
  const lh = size + 8;
  let y = 80 - ((lines.length - 1) * lh) / 2 + size / 3;
  for (const l of lines) {
    ctx.fillText(l, 256, y);
    y += lh;
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return new Mesh(new PlaneGeometry(0.16, 0.05), new MeshBasicMaterial({ map: texture, transparent: true }));
}
