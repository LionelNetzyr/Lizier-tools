interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpenGuide: () => void;
}

export default function NavDrawer({ open, onClose, onOpenGuide }: NavDrawerProps) {
  return (
    <>
      <div className={`nav-overlay${open ? ' open' : ''}`} onClick={onClose} />
      <div className={`nav-drawer${open ? ' open' : ''}`}>
        <div className="nav-drawer-header">
          <div className="logo-nav-video" style={{ height: 38, width: 85 }}>
            <video className="logo-video" src="logo.mp4" autoPlay loop muted playsInline preload="auto" />
          </div>
          <button className="nav-drawer-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <nav className="nav-drawer-body">
          <a href="#app" className="nav-drawer-link" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Converter
          </a>
          <a href="#" className="nav-drawer-link" onClick={(e) => { e.preventDefault(); onClose(); onOpenGuide(); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            Guide
          </a>
          <a href="#fitur" className="nav-drawer-link" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Features
          </a>
          <a href="#faq" className="nav-drawer-link" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            FAQ
          </a>
          <div className="nav-drawer-divider" />
          <a href="mailto:lionelnetzyr@gmail.com" className="nav-drawer-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 7 10-7" />
            </svg>
            Contact
          </a>
        </nav>
        <div className="nav-drawer-footer">
          <a href="https://saweria.co/LionelNetzyr" target="_blank" rel="noopener" className="nav-donate" style={{ textAlign: 'center', justifyContent: 'center' }}>
            ☕ Support on Saweria
          </a>
        </div>
      </div>
    </>
  );
}
