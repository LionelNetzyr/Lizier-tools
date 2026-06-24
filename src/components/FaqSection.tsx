import { useState } from 'react';

const FAQ_ITEMS = [
  {
    q: 'What types of SVG files are supported?',
    a: 'Any SVG with vector paths (path, rect, circle, ellipse, polyline, polygon). Fonts/text and raster images (embedded) cannot be converted.',
  },
  {
    q: 'Do I need to create an account or install anything?',
    a: 'No! This tool runs 100% in your browser — no server upload, no account, no installation. Your SVG never leaves your device.',
  },
  {
    q: 'Why are some shapes missing after conversion?',
    a: 'Check that layers are checked in the layer list. Shapes inside <defs>, <clipPath> or masked elements may be excluded automatically.',
  },
  {
    q: 'How do I import the XML into Alight Motion?',
    a: 'In Alight Motion: tap the + button → Import → select the downloaded .xml file. The preset will appear in your project.',
  },
  {
    q: 'What does "Detect Shape Primitives" do?',
    a: 'When enabled, the converter detects rectangles, circles, triangles, and polygons and converts them to native Alight Motion shape objects instead of custom paths. This makes the file smaller and easier to animate.',
  },
  {
    q: 'Why is the artwork not centered in Alight Motion?',
    a: 'Make sure your SVG viewBox matches the artwork bounds. You can also try re-exporting from Illustrator with "Fit artboard to art" to ensure correct viewBox dimensions.',
  },
  {
    q: 'Can I convert SVGs from Figma or Canva?',
    a: 'Yes! Right-click in Figma → Copy as SVG, then paste in the code box. From Canva, use Export → SVG.',
  },
  {
    q: 'Is this tool completely free?',
    a: 'Yes, completely free. If it saved you time, consider buying a coffee via Saweria to support future development! ☕',
  },
];

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="wrap">
      <div id="faq">
        <div className="sdiv" />
        <div className="gsec">
          <span className="sec-label">FAQ</span>
          <div className="sec-title">Common Questions</div>
          <div className="faq">
            {FAQ_ITEMS.map((item, i) => (
              <div className="faqi" key={i}>
                <div className="faqq" onClick={() => setOpen(open === i ? null : i)}>
                  {item.q}
                  <span className={`faqi_${open === i ? ' open' : ''}`}>+</span>
                </div>
                <div className={`faqa${open === i ? ' open' : ''}`}>{item.a}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="donasi-banner" style={{ marginBottom: 0 }}>
          <div className="donasi-text">
            <div className="donasi-title">☕ Support Lizier Tools</div>
            <div className="donasi-sub">If this tool helped you, buy the developer a coffee!</div>
          </div>
          <a href="https://saweria.co/LionelNetzyr" target="_blank" rel="noopener" className="donasi-btn">Support on Saweria</a>
        </div>
      </div>
    </div>
  );
}
