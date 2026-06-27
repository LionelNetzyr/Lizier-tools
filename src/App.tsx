import { useState, useRef, useCallback, useEffect } from 'react';
import Topbar from './components/Topbar';
import NavDrawer from './components/NavDrawer';
import Hero from './components/Hero';
import GuidePanel from './components/GuidePanel';
import CodeInputPanel from './components/CodeInputPanel';
import SvgPreview from './components/SvgPreview';
import LayerList from './components/LayerList';
import Settings from './components/Settings';
import OutputSection from './components/OutputSection';
import FeaturesSection from './components/FeaturesSection';
import FaqSection from './components/FaqSection';
import Footer from './components/Footer';
import type { ParsedPath, ConvertSettings, SvgDims } from './lib/types';
import { parseSvg } from './lib/parsers/svg-parser';
import { processAM } from './lib/core/converter';
const DEFAULT_SETTINGS: ConvertSettings = { targetW: 1080, targetH: 1080, fps: 30, startTime: 0, endTime: 2040, fillType: 'color', gradStart: '#00C9A7', gradEnd: '#ffffff', useStroke: false, strokeSize: 5, strokeJoin: 'miter', strokeColor: '#000000', useStrokeColor: false, groupMode: 'embedScene', useShapePrim: true, projectName: '', svgFileName: '' };
export default function App() {
  const [navOpen, setNavOpen] = useState(false); const [guideOpen, setGuideOpen] = useState(false); const [codeOpen, setCodeOpen] = useState(false); const [codeValue, setCodeValue] = useState('');
  const [parsedPaths, setParsedPaths] = useState<ParsedPath[]>([]); const [svgCloneHtml, setSvgCloneHtml] = useState(''); const [svgDims, setSvgDims] = useState<SvgDims | null>(null); const [svgText, setSvgText] = useState(''); const [selectedIndices, setSelectedIndices] = useState<boolean[]>([]); const [showApp, setShowApp] = useState(false);
  const [settings, setSettings] = useState<ConvertSettings>(DEFAULT_SETTINGS); const [customMode, setCustomMode] = useState(false); const [activePreset, setActivePreset] = useState<string | null>(null); const [uploadedFileName, setUploadedFileName] = useState('');
  const [outputXml, setOutputXml] = useState(''); const [statusText, setStatusText] = useState(''); const [outFilename, setOutFilename] = useState(''); const [outputVisible, setOutputVisible] = useState(false); const [converting, setConverting] = useState(false);
  const [hasAiMatrix, setHasAiMatrix] = useState(false); const [strokeOnlyCount, setStrokeOnlyCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null); const appContentRef = useRef<HTMLDivElement>(null);
  const loadSvg = useCallback((txt: string, fileName: string) => { 
    try { 
      // Clear previous state first to prevent stale data
      setParsedPaths([]);
      setSvgCloneHtml('');
      setSvgDims(null);
      setSelectedIndices([]);
      setOutputXml('');
      setOutputVisible(false);
      setStatusText('');
      
      const result = parseSvg(txt); 
      if (!result.parsedPaths.length && !result.hasOnlyRaster) { 
        alert('No convertible shapes found.'); 
        return; 
      } 
      
      setParsedPaths(result.parsedPaths); 
      setSvgCloneHtml(result.svgCloneHtml); 
      setSvgDims(result.svgDims); 
      setSvgText(txt); 
      setSelectedIndices(new Array(result.parsedPaths.length).fill(true)); 
      setHasAiMatrix(result.hasAiMatrix); 
      setStrokeOnlyCount(result.strokeOnlyCount); 
      setShowApp(true); 
      
      const dims = result.svgDims; 
      if (dims && dims.vbW > 0 && dims.vbH > 0) { 
        setSettings(s => ({ ...s, targetW: Math.round(dims.vbW), targetH: Math.round(dims.vbH) })); 
        setActivePreset('svg'); 
        setCustomMode(false); 
      } else { 
        setActivePreset(null); 
      } 
      
      if (fileName) { 
        const displayName = fileName.endsWith('.svg') ? fileName : fileName + '.svg'; 
        setUploadedFileName(displayName); 
        // Always override projectName with new filename (fix: don't use old value)
        setSettings(s => ({ ...s, svgFileName: fileName, projectName: fileName })); 
      } 
      
      setTimeout(() => { 
        appContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
      }, 200); 
    } catch (e) { 
      console.error('SVG parse error:', e); 
      alert('Failed to parse SVG: ' + (e as Error).message); 
      // Reset state on error
      handleClear();
    } 
  }, []);
  function handleCodeInput(txt: string) { setCodeValue(txt); const trimmed = txt.trim(); if (trimmed.startsWith('<svg') || trimmed.startsWith('<?xml')) loadSvg(txt, 'pasted_svg'); }
  function handleToggle(index: number, checked: boolean) { setSelectedIndices(prev => { const next = [...prev]; next[index] = checked; return next; }); }
  function handleSelectAll() { setSelectedIndices(new Array(parsedPaths.length).fill(true)); }
  function handleSelectNone() { setSelectedIndices(new Array(parsedPaths.length).fill(false)); }
  function handleSettingsChange(partial: Partial<ConvertSettings>) { setSettings(s => ({ ...s, ...partial })); }
  function handleConvert() { if (!parsedPaths.length) return; setConverting(true); setTimeout(() => { try { const result = processAM(parsedPaths, selectedIndices, settings, svgText); if (!result.xml) { setStatusText(result.statusText || 'No layers selected.'); setOutputXml(''); setOutputVisible(true); } else { setOutputXml(result.xml); setStatusText(result.statusText); setOutFilename(result.filename); setOutputVisible(true); } } catch (e) { console.error('Convert error:', e); setStatusText('❌ Conversion error — check console'); setOutputVisible(true); } setConverting(false); }, 10); }
  function handleClear() { 
    setParsedPaths([]); 
    setSvgCloneHtml(''); 
    setSvgDims(null); 
    setSvgText(''); 
    setSelectedIndices([]); 
    setShowApp(false); 
    setOutputXml(''); 
    setOutputVisible(false); 
    setStatusText(''); 
    setUploadedFileName(''); 
    setCodeValue(''); 
    setHasAiMatrix(false);
    setStrokeOnlyCount(0);
    setSettings(DEFAULT_SETTINGS); 
    setActivePreset(null); 
    setCustomMode(false); 
  }
  const selectedCount = selectedIndices.filter(Boolean).length;
  const uniqueColors = new Set(parsedPaths.filter((_, i) => selectedIndices[i]).map(p => p.color?.cssHex || '').filter(Boolean)).size;
  useEffect(() => { const handler = (e: ClipboardEvent) => { const txt = e.clipboardData?.getData('text/plain') || ''; const trimmed = txt.trim(); if (trimmed.startsWith('<svg') || trimmed.startsWith('<?xml')) { e.preventDefault(); setCodeValue(txt); setCodeOpen(true); loadSvg(txt, 'pasted_svg'); } }; document.addEventListener('paste', handler); return () => document.removeEventListener('paste', handler); }, [loadSvg]);
  return ( <> <Topbar onOpenNav={() => setNavOpen(true)} onOpenGuide={() => setGuideOpen(v => !v)} onOpenCode={() => { setCodeOpen(v => !v); setGuideOpen(false); }} /> <NavDrawer open={navOpen} onClose={() => setNavOpen(false)} onOpenGuide={() => { setNavOpen(false); setGuideOpen(true); }} /> <Hero onFileLoaded={(txt, name) => { loadSvg(txt, name); setCodeOpen(false); }} onOpenCode={() => { setCodeOpen(v => !v); setGuideOpen(false); }} onOpenGuide={() => { setGuideOpen(v => !v); setCodeOpen(false); }} /> <GuidePanel open={guideOpen} onClose={() => setGuideOpen(false)} /> <CodeInputPanel open={codeOpen} onClose={() => setCodeOpen(false)} onSvgInput={handleCodeInput} value={codeValue} /> <div id="app"><div className="wrap"><div ref={appContentRef} className={`app-content${showApp ? ' visible' : ''}`}> {hasAiMatrix && (<div id="svgHintBox" className="visible">⚠ This SVG uses <code>matrix()</code> transforms.</div>)} {strokeOnlyCount > 0 && (<div id="svgHintBox" className="visible" style={{ marginTop: 6, background: 'rgba(0,201,167,.05)', borderColor: 'rgba(0,201,167,.3)' }}>ℹ {strokeOnlyCount} stroke-only shape(s) detected.</div>)} {uploadedFileName && (<div className="uploaded-name-row"><span className="upload-file-badge"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>{uploadedFileName}</span></div>)} <div className="main-grid"><div className="preview-wrapper"><SvgPreview svgHtml={svgCloneHtml} svgDims={svgDims} /><div className="card"><div className="card-head"><div className="card-title"><span className="card-title-dot" />Layers</div></div><div className="card-body" style={{ padding: '8px 0' }}><LayerList parsedPaths={parsedPaths} selectedIndices={selectedIndices} onToggle={handleToggle} onSelectAll={handleSelectAll} onSelectNone={handleSelectNone} /></div></div><div className="stats"><div className="stat-card"><div className="stat-val">{parsedPaths.length}</div><div className="stat-key">Total Paths</div></div><div className="stat-card"><div className="stat-val">{uniqueColors}</div><div className="stat-key">Unique Colors</div></div><div className="stat-card"><div className="stat-val">{selectedCount}</div><div className="stat-key">Selected</div></div><div className="stat-card"><div className="stat-val">{svgDims ? Math.round(svgDims.vbW) : '—'}</div><div className="stat-key">SVG Width</div></div></div></div><div className="settings-stack"><Settings settings={settings} onChange={handleSettingsChange} svgDims={svgDims} customMode={customMode} onSetCustomMode={setCustomMode} activePreset={activePreset} onSetActivePreset={setActivePreset} /></div></div><div className="convert-bar"><button className={`btn-convert${converting ? ' loading' : ''}`} onClick={handleConvert} disabled={converting || selectedCount === 0}>{converting ? '⏳ Converting...' : '⚡ CONVERT TO XML'}</button><button className="btn-clear" onClick={handleClear} title="Clear all">✕ Clear</button></div><OutputSection xml={outputXml} statusText={statusText} filename={outFilename} visible={outputVisible} /></div></div></div> <FeaturesSection /> <FaqSection /> <Footer /> <input ref={fileInputRef} type="file" accept=".svg" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (!f) return; e.target.value = ''; const reader = new FileReader(); reader.onload = ev => { const txt = ev.target?.result as string; const name = f.name.replace(/\.svg$/i, '').replace(/[^a-zA-Z0-9_\-]/g, '_'); loadSvg(txt, name); setCodeOpen(false); }; reader.readAsText(f); }} /> </> );
}
