import type { GradientInfo, Matrix } from '../types';
import { parseCssColor, parseStyleObj } from './colors';
import { applyMatrix, parseTransformMatrix, isIdentityMatrix } from '../math/matrix';

const F = (n: number): string => n.toFixed(6);

export function parseGradientDefs(svgEl: Element): Record<string, GradientInfo> {
  const gradMap: Record<string, GradientInfo> = {};
  const h2 = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  
  svgEl.querySelectorAll('linearGradient, radialGradient').forEach(grad => {
    const id = grad.getAttribute('id');
    if (!id) return;
    
    const isLinear = grad.tagName.toLowerCase().includes('linear');
    const type = isLinear ? 'linear' : 'radial';
    const stops: GradientInfo['stops'] = [];
    
    grad.querySelectorAll('stop').forEach(stop => {
      const offset = parseFloat(stop.getAttribute('offset') || '0');
      const sty = parseStyleObj(stop.getAttribute('style'));
      const colorRaw = sty['stop-color'] || stop.getAttribute('stop-color') || '#000000';
      const opacityRaw = sty['stop-opacity'] || stop.getAttribute('stop-opacity');
      const c = parseCssColor(colorRaw);
      
      if (c) {
        if (opacityRaw != null) c.a = Math.round(parseFloat(opacityRaw) * 255);
        stops.push({
          offset,
          amColor: `${h2(c.a)}${h2(c.r)}${h2(c.g)}${h2(c.b)}`,
          cssHex: `#${h2(c.r)}${h2(c.g)}${h2(c.b)}`,
        });
      }
    });
    
    if (!stops.length) return;
    
    const x1 = parseFloat(grad.getAttribute('x1') || (isLinear ? '0' : '0.5'));
    const y1 = parseFloat(grad.getAttribute('y1') || (isLinear ? '0' : '0.5'));
    const x2 = parseFloat(grad.getAttribute('x2') || (isLinear ? '1' : '1.5'));
    const y2 = parseFloat(grad.getAttribute('y2') || (isLinear ? '0' : '0.5'));
    const gradUnits = grad.getAttribute('gradientUnits') || 'objectBoundingBox';
    
    let gMat: Matrix | null = null;
    const gTrans = grad.getAttribute('gradientTransform');
    if (gTrans) {
      gMat = parseTransformMatrix(gTrans);
      if (isIdentityMatrix(gMat)) gMat = null;
    }
    
    const pStart = gMat ? applyMatrix(gMat, x1, y1) : { x: x1, y: y1 };
    const pEnd = gMat ? applyMatrix(gMat, x2, y2) : { x: x2, y: y2 };
    
    gradMap[id] = { type, stops, gradUnits, pStartSvg: pStart, pEndSvg: pEnd };
  });
  
  return gradMap;
}

export function getSvgPathBBox(d: string): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } | null {
  if (!d) return null;
  const xs: number[] = [];
  const ys: number[] = [];
  let cx = 0, cy = 0, sx = 0, sy = 0;

  const re = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(d)) !== null) {
    const cmd = m[1];
    const nums = (m[2].trim().replace(/,/g, ' ').match(/-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g) || []).map(Number);
    
    switch (cmd) {
      case 'M':
        for (let i = 0; i + 1 < nums.length; i += 2) { cx = nums[i]; cy = nums[i+1]; if (i === 0) { sx = cx; sy = cy; } xs.push(cx); ys.push(cy); }
        break;
      case 'm':
        for (let i = 0; i + 1 < nums.length; i += 2) { cx += nums[i]; cy += nums[i+1]; if (i === 0) { sx = cx; sy = cy; } xs.push(cx); ys.push(cy); }
        break;
      case 'L':
        for (let i = 0; i + 1 < nums.length; i += 2) { cx = nums[i]; cy = nums[i+1]; xs.push(cx); ys.push(cy); }
        break;
      case 'l':
        for (let i = 0; i + 1 < nums.length; i += 2) { cx += nums[i]; cy += nums[i+1]; xs.push(cx); ys.push(cy); }
        break;
      case 'H':
        for (const n of nums) { cx = n; xs.push(cx); }
        break;
      case 'h':
        for (const n of nums) { cx += n; xs.push(cx); }
        break;
      case 'V':
        for (const n of nums) { cy = n; ys.push(cy); }
        break;
      case 'v':
        for (const n of nums) { cy += n; ys.push(cy); }
        break;
      case 'C':
        for (let i = 0; i + 5 < nums.length; i += 6) { xs.push(nums[i], nums[i+2], nums[i+4]); ys.push(nums[i+1], nums[i+3], nums[i+5]); cx = nums[i+4]; cy = nums[i+5]; }
        break;
      case 'c':
        for (let i = 0; i + 5 < nums.length; i += 6) { xs.push(cx+nums[i], cx+nums[i+2], cx+nums[i+4]); ys.push(cy+nums[i+1], cy+nums[i+3], cy+nums[i+5]); cx += nums[i+4]; cy += nums[i+5]; }
        break;
      case 'S': case 'Q':
        for (let i = 0; i + 3 < nums.length; i += 4) { xs.push(nums[i], nums[i+2]); ys.push(nums[i+1], nums[i+3]); cx = nums[i+2]; cy = nums[i+3]; }
        break;
      case 's': case 'q':
        for (let i = 0; i + 3 < nums.length; i += 4) { xs.push(cx+nums[i], cx+nums[i+2]); ys.push(cy+nums[i+1], cy+nums[i+3]); cx += nums[i+2]; cy += nums[i+3]; }
        break;
      case 'T':
        for (let i = 0; i + 1 < nums.length; i += 2) { cx = nums[i]; cy = nums[i+1]; xs.push(cx); ys.push(cy); }
        break;
      case 't':
        for (let i = 0; i + 1 < nums.length; i += 2) { cx += nums[i]; cy += nums[i+1]; xs.push(cx); ys.push(cy); }
        break;
      case 'A':
        for (let i = 0; i + 6 < nums.length; i += 7) { cx = nums[i+5]; cy = nums[i+6]; xs.push(cx); ys.push(cy); }
        break;
      case 'a':
        for (let i = 0; i + 6 < nums.length; i += 7) { cx += nums[i+5]; cy += nums[i+6]; xs.push(cx); ys.push(cy); }
        break;
      case 'Z': case 'z':
        cx = sx; cy = sy;
        break;
    }
  }
  if (!xs.length || !ys.length) return null;
  const minX = Math.min(...xs); const maxX = Math.max(...xs);
  const minY = Math.min(...ys); const maxY = Math.max(...ys);
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

export function buildGradientStartEndLocal(
  gradInfo: GradientInfo,
  bbox: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } | null
): { start: string; end: string } {
  if (!gradInfo || !bbox || bbox.width < 0.001 || bbox.height < 0.001) {
    return { start: '0.000000,0.000000', end: '1.000000,1.000000' };
  }
  let sx: number, sy: number, ex: number, ey: number;
  if (gradInfo.gradUnits === 'userSpaceOnUse') {
    sx = (gradInfo.pStartSvg.x - bbox.minX) / bbox.width;
    sy = (gradInfo.pStartSvg.y - bbox.minY) / bbox.height;
    ex = (gradInfo.pEndSvg.x - bbox.minX) / bbox.width;
    ey = (gradInfo.pEndSvg.y - bbox.minY) / bbox.height;
  } else {
    sx = gradInfo.pStartSvg.x; sy = gradInfo.pStartSvg.y;
    ex = gradInfo.pEndSvg.x; ey = gradInfo.pEndSvg.y;
  }
  return { start: `${F(sx)},${F(sy)}`, end: `${F(ex)},${F(ey)}` };
}
