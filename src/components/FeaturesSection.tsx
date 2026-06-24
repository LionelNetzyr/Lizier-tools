import { useRef, useState, useEffect } from 'react';

const FEATURES = [
  { icon: '🎨', title: 'Full CSS Color Support', desc: 'hex, rgb/rgba, hsl/hsla, named colors, fill-opacity, CSS class from <style> block.', tag: 'CORE', tagClass: 'tcore' },
  { icon: '📦', title: 'Nested Groups', desc: '<g> inside <g> converted to nested EmbedScene in AM — unlimited depth.', tag: 'v20 NEW', tagClass: 'tnested' },
  { icon: '🔷', title: 'Shape Detection', desc: 'Rectangle, circle, rounded rect, triangle, polygon → native AM primitives.', tag: 'v10+', tagClass: 'tnew' },
  { icon: '🎯', title: 'Auto Center Artwork', desc: 'SVG not centered in viewBox is automatically shifted to center of AM canvas.', tag: 'v12+', tagClass: 'tnew' },
  { icon: '⚙️', title: 'Matrix Transform', desc: 'Matrix from all parent <g> elements accumulated automatically — great for Illustrator SVG.', tag: 'CORE', tagClass: 'tcore' },
  { icon: '🔄', title: 'Arc to Bezier', desc: 'Arc command A converted via SVG spec §B.2.3 — circles do not distort.', tag: 'v10+', tagClass: 'tnew' },
  { icon: '✏️', title: 'Custom Stroke', desc: 'Stroke size, join, color, plus linear/radial/sweep gradient.', tag: 'v5+', tagClass: 'tnew' },
  { icon: '👁', title: 'Preview Pan & Zoom', desc: 'Drag to pan, scroll/pinch to zoom, auto-fit. Nested layer list with collapse toggle.', tag: 'CORE', tagClass: 'tcore' },
];

const CARD_W = 142;
const GAP = 10;
const STEP = CARD_W + GAP;

export default function FeaturesSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const n = FEATURES.length;
  const dragRef = useRef({ active: false, startX: 0, startIdx: 0 });
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function moveTo(idx: number) {
    const clampedIdx = ((idx % n) + n) % n;
    setSlideIdx(clampedIdx);
    if (trackRef.current) {
      const offset = -(clampedIdx * STEP);
      trackRef.current.style.transition = 'transform .45s cubic-bezier(.4,0,.2,1)';
      trackRef.current.style.transform = `translateX(${offset}px)`;
    }
  }

  function startAuto() {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => setSlideIdx(prev => {
      const next = (prev + 1) % n;
      if (trackRef.current) {
        trackRef.current.style.transition = 'transform .45s cubic-bezier(.4,0,.2,1)';
        trackRef.current.style.transform = `translateX(${-(next * STEP)}px)`;
      }
      return next;
    }), 2000);
  }

  useEffect(() => { startAuto(); return () => { if (autoRef.current) clearInterval(autoRef.current); }; }, []);

  function onMouseDown(e: React.MouseEvent) {
    dragRef.current = { active: true, startX: e.clientX, startIdx: slideIdx };
    if (autoRef.current) clearInterval(autoRef.current);
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragRef.current.active) return;
    const dx = dragRef.current.startX - e.clientX;
    const deltaIdx = Math.round(dx / STEP);
    const target = dragRef.current.startIdx + deltaIdx;
    if (trackRef.current) {
      trackRef.current.style.transition = 'none';
      trackRef.current.style.transform = `translateX(${-(target * STEP)}px)`;
    }
  }
  function onMouseUp(e: React.MouseEvent) {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    const dx = dragRef.current.startX - e.clientX;
    const deltaIdx = Math.round(dx / STEP);
    moveTo(dragRef.current.startIdx + deltaIdx);
    startAuto();
  }

  return (
    <div className="wrap">
      <div id="fitur">
        <div className="sdiv" />
        <div className="gsec">
          <span className="sec-label">What It Can Do</span>
          <div className="sec-title">Available Features</div>
          <div className="fs-wrap" id="featureSlider">
            <div
              className="fs-track"
              ref={trackRef}
              style={{ transform: 'translateX(0px)' }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              {FEATURES.map((f, i) => (
                <div
                  key={i}
                  className={`fs-card${openIdx === i ? ' fs-open' : ''}`}
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                >
                  <div className="fs-icon"><span style={{ fontSize: 18 }}>{f.icon}</span></div>
                  <div className="fs-title">{f.title}</div>
                  <div className="fs-desc">{f.desc}</div>
                  <span className={`ftag ${f.tagClass}`}>{f.tag}</span>
                </div>
              ))}
            </div>
            <div className="fs-dots">
              {FEATURES.map((_, i) => (
                <button key={i} className={`fs-dot${slideIdx === i ? ' active' : ''}`} onClick={() => { moveTo(i); startAuto(); }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
