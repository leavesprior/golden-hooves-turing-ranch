// Laws of the layer as a machine (OUT_OF_TIME_AR_REDESIGN_20260927.md). Returns
// violations; an empty list is the only pass. Run against the live scene.
import { Box3, Matrix4, Vector3 } from 'three';

export const LAW_LIMITS = {
  maxSheetArea: 1.5, // m^2: a flat mesh bigger than this could act as a veil (law 1)
  frame: { x: 2.2, yMin: -0.05, yMax: 3.0, zMin: -0.05, zMax: 2.6 }, // facade volume, m (law 2)
};

export function checkLaws({ scene, root, layers, line }) {
  const v = [];
  if (scene.background) v.push('law1: scene.background is set (passthrough must show)');
  if (scene.fog) v.push('law1: scene.fog is set (a veil)');
  const box = new Box3();
  const size = new Vector3();
  const inv = root.matrixWorld.clone().invert();
  const rel = new Matrix4();
  for (const [id, group] of Object.entries(layers)) {
    group.traverse((o) => {
      if (!o.isMesh || !o.geometry) return;
      o.geometry.computeBoundingBox();
      // One combined transform into the facade frame: re-boxing twice inflates a
      // rotated box (a flat sheet reads as thick, thin parts poke behind the wall).
      box.copy(o.geometry.boundingBox).applyMatrix4(rel.multiplyMatrices(inv, o.matrixWorld));
      box.getSize(size);
      const dims = [size.x, size.y, size.z].sort((a, b) => b - a);
      if (dims[2] < 0.06 && dims[0] * dims[1] > LAW_LIMITS.maxSheetArea) {
        v.push(`law1: ${id} has a ${dims[0].toFixed(1)}x${dims[1].toFixed(1)} m sheet`);
      }
      const f = LAW_LIMITS.frame;
      if (box.min.x < -f.x || box.max.x > f.x || box.min.y < f.yMin || box.max.y > f.yMax || box.min.z < f.zMin || box.max.z > f.zMax) {
        v.push(`law2: ${id} mesh outside the facade volume [${box.min.toArray().map((n) => n.toFixed(2))} .. ${box.max.toArray().map((n) => n.toFixed(2))}]`);
      }
    });
  }
  for (const layer of line) {
    if (![1, 0, -1].includes(layer.conf)) v.push(`law5: layer ${layer.id} has no ternary conf`);
    if (!layer.record || layer.record.length < 20) v.push(`law5: layer ${layer.id} has no Honest Record`);
  }
  return v;
}

/** Instrument check: how many meshes each layer exposes to the law machine. */
export function lawCoverage(layers) {
  const c = {};
  for (const [id, g] of Object.entries(layers)) {
    let n = 0;
    g.traverse((o) => { if (o.isMesh) n++; });
    c[id] = n;
  }
  return c;
}
