import { useApp } from '../context/AppContext';

function esc(s) { return String(s || ''); }

export default function ColourView() {
  const { parts, colourExpanded, toggleColour } = useApp();
  const queuedParts = parts.filter(p => p.status === 'queue');

  if (!queuedParts.length) {
    return <p style={{ color: 'var(--text2)', fontSize: 13, padding: '1rem 0' }}>no parts in queue — add some parts and set their status to queue.</p>;
  }

  const colourMap = {};
  queuedParts.forEach(p => {
    const colours = p.colours?.length ? p.colours : (p.colour ? [{ hex: p.colour, name: p.colourName || '' }] : [{ hex: '#888888', name: 'unknown' }]);
    colours.forEach(c => {
      const key = (c.name || c.hex || 'unknown').toLowerCase().trim();
      if (!colourMap[key]) colourMap[key] = { name: c.name || c.hex || 'unknown', hex: c.hex || '#888888', parts: [] };
      colourMap[key].parts.push(p);
    });
  });

  const sorted = Object.values(colourMap).sort((a, b) => b.parts.length - a.parts.length);
  const totalPcsAll = queuedParts.reduce((a, p) => a + p.qty, 0);

  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
        {sorted.length} colour{sorted.length !== 1 ? 's' : ''} · {queuedParts.length} part{queuedParts.length !== 1 ? 's' : ''} · {totalPcsAll} pieces in queue
      </div>
      {sorted.map(group => {
        const key = group.name.toLowerCase().trim();
        const isOpen = colourExpanded.has(key);
        const totalPcs = group.parts.reduce((a, p) => a + p.qty, 0);
        return (
          <div key={key} className="product-card" style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleColour(key)}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: group.hex, border: '0.5px solid rgba(0,0,0,.15)', flexShrink: 0 }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{esc(group.name)}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{group.parts.length} part{group.parts.length !== 1 ? 's' : ''} · {totalPcs} piece{totalPcs !== 1 ? 's' : ''}</div>
              </div>
              <span className={`chevron${isOpen ? ' open' : ''}`} style={{ fontSize: 11 }}>▶</span>
            </div>
            {isOpen && (
              <div className="parts-table">
                {group.parts.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderBottom: '0.5px solid var(--border)', fontSize: 13 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, color: 'var(--text)' }}>{esc(p.name)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)' }}>{esc(p.item || '')}{p.variant ? ' · ' + esc(p.variant) : ''}</div>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>{p.qty} pc{p.qty !== 1 ? 's' : ''}</span>
                    <span className="sp sp-queue" style={{ fontSize: 11 }}>queue</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
