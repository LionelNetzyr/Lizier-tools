import { useRef, useEffect } from 'react';

interface HeroProps {
  onFileLoaded: (svgText: string, fileName: string) => void;
  onOpenCode: () => void;
  onOpenGuide: () => void;
}

export default function Hero({ onFileLoaded, onOpenCode, onOpenGuide }: HeroProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.svg')) { alert('File must be .svg format'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const txt = e.target?.result as string;
      const name = file.name.replace(/\.svg$/i, '').replace(/[^a-zA-Z0-9_\-]/g, '_');
      onFileLoaded(txt, name);
    };
    reader.readAsText(file);
  }

  async function openFilePicker() {
    if ((window as any).showOpenFilePicker) {
      try {
        const [fh] = await (window as any).showOpenFilePicker({
          types: [{ 
            description: 'SVG Files', 
            accept: { 'image/svg+xml': ['.svg'], 'application/xml': ['.svg'] } 
          }],
          excludeAcceptAllOption: true, 
          multiple: false,
        });
        handleFile(await fh.getFile());
        return;
      } catch (e: any) {
        if (e.name === 'AbortError') return;
      }
    }
    // Fallback to traditional file input with strict SVG filter
    fileInputRef.current?.setAttribute('accept', '.svg,image/svg+xml,application/xml');
    fileInputRef.current?.click();
  }

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const onDragOver = (e: DragEvent) => { e.preventDefault(); hero.classList.add('drag-over'); };
    const onDragLeave = (e: DragEvent) => {
      if (e.relatedTarget && document.contains(e.relatedTarget as Node)) return;
      hero.classList.remove('drag-over');
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault(); hero.classList.remove('drag-over');
      const file = e.dataTransfer?.files[0];
      if (file && file.name.endsWith('.svg')) handleFile(file);
    };
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('dragleave', onDragLeave);
    document.addEventListener('drop', onDrop);
    return () => {
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('dragleave', onDragLeave);
      document.removeEventListener('drop', onDrop);
    };
  });

  return (
    <div className="hero" ref={heroRef}>
      <div className="hero-inner">
        <div className="hero-eyebrow">✦ Free · No Sign-Up · Runs in Browser</div>
        <h1>Turn Any <span className="at">SVG</span><br />Into an <span className="ay ay-hero">Alight Motion</span> Preset</h1>
        <p className="hero-sub">
          Convert any <strong>SVG</strong> file into an <strong>Alight Motion</strong> XML preset — free, fast, runs in your browser
        </p>
        <div className="hero-btns">
          <button className="hero-upload-btn hero-upload-primary" onClick={openFilePicker}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" /></svg>
            Upload SVG
          </button>
          <div className="hero-secondary-actions">
            <button className="hero-paste-link" onClick={onOpenCode}>paste code</button>
            <span style={{ color: 'var(--muted-2)', fontSize: 11 }}>·</span>
            <button className="hero-paste-link" onClick={onOpenGuide}>how to use</button>
          </div>
        </div>
        <input 
          ref={fileInputRef} 
          type="file" 
          accept=".svg,image/svg+xml,application/xml" 
          style={{ display: 'none' }}
          onChange={e => { 
            const f = e.target.files?.[0]; 
            if (f) handleFile(f); 
            e.target.value = ''; 
          }} 
        />
      </div>
    </div>
  );
}
