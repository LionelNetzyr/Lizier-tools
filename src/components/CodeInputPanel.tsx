interface CodeInputPanelProps {
  open: boolean;
  onClose: () => void;
  onSvgInput: (txt: string) => void;
  value: string;
}

export default function CodeInputPanel({ open, onClose, onSvgInput, value }: CodeInputPanelProps) {
  return (
    <div className={`code-input-panel${open ? ' open' : ''}`}>
      <div className="code-input-panel-inner">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.5px', textTransform: 'uppercase' }}>Paste SVG Code</label>
          <button onClick={onClose} style={{ background: 'none', border: '1.5px solid var(--border)', color: 'var(--muted)', borderRadius: 100, padding: '5px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font)' }}>✕ Close</button>
        </div>
        <textarea
          value={value}
          onChange={e => onSvgInput(e.target.value)}
          placeholder={"<svg xmlns='http://www.w3.org/2000/svg'>\n  <path d='M...' />\n</svg>"}
        />
        <div className="code-panel-hint">After pasting, scroll down to see the preview and convert ↓</div>
      </div>
    </div>
  );
}
