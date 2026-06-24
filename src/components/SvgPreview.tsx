import { useRef, useState, useEffect, useCallback } from 'react';

interface SvgPreviewProps {
  svgHtml: string;
  svgDims: { vbW: number; vbH: number } | null;
}

interface PvState { scale: number; tx: number; ty: number; }

export default function SvgPreview({ svgHtml, svgDims }: SvgPreviewProps) {
  const areaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [pv, setPv] = useState<PvState>({ scale: 1, tx: 0, ty: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const pinchDist = useRef(0);

  const applyTransform = useCallback((state: PvState) => {
    const vp = viewportRef.current;
    if (vp) vp.style.transform = `translate(${state.tx}px,${state.ty}px) scale(${state.scale})`;
  }, []);

  useEffect(() => { applyTransform(pv); }, [pv, applyTransform]);

  useEffect(() => {
    if (svgHtml) setPv({ scale: 1, tx: 0, ty: 0 });
  }, [svgHtml]);

  function pvZoom(delta: number) {
    setPv(prev => {
      const next = Math.max(0.1, Math.min(8, prev.scale + delta));
      return { ...prev, scale: next };
    });
  }

  function pvReset() { setPv({ scale: 1, tx: 0, ty: 0 }); }

  function zoomLabel(s: number) {
    if (Math.abs(s - 1) < 0.05) return 'fit';
    return Math.round(s * 100) + '%';
  }

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    areaRef.current?.classList.add('dragging');
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setPv(prev => ({ ...prev, tx: prev.tx + dx, ty: prev.ty + dy }));
  };
  const onMouseUp = () => { dragging.current = false; areaRef.current?.classList.remove('dragging'); };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setPv(prev => ({ ...prev, scale: Math.max(0.1, Math.min(8, prev.scale + delta)) }));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      dragging.current = true;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchDist.current = Math.hypot(dx, dy);
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && dragging.current) {
      const dx = e.touches[0].clientX - lastPos.current.x;
      const dy = e.touches[0].clientY - lastPos.current.y;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setPv(prev => ({ ...prev, tx: prev.tx + dx, ty: prev.ty + dy }));
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / pinchDist.current;
      pinchDist.current = dist;
      setPv(prev => ({ ...prev, scale: Math.max(0.1, Math.min(8, prev.scale * ratio)) }));
    }
  };
  const onTouchEnd = () => { dragging.current = false; };

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title"><span className="card-title-dot" />SVG Preview</div>
        {svgDims && (
          <span style={{ fontSize: 10, color: 'var(--muted-2)', fontWeight: 600, fontFamily: 'var(--font-code)' }}>
            {Math.round(svgDims.vbW)} × {Math.round(svgDims.vbH)}
          </span>
        )}
      </div>
      <div className="card-body" style={{ padding: 12 }}>
        <div
          id="previewArea"
          ref={areaRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {!svgHtml && (
            <div id="previewPlaceholder">
              <div className="icon">🖼</div>
              <div>Preview will appear here</div>
            </div>
          )}
          <div
            id="svgViewport"
            ref={viewportRef}
            dangerouslySetInnerHTML={svgHtml ? { __html: svgHtml } : undefined}
          />
          {svgHtml && (
            <div className="pv-bar visible">
              <button onClick={() => pvZoom(0.2)}>+</button>
              <span className="pv-zoom-val">{zoomLabel(pv.scale)}</span>
              <button onClick={() => pvZoom(-0.2)}>−</button>
              <button onClick={pvReset} title="Fit">⊡</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
