export default function Footer() {
  return (
    <footer className="footer">
      <div className="fi2">
        <div>
          <div className="footer-logo-video-wrap">
            <video className="footer-logo-video" src="logo.mp4" autoPlay loop muted playsInline preload="auto" />
          </div>
          <div className="fbd">Free SVG to Alight Motion XML converter. No sign-up, runs entirely in your browser.</div>
          <div className="fsoc">
            <a href="https://saweria.co/LionelNetzyr" target="_blank" rel="noopener" className="sb" title="Saweria">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
            </a>
            <a href="mailto:lionelnetzyr@gmail.com" className="sb" title="Email">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>
              </svg>
            </a>
          </div>
        </div>
        <div>
          <div className="fct">Links</div>
          <a href="#app" className="fl2">Converter</a>
          <a href="#fitur" className="fl2">Features</a>
          <a href="#faq" className="fl2">FAQ</a>
        </div>
        <div>
          <div className="fct">Contact</div>
          <a href="mailto:lionelnetzyr@gmail.com" className="fl2">lionelnetzyr@gmail.com</a>
          <a href="https://saweria.co/LionelNetzyr" target="_blank" rel="noopener" className="fl2">saweria.co/LionelNetzyr</a>
        </div>
      </div>
      <div className="fbot">
        <span className="fcp">© 2024 Lizier Tools · All rights reserved</span>
        <span className="fvr">v20.0</span>
      </div>
    </footer>
  );
}
