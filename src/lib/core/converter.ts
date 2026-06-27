import type { ParsedPath, ConvertSettings, ConvertResult, Matrix, ShapeOpts, ShapeItem, TreeNode } from '../types';
import { transformPath, getPathBBox, shiftAmPath } from '../math/bezier';
import { getSvgPathBBox } from '../styles/gradients';
import { getAccumulatedTransform, isIdentityMatrix, multiplyMatrices, isSimpleMatrix } from '../math/matrix';
import { detectShape } from '../am-engine/primitives';
import { buildShapeXml } from '../am-engine/xml-builder';
import { hexToAM, parseStyleObj, parseSvgStyles, getFillColorV7 } from '../styles/colors';
import { parseGradientDefs, buildGradientStartEndLocal } from '../styles/gradients';
import { getStrokeInfo } from '../styles/strokes';
import { shapeToD } from '../parsers/svg-shapes';
import { sanitizeLabel } from '../parsers/svg-parser';

function buildGroupTree(items: ShapeItem[]): TreeNode { const root: TreeNode = { items: [], children: new Map() }; for (const item of items) { const path = item.groupPath || []; let node = root; for (const name of path) { if (!node.children.has(name)) node.children.set(name, { items: [], children: new Map() }); node = node.children.get(name)!; } node.items.push(item); } return root; }
function getGroupBBox(node: TreeNode, tcx: number, tcy: number) { const xs: number[] = [], ys: number[] = []; function collect(n: TreeNode) { for (const item of n.items) { const cx = item.objTcx !== undefined ? item.objTcx : tcx; const cy = item.objTcy !== undefined ? item.objTcy : tcy; const pb = item.amPath ? getPathBBox(item.amPath) : null; if (pb && isFinite(pb.minX)) { xs.push(cx + pb.minX, cx + pb.maxX); ys.push(cy + pb.minY, cy + pb.maxY); } else { xs.push(cx); ys.push(cy); } } for (const child of n.children.values()) collect(child); } collect(node); if (!xs.length) return null; const minX = Math.min(...xs), maxX = Math.max(...xs); const minY = Math.min(...ys), maxY = Math.max(...ys); return { minX, maxX, minY, maxY, cx: (minX+maxX)/2, cy: (minY+maxY)/2 }; }
function renderGroupTreeXml(node: TreeNode, makeShape: (item: ShapeItem) => string, idRef: { val: number }, innerSceneAttrsBase: string, startTime: number, endTime: number, tcx: number, tcy: number, targetW: number, targetH: number, indent: number, parentELX?: number, parentELY?: number): string {
  if (parentELX === undefined) { parentELX = tcx; parentELY = tcy; } const parentICX = targetW / 2; const parentICY = targetH / 2; const pad = '  '.repeat(indent); let xml = '';
  for (const item of node.items) { const canvasX = item.objTcx !== undefined ? item.objTcx : tcx; const canvasY = item.objTcy !== undefined ? item.objTcy : tcy; const adjX = canvasX - parentELX! + parentICX; const adjY = canvasY - parentELY! + parentICY; const adj: ShapeItem = { ...item, objTcx: adjX, objTcy: adjY, shapeOpts: { ...item.shapeOpts, tcx: adjX, tcy: adjY } }; xml += makeShape(adj).replace(/^/gm, pad).trimEnd() + '\n'; }
  for (const [groupName, childNode] of node.children) { const groupId = idRef.val++; const safeLabel = sanitizeLabel(groupName); const bbox = getGroupBBox(childNode, tcx, tcy); const childELX_canvas = tcx; const childELY_canvas = bbox ? bbox.cy : tcy; const embedInParentX = childELX_canvas - parentELX! + parentICX; const embedInParentY = childELY_canvas - parentELY! + parentICY; const pivotX = bbox ? (bbox.cx - childELX_canvas) : 0; const innerXml = renderGroupTreeXml(childNode, makeShape, idRef, innerSceneAttrsBase, startTime, endTime, tcx, tcy, targetW, targetH, indent + 1, childELX_canvas, childELY_canvas); const pivotLine = Math.abs(pivotX) > 0.001 ? `${pad}  <pivot value="${pivotX.toFixed(6)},0.000000" />\n` : ''; xml += `${pad}<embedScene id="${groupId}" label="${safeLabel}" startTime="${startTime}" endTime="${endTime}" fillType="intrinsic" mediaFillMode="fill">\n`; xml += `${pad}  <transform>\n${pad}    <location value="${embedInParentX.toFixed(6)},${embedInParentY.toFixed(6)},0.000000" />\n${pivotLine}${pad}  </transform>\n`; xml += `${pad}  <fillColor value="#ff000000" />\n`; xml += `${pad}  <scene ${innerSceneAttrsBase}>\n${innerXml}${pad}  </scene>\n`; xml += `${pad}</embedScene>\n`; }
  return xml;
}

export function processAM(parsedPaths: ParsedPath[], selectedIndices: boolean[], settings: ConvertSettings, svgText: string): ConvertResult {
  if (!parsedPaths.length || !svgText) return { xml: '', statusText: 'No SVG loaded.', filename: '' };
  const { targetW, targetH, fps, startTime, endTime, fillType, gradStart, gradEnd, useStroke, strokeSize, strokeJoin, strokeColor, useStrokeColor, groupMode, useShapePrim, svgFileName, projectName } = settings;
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml'); const svgEl = doc.querySelector('svg'); if (!svgEl) return { xml: '', statusText: 'Invalid SVG.', filename: '' };
  const vbParts = (svgEl.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(parseFloat); const vbX = vbParts[0] || 0, vbY = vbParts[1] || 0; const vbW = vbParts[2] || parseFloat(svgEl.getAttribute('width') || '1080'); const vbH = vbParts[3] || parseFloat(svgEl.getAttribute('height') || '1080'); const cx = vbX + vbW / 2, cy = vbY + vbH / 2; const globalScale = Math.min(targetW / vbW, targetH / vbH); const tcx = targetW / 2, tcy = targetH / 2;
  const classMap = parseSvgStyles(svgEl); const gradMap = parseGradientDefs(svgEl);
  const clipperMap: Record<string, { d: string; mat: Matrix | null }> = {};
  svgEl.querySelectorAll('clipPath').forEach(cp => { 
    const id = cp.getAttribute('id'); 
    if (!id) return; 
    const child = Array.from(cp.childNodes).find((n): n is Element => !!(n as Element).tagName) as Element | undefined; 
    if (!child) return; 
    const d = child.tagName.toLowerCase() === 'path' ? child.getAttribute('d') : shapeToD(child); 
    if (d) { 
      const cpTransform = cp.getAttribute('transform');
      const cpMat = cpTransform ? getAccumulatedTransform(cp, svgEl) : null; 
      clipperMap[id] = { d, mat: cpMat && !isIdentityMatrix(cpMat) ? cpMat : null }; 
    } 
  });
  const docPaths = Array.from(svgEl.querySelectorAll('path,rect,circle,ellipse,polygon,polyline,line'));
  const idRef = { val: 2000000000 }; let totalShapes = 0; const selectedItems: ShapeItem[] = [];
  parsedPaths.forEach((p, i) => {
    if (!selectedIndices[i]) return; const el = docPaths[p.index]; if (!el) return; const d = p.d; if (!d) return;
    const mat = getAccumulatedTransform(el, svgEl); const hasMat = !isIdentityMatrix(mat); const hasComplexGroupMat = hasMat && (Math.abs(mat.b) > 0.0001 || Math.abs(mat.c) > 0.0001); const primitiveGroupMat = (hasMat && !hasComplexGroupMat) ? mat : null;
    const color = getFillColorV7(el, classMap, gradMap);
    const svgStroke = getStrokeInfo(el, classMap);
    let fillColor = color ? color.amColor : 'ff000000';


    let amPath = transformPath(d, cx, cy, globalScale, hasMat ? mat : null);

    // 🔥 SMART AUTO-CLOSE
    const hasFill = color && !svgStroke.isStrokeOnly;
    const hasZ = /Z/i.test(amPath);
    if (hasFill && !hasZ) amPath += ' Z';

    let objTcx = tcx, objTcy = tcy; const amBbox = getPathBBox(amPath);
    if (amBbox && isFinite(amBbox.cx) && (Math.abs(amBbox.cx) > 0.01 || Math.abs(amBbox.cy) > 0.01)) { objTcx = tcx + amBbox.cx; objTcy = tcy + amBbox.cy; amPath = shiftAmPath(amPath, -amBbox.cx, -amBbox.cy); }
    const shapeOpts: ShapeOpts = { fillType, blending: '', gradStart, gradEnd, gradType: fillType.startsWith('gradient') ? fillType.replace('gradient-', '') : 'linear', useStroke, strokeSize, strokeJoin, strokeColor, useStrokeColor, startTime, endTime, tcx, tcy, globalScale, vbCx: cx, vbCy: cy, canvasW: targetW, canvasH: targetH, fps, layerOpacity: p.layerOpacity };
    if (color?.isGradient && fillType === 'color') { shapeOpts.fillType = 'gradient-' + color.gradType; shapeOpts._gradStartAM = color.gradStartAM; shapeOpts._gradEndAM = color.gradEndAM; shapeOpts._isSvgGradient = true; if (color.gradInfo) { let tGrad = color.gradInfo; if (hasMat && tGrad.gradUnits === 'userSpaceOnUse') { const applyAccMat = (m: Matrix, pt2: { x: number; y: number }) => ({ x: m.a*pt2.x + m.c*pt2.y + m.e, y: m.b*pt2.x + m.d*pt2.y + m.f }); tGrad = { ...tGrad, pStartSvg: applyAccMat(mat, tGrad.pStartSvg), pEndSvg: applyAccMat(mat, tGrad.pEndSvg) }; } const svgBbox = getSvgPathBBox(d); if (hasMat && svgBbox) { const tpC = (m: Matrix, pt2: { x: number; y: number }) => ({ x: m.a*pt2.x + m.c*pt2.y + m.e, y: m.b*pt2.x + m.d*pt2.y + m.f }); const corners = [ tpC(mat, { x: svgBbox.minX, y: svgBbox.minY }), tpC(mat, { x: svgBbox.maxX, y: svgBbox.minY }), tpC(mat, { x: svgBbox.maxX, y: svgBbox.maxY }), tpC(mat, { x: svgBbox.minX, y: svgBbox.maxY }) ]; const xs2 = corners.map(pt3 => pt3.x); const ys2 = corners.map(pt3 => pt3.y); const minX = Math.min(...xs2); const maxX = Math.max(...xs2); const minY = Math.min(...ys2); const maxY = Math.max(...ys2); shapeOpts._gradStartEnd = buildGradientStartEndLocal(tGrad, { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }); } else { shapeOpts._gradStartEnd = buildGradientStartEndLocal(tGrad, svgBbox); } } }
    const elSty = parseStyleObj(el.getAttribute('style')); let mixBlend = elSty['mix-blend-mode'] || el.getAttribute('mix-blend-mode') || ''; const blendMap: Record<string, string> = { 'multiply':'multiply','screen':'screen','overlay':'overlay','darken':'darken','lighten':'lighten','color-dodge':'color-dodge','color-burn':'color-burn','hard-light':'hard-light','soft-light':'soft-light','difference':'difference','exclusion':'exclusion','hue':'hue','saturation':'saturation','color':'color','luminosity':'luminosity','add':'add' }; if (mixBlend && blendMap[mixBlend.trim().toLowerCase()]) shapeOpts.blending = blendMap[mixBlend.trim().toLowerCase()];
    if (fillType === 'color') { if (!color && svgStroke.isStrokeOnly) { shapeOpts.fillType = 'none'; shapeOpts.useStroke = true; shapeOpts.strokeSize = Math.max(1, (svgStroke.width || 1) * globalScale); shapeOpts.strokeColor = svgStroke.raw || '#000000'; shapeOpts.useStrokeColor = true; if (svgStroke.linejoin) shapeOpts.strokeJoin = svgStroke.linejoin; if (svgStroke.linecap) shapeOpts.strokeCap = svgStroke.linecap; } else if (color && svgStroke.raw) { shapeOpts.useStroke = true; shapeOpts.strokeSize = Math.max(1, (svgStroke.width || 1) * globalScale); shapeOpts.strokeColor = svgStroke.raw; shapeOpts.useStrokeColor = true; if (svgStroke.linejoin) shapeOpts.strokeJoin = svgStroke.linejoin; if (svgStroke.linecap) shapeOpts.strokeCap = svgStroke.linecap; } }
    selectedItems.push({ ...p, amPath, fillColor, shapeOpts, objTcx, objTcy, clipGroupMat: p.clipGroupMat, primitiveGroupMat, hasComplexGroupMat });
  });
  const makeShape = (item: ShapeItem): string => {
    totalShapes++; const detected = (useShapePrim && !item.hasComplexGroupMat) ? detectShape(item.d, globalScale) : null; const opts: ShapeOpts = { ...item.shapeOpts }; let adjustedDetected = detected;
    if (detected && item.primitiveGroupMat) { const pgm = item.primitiveGroupMat; const halfW = (detected.w / globalScale) / 2; const halfH = (detected.h / globalScale) / 2; let newProps: string[] = []; if (detected.type === '.roundrect') { const cr = (detected.props.find(p => p.includes('cornerRadius'))?.match(/value="([^"]+)"/)?.[1] || '0'); newProps = [ `<property name="size" type="vec2" value="${halfW.toFixed(6)},${halfH.toFixed(6)}" />`, `<property name="cornerRadius" type="float" value="${(parseFloat(cr) / globalScale).toFixed(6)}" />` ]; } else if (['.rect', '.circle', '.ellipse'].includes(detected.type)) { newProps = [`<property name="size" type="vec2" value="${halfW.toFixed(6)},${halfH.toFixed(6)}" />`]; } else { newProps = detected.props; } adjustedDetected = { ...detected, props: newProps }; opts.primitiveScaleX = pgm.a; opts.primitiveScaleY = pgm.d; }
    if (!adjustedDetected) { opts.tcx = item.objTcx !== undefined ? item.objTcx : tcx; opts.tcy = item.objTcy !== undefined ? item.objTcy : tcy; }
    if (item.clipPathRef && clipperMap[item.clipPathRef]) { const clipEntry = clipperMap[item.clipPathRef]; let clipMat = item.clipGroupMat || (item.hasMatrix ? item.mat : null); if (clipEntry.mat && clipMat) clipMat = multiplyMatrices(clipMat, clipEntry.mat); else if (clipEntry.mat) clipMat = clipEntry.mat; const clipAmPath = transformPath(clipEntry.d, cx, cy, globalScale, clipMat); const clipBbox = getPathBBox(clipAmPath); const finalClipPath = (clipBbox && isFinite(clipBbox.cx)) ? shiftAmPath(clipAmPath, -clipBbox.cx, -clipBbox.cy) : clipAmPath; const maskOpts: ShapeOpts = { ...opts, fillType: 'color', useStroke: false, blending: 'mask' }; const targetXml = buildShapeXml({ id: idRef.val++, label: item.label, amPath: item.amPath, fillColor: item.fillColor, opts, detected: adjustedDetected }); const maskXml = buildShapeXml({ id: idRef.val++, label: item.label + '_mask', amPath: finalClipPath, fillColor: 'ffffffff', opts: maskOpts, detected: null }); const innerSceneAttrs = `width="${targetW}" height="${targetH}" exportWidth="${targetW}" exportHeight="${targetH}" precompose="dynamicResolution" bgcolor="#00000000" totalTime="${endTime}" fps="${fps}" modifiedTime="0" amver="1028425" ffver="106" am="com.alightcreative.motion/5.0.273.1028425" amplatform="android" retime="off" retimeAdaptFPS="false"`; let res = `<embedScene id="${idRef.val++}" label="${item.label}_clipped" startTime="${startTime}" endTime="${endTime}" fillType="intrinsic" mediaFillMode="fill">\n`; res += `  <transform><location value="${tcx.toFixed(6)},${tcy.toFixed(6)},0.000000" /></transform>\n`; res += `  <fillColor value="#ff000000" />\n  <scene ${innerSceneAttrs}>\n`; res += targetXml + maskXml; res += `  </scene>\n</embedScene>\n`; return res; }
    return buildShapeXml({ id: idRef.val++, label: item.label, amPath: item.amPath, fillColor: item.fillColor, opts, detected: adjustedDetected });
  };
  let shapesXml = ''; const innerSceneAttrs = `width="${targetW}" height="${targetH}" exportWidth="${targetW}" exportHeight="${targetH}" precompose="dynamicResolution" bgcolor="#00000000" totalTime="${endTime}" fps="${fps}" modifiedTime="0" amver="1028425" ffver="106" am="com.alightcreative.motion/5.0.273.1028425" amplatform="android" retime="off" retimeAdaptFPS="false"`;
  if (groupMode === 'embedScene') { const tree = buildGroupTree(selectedItems); shapesXml = renderGroupTreeXml(tree, makeShape, idRef, innerSceneAttrs, startTime, endTime, tcx, tcy, targetW, targetH, 1); } else { for (const item of selectedItems) shapesXml += makeShape(item); }
  const sceneAttr = `title="${projectName || 'SVG_preset'}" width="${targetW}" height="${targetH}" exportWidth="${targetW}" exportHeight="${targetH}" precompose="dynamicResolution" bgcolor="#00000000" totalTime="${endTime}" fps="${fps}" modifiedTime="0" amver="1028425" ffver="106" am="com.alightcreative.motion/5.0.273.1028425" amplatform="android"`;
  const now = new Date(); const pad = (n: number) => String(n).padStart(2, '0'); const tagmark = `<!--\nCreated by Lizier Tools\nExported: ${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}\n-->\n`;
  const xml = `<?xml version='1.0' encoding='UTF-8' ?>\n${tagmark}<scene ${sceneAttr} retime="freeze" retimeAdaptFPS="false">\n${shapesXml}</scene>`;
  return { xml, statusText: `✅ V25 Modular · ${totalShapes} shapes converted.`, filename: `${(projectName || svgFileName || 'Export').replace(/[^a-zA-Z0-9_-]/g, '_')}.xml` };
}
