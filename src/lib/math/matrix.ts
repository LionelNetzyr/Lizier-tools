import type { Matrix } from '../types';
export const IDENTITY_MATRIX: Matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
export function multiplyMatrices(m1: Matrix, m2: Matrix): Matrix { return { a: m1.a * m2.a + m1.c * m2.b, b: m1.b * m2.a + m1.d * m2.b, c: m1.a * m2.c + m1.c * m2.d, d: m1.b * m2.c + m1.d * m2.d, e: m1.a * m2.e + m1.c * m2.f + m1.e, f: m1.b * m2.e + m1.d * m2.f + m1.f }; }
export function parseTransformMatrix(transformStr: string | null): Matrix {
  if (!transformStr) return IDENTITY_MATRIX;
  const tokenRe = /(\w+)\s*\(([^)]*)\)/g;
  let result: Matrix = IDENTITY_MATRIX;
  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(transformStr)) !== null) {
    const fn = m[1]; const args = m[2].trim().split(/[\s,]+/).map(Number);
    let mat: Matrix = IDENTITY_MATRIX;
    if (fn === 'matrix' && args.length >= 6) mat = { a: args[0], b: args[1], c: args[2], d: args[3], e: args[4], f: args[5] };
    else if (fn === 'translate') mat = { a: 1, b: 0, c: 0, d: 1, e: args[0] || 0, f: args[1] || 0 };
    else if (fn === 'scale') { const sx = args[0] || 1; const sy = args.length >= 2 ? args[1] : sx; mat = { a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 }; }
    else if (fn === 'rotate') { const ang = (args[0] || 0) * Math.PI / 180; const cx = args[1] || 0; const cy = args[2] || 0; const cos = Math.cos(ang); const sin = Math.sin(ang); if (cx || cy) { const t1: Matrix = { a: 1, b: 0, c: 0, d: 1, e: cx, f: cy }; const r: Matrix = { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 }; const t2: Matrix = { a: 1, b: 0, c: 0, d: 1, e: -cx, f: -cy }; mat = multiplyMatrices(multiplyMatrices(t1, r), t2); } else mat = { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 }; }
    else if (fn === 'skewX') mat = { a: 1, b: 0, c: Math.tan((args[0] || 0) * Math.PI / 180), d: 1, e: 0, f: 0 };
    else if (fn === 'skewY') mat = { a: 1, b: Math.tan((args[0] || 0) * Math.PI / 180), c: 0, d: 1, e: 0, f: 0 };
    result = multiplyMatrices(result, mat);
  }
  return result;
}
export function applyMatrix(mat: Matrix, x: number, y: number): { x: number; y: number } { return { x: mat.a * x + mat.c * y + mat.e, y: mat.b * x + mat.d * y + mat.f }; }
export function isIdentityMatrix(m: Matrix): boolean { return Math.abs(m.a - 1) < 1e-6 && Math.abs(m.b) < 1e-6 && Math.abs(m.c) < 1e-6 && Math.abs(m.d - 1) < 1e-6 && Math.abs(m.e) < 1e-6 && Math.abs(m.f) < 1e-6; }
export function isSimpleMatrix(mat: Matrix): boolean { return Math.abs(mat.b) < 0.0001 && Math.abs(mat.c) < 0.0001; }
export function getAccumulatedTransform(el: Element, rootEl: Element | null): Matrix {
  const matrices: Matrix[] = []; let node: Element | null = el;
  while (node && node !== rootEl) { const t = node.getAttribute('transform'); if (t) matrices.unshift(parseTransformMatrix(t)); node = node.parentElement; }
  if (!matrices.length) return IDENTITY_MATRIX;
  return matrices.reduce((acc, m) => multiplyMatrices(acc, m), IDENTITY_MATRIX);
}
