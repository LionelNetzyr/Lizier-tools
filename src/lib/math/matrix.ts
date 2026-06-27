import type { Matrix } from '../types';

export const IDENTITY_MATRIX: Matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

/**
 * Multiply two matrices (m1 * m2)
 * SVG transforms are applied right-to-left, so we multiply in order
 */
export function multiplyMatrices(m1: Matrix, m2: Matrix): Matrix {
  return {
    a: m1.a * m2.a + m1.c * m2.b,
    b: m1.b * m2.a + m1.d * m2.b,
    c: m1.a * m2.c + m1.c * m2.d,
    d: m1.b * m2.c + m1.d * m2.d,
    e: m1.a * m2.e + m1.c * m2.f + m1.e,
    f: m1.b * m2.e + m1.d * m2.f + m1.f
  };
}

/**
 * Parse SVG transform attribute into a Matrix
 * Supports: matrix, translate, scale, rotate, skewX, skewY
 */
export function parseTransformMatrix(transformStr: string | null): Matrix {
  if (!transformStr) return IDENTITY_MATRIX;
  
  const tokenRe = /(\w+)\s*\(([^)]*)\)/g;
  let result: Matrix = IDENTITY_MATRIX;
  let m: RegExpExecArray | null;
  
  while ((m = tokenRe.exec(transformStr)) !== null) {
    const fn = m[1];
    const args = m[2].trim().split(/[\s,]+/).map(Number);
    let mat: Matrix = IDENTITY_MATRIX;
    
    if (fn === 'matrix' && args.length >= 6) {
      mat = { a: args[0], b: args[1], c: args[2], d: args[3], e: args[4], f: args[5] };
    }
    else if (fn === 'translate') {
      mat = { a: 1, b: 0, c: 0, d: 1, e: args[0] || 0, f: args[1] || 0 };
    }
    else if (fn === 'scale') {
      const sx = args[0] || 1;
      const sy = args.length >= 2 ? args[1] : sx;
      mat = { a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 };
    }
    else if (fn === 'rotate') {
      const ang = (args[0] || 0) * Math.PI / 180;
      const cx = args[1] || 0;
      const cy = args[2] || 0;
      const cos = Math.cos(ang);
      const sin = Math.sin(ang);
      
      if (cx || cy) {
        // Rotate around point: translate to origin, rotate, translate back
        const t1: Matrix = { a: 1, b: 0, c: 0, d: 1, e: cx, f: cy };
        const r: Matrix = { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 };
        const t2: Matrix = { a: 1, b: 0, c: 0, d: 1, e: -cx, f: -cy };
        mat = multiplyMatrices(multiplyMatrices(t1, r), t2);
      } else {
        mat = { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 };
      }
    }
    else if (fn === 'skewX') {
      mat = { a: 1, b: 0, c: Math.tan((args[0] || 0) * Math.PI / 180), d: 1, e: 0, f: 0 };
    }
    else if (fn === 'skewY') {
      mat = { a: 1, b: Math.tan((args[0] || 0) * Math.PI / 180), c: 0, d: 1, e: 0, f: 0 };
    }
    
    // Apply transform: result = result * mat (transforms are applied in order)
    result = multiplyMatrices(result, mat);
  }
  
  return result;
}

/**
 * Apply matrix transformation to a point
 */
export function applyMatrix(mat: Matrix, x: number, y: number): { x: number; y: number } {
  return {
    x: mat.a * x + mat.c * y + mat.e,
    y: mat.b * x + mat.d * y + mat.f
  };
}

/**
 * Check if matrix is identity (or very close to it)
 */
export function isIdentityMatrix(m: Matrix): boolean {
  const epsilon = 1e-6;
  return (
    Math.abs(m.a - 1) < epsilon &&
    Math.abs(m.b) < epsilon &&
    Math.abs(m.c) < epsilon &&
    Math.abs(m.d - 1) < epsilon &&
    Math.abs(m.e) < epsilon &&
    Math.abs(m.f) < epsilon
  );
}

/**
 * Check if matrix is simple (only scale and translate, no rotation/skew)
 */
export function isSimpleMatrix(mat: Matrix): boolean {
  return Math.abs(mat.b) < 0.0001 && Math.abs(mat.c) < 0.0001;
}

/**
 * Get accumulated transform matrix from element up to root
 * Traverses parent chain and combines all transform attributes
 * 
 * @param el - Starting element
 * @param rootEl - Root element to stop at (usually SVG element)
 * @returns Combined transformation matrix
 */
export function getAccumulatedTransform(el: Element, rootEl: Element | null): Matrix {
  const matrices: Matrix[] = [];
  let node: Element | null = el;
  
  // Safety check to prevent infinite loops
  const MAX_DEPTH = 50;
  let depth = 0;
  
  // Collect all transforms from element up to (but not including) root
  while (node && node !== rootEl && depth < MAX_DEPTH) {
    // Check if we've reached SVG root
    const tagName = node.tagName?.toLowerCase();
    if (tagName === 'svg') {
      break;
    }
    
    const t = node.getAttribute('transform');
    if (t) {
      const mat = parseTransformMatrix(t);
      if (!isIdentityMatrix(mat)) {
        // Prepend transform (SVG transforms are applied right-to-left)
        // Parent transforms should be applied first, so they go on the left
        matrices.unshift(mat);
      }
    }
    
    node = node.parentElement;
    depth++;
  }
  
  if (matrices.length === 0) {
    return IDENTITY_MATRIX;
  }
  
  if (matrices.length === 1) {
    return matrices[0];
  }
  
  // Multiply all matrices in order: M1 * M2 * M3 * ...
  // This applies transforms from outermost to innermost
  return matrices.reduce((acc, m) => multiplyMatrices(acc, m), IDENTITY_MATRIX);
}
