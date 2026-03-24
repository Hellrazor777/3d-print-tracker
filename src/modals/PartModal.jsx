import { useState } from 'react';
import { useApp } from '../context/AppContext';

function ColourRow({ colour, onChange, onRemove, canRemove }) {
  return (
    <div className="colour-row" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
      <input type="color" value={colour.hex} style={{ width: 36, height: 36, padding: 2, borderRadius: 6, border: '0.5px solid var(--border2)', cursor: 'pointer', background: 'var(--bg2)', flexShrink: 0 }}
        onChange={e => onChange({ ...colour, hex: e.target.value })} />
      <input type="text" value={colour.name} placeholder="e.g. Galaxy Black, Sakura Pink"
        style={{ flex: 1, fontSize: 13, background: 'var(--bg2)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', padding: '6px 10px', color: 'var(--text)', fontFamily: 'inherit', outline: 'none' }}
        onChange={e => {
          const v = e.target.value;
          onChange({ name: v, hex: /^#[0-9a-f]{6}$/i.test(v) ? v : colour.hex });
        }} />
      <button type="button" onClick={onRemove} disabled={!canRemove}
        style={{ background: 'transparent', border: 'none', cursor: canRemove ? 'pointer' : 'default', padding: '4px 6px', borderRadius: 4, fontSize: 15, color: 'var(--text3)', fontFamily: 'inherit' }}>✕</button>
    </div>
  );
}

export default function PartModal() {
  const { modal, closeModal, saveCard, parts } = useApp();
  const editId = modal?.editId ?? null;
  const part = editId ? parts.find(p => p.id === editId) : null;

  const [name, setName] = useState(part?.name || '');
  const [item, setItem] = useState(part?.item || '');
  const [variant, setVariant] = useState(part?.variant || '');
  const [qty, setQty] = useState(part?.qty || 1);
  const [status, setStatus] = useState(part?.status || 'queue');
  const [colours, setColours] = useState(() => {
    if (part?.colours?.length) return part.colours;
    if (part?.colour) return [{ hex: part.colour, name: part.colourName || '' }];
    return [{ hex: '#4a90d9', name: '' }];
  });

  const items = [...new Set(parts.map(p => p.item).filter(Boolean))];

  const handleSave = () => {
    if (!name.trim()) return;
    saveCard({ name: name.trim(), item: item.trim(), variant: variant.trim(), colours, qty: parseInt(qty) || 1, status }, editId);
  };

  return (
    <div id="modal" style={{ display: '' }}>
      <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
        <div className="modal">
          <h3>{editId ? 'edit part' : 'add part'}</h3>
          <div className="section-label">part info</div>
          <div className="field"><label>part name *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. motor mount bracket" autoFocus /></div>
          <div className="field">
            <label>product it belongs to</label>
            <input value={item} onChange={e => setItem(e.target.value)} placeholder="e.g. Robot Arm" list="part-modal-item-list" />
            <datalist id="part-modal-item-list">{items.map(i => <option key={i} value={i} />)}</datalist>
          </div>
          <div className="field"><label>variant / sub-part</label><input value={variant} onChange={e => setVariant(e.target.value)} placeholder="e.g. left side, v2" /></div>
          <div className="section-label">print settings</div>
          <div className="field">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ marginBottom: 0 }}>filament colours</label>
              <button type="button" className="btn" style={{ padding: '2px 10px', fontSize: 12 }} onClick={() => setColours(c => [...c, { hex: '#4a90d9', name: '' }])}>+ add colour</button>
            </div>
            {colours.map((c, i) => (
              <ColourRow key={i} colour={c} onChange={nc => setColours(prev => prev.map((x, xi) => xi === i ? nc : x))} onRemove={() => setColours(prev => prev.filter((_, xi) => xi !== i))} canRemove={colours.length > 1} />
            ))}
          </div>
          <div className="field"><label>quantity needed</label><input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} /></div>
          <div className="field">
            <label>status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="planning">planning</option>
              <option value="queue">queue</option>
              <option value="printing">printing</option>
              <option value="done">done</option>
            </select>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={closeModal}>cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
