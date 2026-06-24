interface TopbarProps {
  onOpenNav: () => void;
  onOpenGuide: () => void;
  onOpenCode: () => void;
}

export default function Topbar({ onOpenNav, onOpenGuide, onOpenCode }: TopbarProps) {
  return (
    <div className="topbar">
      <button className="hamburger" onClick={onOpenNav} aria-label="Menu">
        <span /><span /><span />
      </button>

      <a href="#" className="logo-wrap">
        <div className="logo-nav-video">
          <video className="logo-video" src="logo.mp4" autoPlay loop muted playsInline preload="auto" aria-label="Lizier Logo" />
        </div>
      </a>

      <div className="topbar-nav">
        <a href="#app" className="nav-a">Converter</a>
        <a href="#" className="nav-a" onClick={(e) => { e.preventDefault(); onOpenGuide(); }}>Guide</a>
        <a href="#fitur" className="nav-a">Features</a>
        <a href="#faq" className="nav-a">FAQ</a>
      </div>

      <div className="topbar-right">
        <a href="mailto:lionelnetzyr@gmail.com" className="nav-contact" title="Contact us">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m2 7 10 7 10-7" />
          </svg>
          <span className="nav-contact-label">Contact</span>
        </a>
        <a href="https://saweria.co/LionelNetzyr" target="_blank" rel="noopener" className="nav-donate">☕ Support</a>
      </div>

      <button className="hero-paste-link" style={{ marginLeft: 'auto', display: 'none' }} onClick={onOpenCode}>paste code</button>
    </div>
  );
}
