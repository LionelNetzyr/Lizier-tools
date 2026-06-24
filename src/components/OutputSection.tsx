import { useRef } from 'react';

interface OutputSectionProps {
  xml: string;
  statusText: string;
  filename: string;
  visible: boolean;
}

function showToast(msg: string) {
  let toast = document.getElementById('_lizToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = '_lizToast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast?.classList.remove('show'), 2200);
}

export default function OutputSection({ xml, statusText, filename, visible }: OutputSectionProps) {
  const preRef = useRef<HTMLDivElement>(null);

  function copyResult() {
    if (!xml) return;
    navigator.clipboard.writeText(xml).then(() => showToast('✓ Copied to clipboard!')).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = xml; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta); showToast('✓ Copied!');
    });
  }

  function downloadXml() {
    if (!xml) return;
    const blob = new Blob([xml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename || 'output.xml';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast('⬇ Downloading...');
  }

  return (
    <div id="resBox" className={visible ? 'visible' : ''}>
      <div className="out-card card">
        <div className="out-head">
          <span className="out-filename">{filename || 'output.xml'}</span>
        </div>
        <div className="out-status-bar">
          <span className="out-status">{statusText}</span>
          <div className="mini-btns">
            <button className="mini-btn btn-copy" onClick={copyResult}>COPY TEXT</button>
            <button className="mini-btn btn-dl" onClick={downloadXml}>⬇ SAVE PRESET</button>
          </div>
        </div>
        <div id="outputXmlWrap">
          {!xml && (
            <div className="xml-placeholder">
              <svg viewBox="0 0 1080 1080" width="32" height="32" style={{ marginBottom: 12, opacity: .3 }}>
                <path fill="#22cab3" d="m834.74 651.2l-509.48 104.45 285.69 80.51-89.46-152.07 72.65-15.36 133.61 218.47q14.22 56.98 12.47 72.18 0.2 41.58-37.13 57.81-44.06 19.7-102.02-0.15-11.53-3.62-38.11-14.33l-339.46-191.37q-24-11.06-35.32-17.63-22.96-11.53-32.78-32.11-14.43-32.94 32.42-51.45l470.59-174-233.36-168.67 146.49 253.52-76.94 5.07-206.88-337.65q-37.65-66.6-42.09-87.7-6.83-21.41-6.16-41.78-1.29-16.03 14.69-47.73 28.33-45.61 77.77-55.95 55.58-12.1 124.56 40.39l378.92 344.68q56.11 51.25 73.12 70.79c11.32 13.03 18.25 29.53 19.13 41.68 1.4 18.51 0.98 33.46-12.98 52.02-14.89 19.7-40.54 39.92-79.94 46.38z" />
              </svg>
              <div style={{ fontFamily: 'var(--font-code)', fontSize: 12, color: 'rgba(255,255,255,.2)', fontStyle: 'italic' }}>
                // XML output will appear here after converting...
              </div>
            </div>
          )}
          <div id="outputXml" ref={preRef}
            style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75, fontSize: 11, fontFamily: 'var(--font-code)', color: '#6ee7b7', background: '#0D1117', padding: 20, maxHeight: 380, overflowY: 'auto', display: xml ? 'block' : 'none' }}>
            {xml}
          </div>
        </div>
      </div>
    </div>
  );
}
