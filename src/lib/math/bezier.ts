import type { Matrix } from '../types';
import { applyMatrix } from './matrix';
export function numParse(str: string): number[] { return (str.match(/-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g) || []).map(parseFloat).filter(n => !isNaN(n)); }
export function arcToCubics(x1: number, y1: number, rx: number, ry: number, xRot: number, largeArc: number, sweep: number, x2: number, y2: number): number[][] {
  if (x1 === x2 && y1 === y2) return []; if (rx === 0 || ry === 0) return [[x1, y1, x1, y1, x2, y2]];
  const phi = xRot * Math.PI / 180; const cosPhi = Math.cos(phi); const sinPhi = Math.sin(phi);
  const dx = (x1 - x2) / 2; const dy = (y1 - y2) / 2; const x1p = cosPhi * dx + sinPhi * dy; const y1p = -sinPhi * dx + cosPhi * dy;
  let rxSq = rx * rx; let rySq = ry * ry; const x1pSq = x1p * x1p; const y1pSq = y1p * y1p;
  let sq = (rxSq * rySq - rxSq * y1pSq - rySq * x1pSq) / (rxSq * y1pSq + rySq * x1pSq); if (sq < 0) sq = 0;
  const coef = (largeArc === sweep ? -1 : 1) * Math.sqrt(sq); const cxp = coef * rx * y1p / ry; const cyp = -coef * ry * x1p / rx;
  const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2; const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;
  const ang1 = Math.atan2((y1p - cyp) / ry, (x1p - cxp) / rx); let dAng = Math.atan2((-y1p - cyp) / ry, (-x1p - cxp) / rx) - ang1;
  if (!sweep && dAng > 0) dAng -= 2 * Math.PI; if (sweep && dAng < 0) dAng += 2 * Math.PI;
  const n = Math.ceil(Math.abs(dAng) / (Math.PI / 2)); const step = dAng / n; const KAPPA = (4 / 3) * Math.tan(step / 4);
  const curves: number[][] = []; let ang = ang1;
  for (let i = 0; i < n; i++) { const cosA = Math.cos(ang); const sinA = Math.sin(ang); const cosB = Math.cos(ang + step); const sinB = Math.sin(ang + step); const sx = cx + cosPhi * rx * cosA - sinPhi * ry * sinA; const sy = cy + sinPhi * rx * cosA + cosPhi * ry * sinA; const ex = cx + cosPhi * rx * cosB - sinPhi * ry * sinB; const ey = cy + sinPhi * rx * cosB + cosPhi * ry * sinB; const dxS = -cosPhi * rx * sinA - sinPhi * ry * cosA; const dyS = -sinPhi * rx * sinA + cosPhi * ry * cosA; const dxE = -cosPhi * rx * sinB - sinPhi * ry * cosB; const dyE = -sinPhi * rx * sinB + cosPhi * ry * cosB; curves.push([sx + KAPPA * dxS, sy + KAPPA * dyS, ex - KAPPA * dxE, ey - KAPPA * dyE, ex, ey]); ang += step; }
  return curves;
}
const F = (n: number): string => isFinite(n) ? n.toFixed(6) : '0.000000';
export function transformPath(d: string, cx: number, cy: number, globalScale: number, mat: Matrix | null): string {
  if (!d) return '';
  function pt(x: number, y: number): { x: number; y: number } { let px = x, py = y; if (mat) { px = mat.a * x + mat.c * y + mat.e; py = mat.b * x + mat.d * y + mat.f; } return { x: (px - cx) * globalScale, y: (py - cy) * globalScale }; }
  const segments: Array<{ cmd: string; nums: number[] }> = []; const re = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g; let tok: RegExpExecArray | null;
  while ((tok = re.exec(d)) !== null) { const raw = tok[2].trim().replace(/,/g, ' ').replace(/([^\seE])-/g, '$1 -').replace(/\s+/g, ' ').trim(); segments.push({ cmd: tok[1], nums: raw === '' ? [] : numParse(raw) }); }
  let lx = 0, ly = 0, mx = 0, my = 0, lastCP2x = 0, lastCP2y = 0, lastCmdWasCubic = false, lastQPx = 0, lastQPy = 0, lastCmdWasQuad = false, svgLx = 0, svgLy = 0; const out: string[] = [];
  function setCursor(svgX: number, svgY: number) { const p = pt(svgX, svgY); lx = p.x; ly = p.y; svgLx = svgX; svgLy = svgY; return p; }
  for (const { cmd, nums } of segments) {
    switch (cmd) {
      case 'M': for (let i = 0; i < nums.length; i += 2) { setCursor(nums[i], nums[i+1]); if (i === 0) { mx = lx; my = ly; out.push(`M ${F(lx)} ${F(ly)}`); } else out.push(`L ${F(lx)} ${F(ly)}`); } lastCmdWasCubic = lastCmdWasQuad = false; break;
      case 'm': for (let i = 0; i < nums.length; i += 2) { setCursor(svgLx + nums[i], svgLy + nums[i+1]); if (i === 0) { mx = lx; my = ly; out.push(`M ${F(lx)} ${F(ly)}`); } else out.push(`L ${F(lx)} ${F(ly)}`); } break;
      case 'L': for (let i = 0; i < nums.length; i += 2) { setCursor(nums[i], nums[i+1]); out.push(`L ${F(lx)} ${F(ly)}`); } break;
      case 'l': for (let i = 0; i < nums.length; i += 2) { setCursor(svgLx + nums[i], svgLy + nums[i+1]); out.push(`L ${F(lx)} ${F(ly)}`); } break;
      case 'H': for (let i = 0; i < nums.length; i++) { setCursor(nums[i], svgLy); out.push(`L ${F(lx)} ${F(ly)}`); } break;
      case 'h': for (let i = 0; i < nums.length; i++) { setCursor(svgLx + nums[i], svgLy); out.push(`L ${F(lx)} ${F(ly)}`); } break;
      case 'V': for (let i = 0; i < nums.length; i++) { setCursor(svgLx, nums[i]); out.push(`L ${F(lx)} ${F(ly)}`); } break;
      case 'v': for (let i = 0; i < nums.length; i++) { setCursor(svgLx, svgLy + nums[i]); out.push(`L ${F(lx)} ${F(ly)}`); } break;
      case 'C': for (let i = 0; i < nums.length; i += 6) { const p1 = pt(nums[i], nums[i+1]), p2 = pt(nums[i+2], nums[i+3]), p3 = pt(nums[i+4], nums[i+5]); out.push(`C ${F(p1.x)} ${F(p1.y)}, ${F(p2.x)} ${F(p2.y)}, ${F(p3.x)} ${F(p3.y)}`); lx = p3.x; ly = p3.y; svgLx = nums[i+4]; svgLy = nums[i+5]; lastCP2x = p2.x; lastCP2y = p2.y; lastCmdWasCubic = true; lastCmdWasQuad = false; } break;
      case 'c': for (let i = 0; i < nums.length; i += 6) { const p1 = pt(svgLx + nums[i], svgLy + nums[i+1]), p2 = pt(svgLx + nums[i+2], svgLy + nums[i+3]); setCursor(svgLx + nums[i+4], svgLy + nums[i+5]); out.push(`C ${F(p1.x)} ${F(p1.y)}, ${F(p2.x)} ${F(p2.y)}, ${F(lx)} ${F(ly)}`); lastCP2x = p2.x; lastCP2y = p2.y; lastCmdWasCubic = true; lastCmdWasQuad = false; } break;
      case 'S': for (let i = 0; i < nums.length; i += 4) { const cp1x = lastCmdWasCubic ? 2 * lx - lastCP2x : lx; const cp1y = lastCmdWasCubic ? 2 * ly - lastCP2y : ly; const p2 = pt(nums[i], nums[i+1]); setCursor(nums[i+2], nums[i+3]); out.push(`C ${F(cp1x)} ${F(cp1y)}, ${F(p2.x)} ${F(p2.y)}, ${F(lx)} ${F(ly)}`); lastCP2x = p2.x; lastCP2y = p2.y; lastCmdWasCubic = true; lastCmdWasQuad = false; } break;
      case 's': for (let i = 0; i < nums.length; i += 4) { const cp1x = lastCmdWasCubic ? 2 * lx - lastCP2x : lx; const cp1y = lastCmdWasCubic ? 2 * ly - lastCP2y : ly; const p2 = pt(svgLx + nums[i], svgLy + nums[i+1]); setCursor(svgLx + nums[i+2], svgLy + nums[i+3]); out.push(`C ${F(cp1x)} ${F(cp1y)}, ${F(p2.x)} ${F(p2.y)}, ${F(lx)} ${F(ly)}`); lastCP2x = p2.x; lastCP2y = p2.y; lastCmdWasCubic = true; lastCmdWasQuad = false; } break;
      case 'Q': for (let i = 0; i < nums.length; i += 4) { const qp = pt(nums[i], nums[i+1]); const stX = lx, stY = ly; setCursor(nums[i+2], nums[i+3]); const ep = { x: lx, y: ly }; const cp1x = stX + (2/3) * (qp.x - stX), cp1y = stY + (2/3) * (qp.y - stY); const cp2x = ep.x + (2/3) * (qp.x - ep.x), cp2y = ep.y + (2/3) * (qp.y - ep.y); out.push(`C ${F(cp1x)} ${F(cp1y)}, ${F(cp2x)} ${F(cp2y)}, ${F(ep.x)} ${F(ep.y)}`); lastQPx = qp.x; lastQPy = qp.y; lastCmdWasQuad = true; lastCmdWasCubic = false; } break;
      case 'q': for (let i = 0; i < nums.length; i += 4) { const qp = pt(svgLx + nums[i], svgLy + nums[i+1]); const stX = lx, stY = ly; setCursor(svgLx + nums[i+2], svgLy + nums[i+3]); const ep = { x: lx, y: ly }; const cp1x = stX + (2/3) * (qp.x - stX), cp1y = stY + (2/3) * (qp.y - stY); const cp2x = ep.x + (2/3) * (qp.x - ep.x), cp2y = ep.y + (2/3) * (qp.y - ep.y); out.push(`C ${F(cp1x)} ${F(cp1y)}, ${F(cp2x)} ${F(cp2y)}, ${F(ep.x)} ${F(ep.y)}`); lastQPx = qp.x; lastQPy = qp.y; lastCmdWasQuad = true; lastCmdWasCubic = false; } break;
      case 'T': for (let i = 0; i < nums.length; i += 2) { const qpx = lastCmdWasQuad ? 2 * lx - lastQPx : lx; const qpy = lastCmdWasQuad ? 2 * ly - lastQPy : ly; const stX = lx, stY = ly; setCursor(nums[i], nums[i+1]); const ep2 = { x: lx, y: ly }; const tcp1x = stX + (2/3) * (qpx - stX), tcp1y = stY + (2/3) * (qpy - stY); const tcp2x = ep2.x + (2/3) * (qpx - ep2.x), tcp2y = ep2.y + (2/3) * (qpy - ep2.y); out.push(`C ${F(tcp1x)} ${F(tcp1y)}, ${F(tcp2x)} ${F(tcp2y)}, ${F(lx)} ${F(ly)}`); lastQPx = qpx; lastQPy = qpy; lastCmdWasQuad = true; lastCmdWasCubic = false; } break;
      case 't': for (let i = 0; i < nums.length; i += 2) { const qpx = lastCmdWasQuad ? 2 * lx - lastQPx : lx; const qpy = lastCmdWasQuad ? 2 * ly - lastQPy : ly; const stX = lx, stY = ly; setCursor(svgLx + nums[i], svgLy + nums[i+1]); const ep2 = { x: lx, y: ly }; const tcp1x = stX + (2/3) * (qpx - stX), tcp1y = stY + (2/3) * (qpy - stY); const tcp2x = ep2.x + (2/3) * (qpx - ep2.x), tcp2y = ep2.y + (2/3) * (qpy - ep2.y); out.push(`C ${F(tcp1x)} ${F(tcp1y)}, ${F(tcp2x)} ${F(tcp2y)}, ${F(lx)} ${F(ly)}`); lastQPx = qpx; lastQPy = qpy; lastCmdWasQuad = true; lastCmdWasCubic = false; } break;
      case 'A': for (let i = 0; i < nums.length; i += 7) { const sx = lx, sy = ly; const trx = nums[i] * globalScale, tryy = nums[i+1] * globalScale; setCursor(nums[i+5], nums[i+6]); const ep = { x: lx, y: ly }; const curves = arcToCubics(sx, sy, trx, tryy, nums[i+2], nums[i+3], nums[i+4], ep.x, ep.y); if (curves.length) { for (const [cp1x, cp1y, cp2x, cp2y, ex, ey] of curves) out.push(`C ${F(cp1x)} ${F(cp1y)}, ${F(cp2x)} ${F(cp2y)}, ${F(ex)} ${F(ey)}`); } else out.push(`L ${F(ep.x)} ${F(ep.y)}`); } break;
      case 'a': for (let i = 0; i < nums.length; i += 7) { const sx = lx, sy = ly; const trx = nums[i] * globalScale, tryy = nums[i+1] * globalScale; setCursor(svgLx + nums[i+5], svgLy + nums[i+6]); const ep = { x: lx, y: ly }; const curves = arcToCubics(sx, sy, trx, tryy, nums[i+2], nums[i+3], nums[i+4], ep.x, ep.y); if (curves.length) { for (const [cp1x, cp1y, cp2x, cp2y, ex, ey] of curves) out.push(`C ${F(cp1x)} ${F(cp1y)}, ${F(cp2x)} ${F(cp2y)}, ${F(ex)} ${F(ey)}`); } else out.push(`L ${F(ep.x)} ${F(ep.y)}`); } break;
      case 'Z': case 'z': out.push('Z'); lx = mx; ly = my; break;
    }
  }
  return out.join('');
}
export function getPathBBox(amPath: string): { minX: number; minY: number; maxX: number; maxY: number; cx: number; cy: number; width: number; height: number } | null {
  const xs: number[] = [], ys: number[] = []; const re = /([MLCQml])([^MLCQZmlcqz]*)/g; let m: RegExpExecArray | null;
  while ((m = re.exec(amPath)) !== null) { const cmd = m[1].toUpperCase(); const nums = m[2].trim().replace(/,/g, ' ').split(/\s+/).map(parseFloat).filter(n => !isNaN(n)); if (cmd === 'C') { for (let i = 0; i + 5 < nums.length; i += 6) { xs.push(nums[i], nums[i+2], nums[i+4]); ys.push(nums[i+1], nums[i+3], nums[i+5]); } } else if (cmd === 'Q') { for (let i = 0; i + 3 < nums.length; i += 4) { xs.push(nums[i], nums[i+2]); ys.push(nums[i+1], nums[i+3]); } } else { for (let i = 0; i + 1 < nums.length; i += 2) { xs.push(nums[i]); ys.push(nums[i+1]); } } }
  if (!xs.length) return null; const minX = Math.min(...xs), maxX = Math.max(...xs); const minY = Math.min(...ys), maxY = Math.max(...ys); return { minX, minY, maxX, maxY, cx: (minX+maxX)/2, cy: (minY+maxY)/2, width: maxX-minX, height: maxY-minY };
}
export const getSvgPathBBox = getPathBBox;
export function shiftAmPath(d: string, dx: number, dy: number): string {
  if (!d || (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001)) return d;
  const out: string[] = []; const re = /([MLCZmlcz])([^MLCZmlcz]*)/g; let tok: RegExpExecArray | null;
  while ((tok = re.exec(d)) !== null) { const cmd = tok[1].toUpperCase(); const raw = tok[2].replace(/,/g, ' '); const nums = raw.trim() === '' ? [] : numParse(raw); if (cmd === 'Z') { out.push('Z'); } else if (cmd === 'M' || cmd === 'L') { let s = cmd; for (let i = 0; i + 1 < nums.length; i += 2) s += ` ${F(nums[i]+dx)} ${F(nums[i+1]+dy)}`; out.push(s); } else if (cmd === 'C') { const parts: string[] = []; for (let i = 0; i + 5 < nums.length; i += 6) parts.push(`${F(nums[i]+dx)} ${F(nums[i+1]+dy)}, ${F(nums[i+2]+dx)} ${F(nums[i+3]+dy)}, ${F(nums[i+4]+dx)} ${F(nums[i+5]+dy)}`); if (parts.length) out.push('C ' + parts.join(', ')); } }
  return out.join('');
}
