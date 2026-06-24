import type { ConvertSettings } from '../lib/types';

const PRESETS: Record<string, [number, number]> = {
  '1:1': [1080, 1080],
  '16:9': [1920, 1080],
  '9:16': [1080, 1920],
  '4:5': [1080, 1350],
  '4:3': [1440, 1080],
};

interface SettingsProps {
  settings: ConvertSettings;
  onChange: (partial: Partial<ConvertSettings>) => void;
  svgDims: { vbW: number; vbH: number } | null;
  customMode: boolean;
  onSetCustomMode: (v: boolean) => void;
  activePreset: string | null;
  onSetActivePreset: (k: string | null) => void;
}

export default function Settings({
  settings, onChange, svgDims, customMode, onSetCustomMode, activePreset, onSetActivePreset,
}: SettingsProps) {
  const durSec = Math.round((settings.endTime - settings.startTime) / 1020 * 10) / 10;

  function setPreset(key: string) {
    const [w, h] = PRESETS[key];
    onSetActivePreset(key);
    onSetCustomMode(false);
    onChange({ targetW: w, targetH: h });
  }

  function setSvgPreset() {
    if (!svgDims) return;
    onSetActivePreset('svg');
    onSetCustomMode(false);
    onChange({ targetW: Math.round(svgDims.vbW), targetH: Math.round(svgDims.vbH) });
  }

  function handleDurChange(v: number) {
    onChange({ endTime: Math.round(v * 1020) });
  }

  return (
    <>
      <div className="card">
        <div className="card-head">
          <div className="card-title"><span className="card-title-dot" />Canvas &amp; Duration</div>
        </div>
        <div className="card-body">
          <div className="canvas-presets">
            {/* SVG native size preset — shown only when SVG loaded */}
            {svgDims && (
              <button
                className={`cp${activePreset === 'svg' ? ' active' : ''}`}
                onClick={setSvgPreset}
                title={`SVG native: ${Math.round(svgDims.vbW)}×${Math.round(svgDims.vbH)}`}
              >
                SVG
              </button>
            )}
            {Object.keys(PRESETS).map(k => (
              <button key={k} className={`cp${activePreset === k ? ' active' : ''}`} onClick={() => setPreset(k)}>{k}</button>
            ))}
          </div>

          {/* Show current canvas size info */}
          {activePreset === 'svg' && svgDims && (
            <div className="svg-size-info">
              {Math.round(svgDims.vbW)} × {Math.round(svgDims.vbH)} px (SVG native)
            </div>
          )}

          <div className="custom-toggle-row">
            <span className="custom-toggle-label">Custom Size</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={customMode}
                onChange={e => {
                  onSetCustomMode(e.target.checked);
                  if (e.target.checked) {
                    onSetActivePreset(null);
                    // Pre-fill with current dims
                    if (svgDims) {
                      onChange({ targetW: Math.round(svgDims.vbW), targetH: Math.round(svgDims.vbH) });
                    }
                  } else {
                    // Revert to SVG preset if dims available
                    if (svgDims) {
                      onSetActivePreset('svg');
                      onChange({ targetW: Math.round(svgDims.vbW), targetH: Math.round(svgDims.vbH) });
                    }
                  }
                }}
              />
              <span className="toggle-thumb" />
            </label>
          </div>
          <div className={`custom-dims${customMode ? ' show' : ''}`}>
            <div className="row-2">
              <div className="col">
                <label className="field-label">Width</label>
                <input type="number" value={settings.targetW} min={100} max={7680}
                  onChange={e => { onChange({ targetW: parseInt(e.target.value) || 1080 }); onSetActivePreset(null); }} />
              </div>
              <div className="col">
                <label className="field-label">Height</label>
                <input type="number" value={settings.targetH} min={100} max={7680}
                  onChange={e => { onChange({ targetH: parseInt(e.target.value) || 1080 }); onSetActivePreset(null); }} />
              </div>
            </div>
          </div>
          <div className="row-2" style={{ marginTop: 8 }}>
            <div className="col">
              <label className="field-label">FPS</label>
              <select value={settings.fps} onChange={e => onChange({ fps: parseInt(e.target.value) })}>
                <option value={24}>24 fps</option>
                <option value={30}>30 fps</option>
                <option value={60}>60 fps</option>
                <option value={120}>120 fps</option>
              </select>
            </div>
            <div className="col">
              <label className="field-label">Duration (s)</label>
              <input type="number" value={durSec} min={0.1} max={300} step={0.1}
                onChange={e => handleDurChange(parseFloat(e.target.value) || 2)} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title"><span className="card-title-dot" />Fill &amp; Stroke</div>
        </div>
        <div className="card-body">
          <div className="section-sep">Fill</div>
          <div className="opt-grid">
            {[
              { v: 'color', l: 'From SVG' },
              { v: 'gradient-linear', l: 'Linear Grad' },
              { v: 'gradient-sweep', l: 'Sweep Grad' },
              { v: 'none', l: 'None' },
            ].map(o => (
              <label key={o.v} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                <input type="radio" name="fillType" checked={settings.fillType === o.v}
                  onChange={() => onChange({ fillType: o.v })} style={{ width: 13, height: 13 }} />
                {o.l}
              </label>
            ))}
          </div>
          {settings.fillType.startsWith('gradient') && (
            <div>
              <div className="color-row">
                <input type="color" value={settings.gradStart} onChange={e => onChange({ gradStart: e.target.value })} />
                <span className="color-label">Gradient Start</span>
              </div>
              <div className="color-row">
                <input type="color" value={settings.gradEnd} onChange={e => onChange({ gradEnd: e.target.value })} />
                <span className="color-label">Gradient End</span>
              </div>
            </div>
          )}
          <div className="section-sep">Stroke</div>
          <div className="toggle-row">
            <input type="checkbox" checked={settings.useStroke} onChange={e => onChange({ useStroke: e.target.checked })} id="useStroke" />
            <label htmlFor="useStroke">Enable Stroke</label>
          </div>
          {settings.useStroke && (
            <>
              <div className="row-2" style={{ marginTop: 10 }}>
                <div className="col">
                  <label className="field-label">Size</label>
                  <input type="number" value={settings.strokeSize} min={0.5} max={200} step={0.5}
                    onChange={e => onChange({ strokeSize: parseFloat(e.target.value) || 5 })} />
                </div>
                <div className="col">
                  <label className="field-label">Join</label>
                  <select value={settings.strokeJoin} onChange={e => onChange({ strokeJoin: e.target.value })}>
                    <option value="miter">Miter</option>
                    <option value="round">Round</option>
                    <option value="bevel">Bevel</option>
                  </select>
                </div>
              </div>
              <div className="toggle-row" style={{ marginTop: 8 }}>
                <input type="checkbox" checked={settings.useStrokeColor} onChange={e => onChange({ useStrokeColor: e.target.checked })} id="useStrokeColor" />
                <label htmlFor="useStrokeColor">Custom Stroke Color</label>
              </div>
              {settings.useStrokeColor && (
                <div className="color-row" style={{ marginTop: 6 }}>
                  <input type="color" value={settings.strokeColor} onChange={e => onChange({ strokeColor: e.target.value })} />
                  <span className="color-label">Stroke Color</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title"><span className="card-title-dot" />Export Options</div>
        </div>
        <div className="card-body">
          <div className="section-sep">Grouping</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
              <input type="radio" name="groupMode" checked={settings.groupMode === 'flat'} onChange={() => onChange({ groupMode: 'flat' })} style={{ width: 13, height: 13 }} />
              Flat (no groups)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
              <input type="radio" name="groupMode" checked={settings.groupMode === 'embedScene'} onChange={() => onChange({ groupMode: 'embedScene' })} style={{ width: 13, height: 13 }} />
              Nested Groups (EmbedScene)
            </label>
          </div>
          <div className="toggle-row" style={{ marginTop: 12 }}>
            <input type="checkbox" checked={settings.useShapePrim} onChange={e => onChange({ useShapePrim: e.target.checked })} id="useShapePrim" />
            <label htmlFor="useShapePrim">Detect Shape Primitives</label>
          </div>
          <div style={{ marginTop: 12 }}>
            <label className="field-label">Project Name</label>
            <input type="text" value={settings.projectName}
              onChange={e => onChange({ projectName: e.target.value })}
              placeholder="MyProject" />
          </div>
        </div>
      </div>
    </>
  );
}
