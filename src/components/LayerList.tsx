import { useState } from 'react';
import type { ParsedPath } from '../lib/types';

interface LayerListProps {
  parsedPaths: ParsedPath[];
  selectedIndices: boolean[];
  onToggle: (index: number, checked: boolean) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
}

interface GroupedLayer {
  groupName: string | null;
  paths: ParsedPath[];
}

export default function LayerList({ parsedPaths, selectedIndices, onToggle, onSelectAll, onSelectNone }: LayerListProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (!parsedPaths.length) return (
    <div style={{ padding: '12px 0', color: 'var(--muted-2)', fontSize: 12, textAlign: 'center' }}>
      Load an SVG to see layers
    </div>
  );

  const selectedCount = selectedIndices.filter(Boolean).length;
  const totalCount = parsedPaths.length;

  const groups: GroupedLayer[] = [];
  const groupMap = new Map<string, ParsedPath[]>();
  const ungrouped: ParsedPath[] = [];

  parsedPaths.forEach(pp => {
    if (pp.groupPath.length > 0) {
      const key = pp.groupPath[0];
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(pp);
    } else {
      ungrouped.push(pp);
    }
  });

  for (const [groupName, paths] of groupMap) groups.push({ groupName, paths });
  if (ungrouped.length) groups.push({ groupName: null, paths: ungrouped });

  const toggleGroup = (key: string) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div>
      <div className="card-head" style={{ padding: '8px 12px', marginBottom: 6, background: 'none', border: 'none', borderBottom: '1px solid var(--border-2)' }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
          {selectedCount} / {totalCount} selected
        </div>
        <div className="layer-controls">
          <button className="layer-ctrl-btn" onClick={onSelectAll}>All</button>
          <button className="layer-ctrl-btn" onClick={onSelectNone}>None</button>
        </div>
      </div>

      <div id="layerList">
        {groups.map(({ groupName, paths }) => {
          if (!groupName) {
            return paths.map(pp => (
              <LayerItem key={pp.index} pp={pp} checked={selectedIndices[pp.index] ?? true} onToggle={onToggle} />
            ));
          }
          const isCollapsed = collapsed[groupName];
          const allSelected = paths.every(pp => selectedIndices[pp.index]);
          const someSelected = paths.some(pp => selectedIndices[pp.index]);
          return (
            <div key={groupName} className="layer-group-wrap">
              <div
                className={`layer-group-head${isCollapsed ? ' collapsed' : ''}`}
                onClick={() => toggleGroup(groupName)}
              >
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={el => { if (el) el.indeterminate = !allSelected && someSelected; }}
                  onChange={e => {
                    e.stopPropagation();
                    paths.forEach(pp => onToggle(pp.index, e.target.checked));
                  }}
                  onClick={e => e.stopPropagation()}
                  style={{ width: 13, height: 13 }}
                />
                <span className="layer-group-label">{groupName}</span>
                <span className="layer-group-count">{paths.length}</span>
                <span className="layer-group-chevron">▾</span>
              </div>
              {!isCollapsed && (
                <div className="layer-group-children">
                  {paths.map(pp => (
                    <LayerItem key={pp.index} pp={pp} checked={selectedIndices[pp.index] ?? true} onToggle={onToggle} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LayerItem({ pp, checked, onToggle }: { pp: ParsedPath; checked: boolean; onToggle: (index: number, checked: boolean) => void }) {
  const color = pp.color?.cssHex || (pp.svgStroke.isStrokeOnly ? pp.svgStroke.raw || '#ccc' : '#ccc');
  return (
    <div className="layer-item">
      <input type="checkbox" checked={checked} onChange={e => onToggle(pp.index, e.target.checked)} />
      <span className="layer-swatch" style={{ background: color }} />
      <span className="layer-name">{pp.label || `path_${pp.index}`}</span>
      {pp.color?.isGradient && <span className="layer-tag">grad</span>}
      {pp.svgStroke.isStrokeOnly && <span className="layer-tag">stk</span>}
      {pp.hasMatrix && <span className="layer-info">m</span>}
    </div>
  );
}
