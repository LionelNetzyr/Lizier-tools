interface GuidePanelProps {
  open: boolean;
  onClose: () => void;
}

export default function GuidePanel({ open, onClose }: GuidePanelProps) {
  return (
    <div className={`guide-panel${open ? ' open' : ''}`}>
      <div className="guide-panel-inner">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>📖 How to Use</div>
          <button onClick={onClose} style={{ background: 'none', border: '1.5px solid var(--border)', color: 'var(--muted)', borderRadius: 100, padding: '5px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font)' }}>✕ Close</button>
        </div>
        <div className="steps" style={{ marginTop: 0 }}>
          <div className="step">
            <div className="snum s1">1</div>
            <div className="stepcon">
              <div className="stitle">Prepare Your SVG File</div>
              <div className="sbody"><strong>Illustrator</strong>: File → Export As → SVG. <strong>Figma</strong>: right-click → Copy as SVG, paste in the code box. <strong>Inkscape</strong>: File → Save As → SVG.</div>
              <span className="stip">💡 SVG from AI tools works too</span>
            </div>
          </div>
          <div className="step">
            <div className="snum s2">2</div>
            <div className="stepcon">
              <div className="stitle">Upload or Paste Your SVG</div>
              <div className="sbody">Click <strong>Upload SVG</strong>, or use <strong>paste code</strong> to paste SVG code. Preview loads automatically.</div>
              <span className="stip">👁 Mobile: pinch to zoom, drag to pan</span>
            </div>
          </div>
          <div className="step">
            <div className="snum s3">3</div>
            <div className="stepcon">
              <div className="stitle">Set Size &amp; Pick Layers</div>
              <div className="sbody">Pick your video size (<strong>1:1</strong> for posts, <strong>9:16</strong> for stories). Check which layers to include. Groups follow your SVG structure automatically.</div>
              <span className="stip">🔷 Simple shapes = lighter file in Alight Motion</span>
            </div>
          </div>
          <div className="step" style={{ paddingBottom: 0 }}>
            <div className="snum s4">4</div>
            <div className="stepcon">
              <div className="stitle">Convert &amp; Import into Alight Motion</div>
              <div className="sbody">Hit <strong>CONVERT TO XML</strong>, then download. In Alight Motion: tap <strong>+</strong> → <strong>Import</strong> → pick the XML file.</div>
              <span className="stip">📋 File name is auto-filled from your SVG</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
