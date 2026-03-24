import { useState } from 'react';
import { useApp } from '../context/AppContext';

function esc(s) { return String(s || ''); }

export default function SettingsModal() {
  const {
    closeModal, appSettings, saveAppSettings, isElectron,
    getCategoryOrder, getStorageLocations, getOutgoingDests,
    addCategory, removeCategory, moveCategoryOrder, openModal,
    addStorageLocation, removeStorageLocation, moveStorageLocation,
    addOutgoingDest, removeOutgoingDest, moveOutgoingDest,
  } = useApp();

  const [form, setForm] = useState({ ...appSettings });
  const [collapsed, setCollapsed] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('ssec-collapsed') || '[]')); } catch { return new Set(); }
  });
  const [newCat, setNewCat] = useState('');
  const [newLoc, setNewLoc] = useState('');
  const [newDest, setNewDest] = useState('');

  const toggleSection = (id) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('ssec-collapsed', JSON.stringify([...next]));
      return next;
    });
  };

  const handleSave = async () => {
    await saveAppSettings(form);
    closeModal();
  };

  const cats = getCategoryOrder();
  const locs = getStorageLocations();
  const dests = getOutgoingDests();

  const Section = ({ id, title, children }) => {
    const isOpen = !collapsed.has(id);
    return (
      <div className={`settings-section${isOpen ? ' open' : ' collapsed'}`} id={id}>
        <div className="settings-section-label" onClick={() => toggleSection(id)}>
          <span className="ssec-chevron">▶</span>{title}
        </div>
        <div className="settings-section-content">{children}</div>
      </div>
    );
  };

  return (
    <div id="settings-modal" style={{ display: '' }}>
      <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
        <div className="modal settings-modal">
          <div className="settings-header">
            <span className="settings-title">Settings</span>
            <button className="icon-btn settings-close-btn" onClick={closeModal}>✕</button>
          </div>
          <div className="settings-body">

            <Section id="ssec-appearance" title="Appearance">
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Theme</label>
                <div className="theme-toggle">
                  {['auto', 'light', 'dark'].map(t => (
                    <button key={t} className={`theme-btn${form.theme === t ? ' active' : ''}`} onClick={() => setForm(f => ({ ...f, theme: t }))}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </Section>

            <Section id="ssec-categories" title="Product Categories">
              {cats.map((cat, idx) => (
                <div key={cat} className="cat-row">
                  <span className="cat-row-name">{esc(cat)}</span>
                  <button className="btn cat-row-btn" disabled={idx === 0} onClick={() => moveCategoryOrder(cat, 'up')}>↑</button>
                  <button className="btn cat-row-btn" disabled={idx === cats.length - 1} onClick={() => moveCategoryOrder(cat, 'down')}>↓</button>
                  <button className="btn cat-row-btn" onClick={() => openModal('rename-cat', { oldName: cat, mode: 'category', title: 'Rename Category' })}>Rename</button>
                  <button className="btn cat-row-btn cat-row-del" onClick={() => { if (confirm(`Remove category "${cat}" from all products?`)) removeCategory(cat); }}>✕</button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="New category name" style={{ flex: 1 }} onKeyDown={e => { if (e.key === 'Enter' && newCat.trim()) { addCategory(newCat.trim()); setNewCat(''); } }} />
                <button className="btn btn-primary" onClick={() => { if (newCat.trim()) { addCategory(newCat.trim()); setNewCat(''); } }}>Add</button>
              </div>
            </Section>

            {isElectron && (
              <Section id="ssec-3mf" title="3MF Files">
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Root folder</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input value={form.threeMfFolder || ''} readOnly placeholder="No folder selected" style={{ flex: 1, fontSize: 12, fontFamily: 'monospace' }} />
                    <button className="btn" onClick={async () => { if (window.electronAPI?.pick3mfFolder) { const f = await window.electronAPI.pick3mfFolder(); if (f) setForm(x => ({ ...x, threeMfFolder: f })); } }}>Browse</button>
                  </div>
                </div>
              </Section>
            )}

            {isElectron && (
              <Section id="ssec-slicer" title="Slicer">
                <div className="field">
                  <label>Default slicer</label>
                  <select value={form.slicer || 'bambu'} onChange={e => setForm(f => ({ ...f, slicer: e.target.value }))}>
                    <option value="bambu">Bambu Studio</option>
                    <option value="orca">Orca Slicer</option>
                  </select>
                </div>
                <div className="field">
                  <label>Bambu Studio path <span className="settings-hint">(leave blank for default)</span></label>
                  <input value={form.bambuPath || ''} onChange={e => setForm(f => ({ ...f, bambuPath: e.target.value }))} placeholder="C:\Program Files\Bambu Studio\bambu-studio.exe" />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Orca Slicer path <span className="settings-hint">(leave blank for default)</span></label>
                  <input value={form.orcaPath || ''} onChange={e => setForm(f => ({ ...f, orcaPath: e.target.value }))} placeholder="C:\Program Files\OrcaSlicer\orca-slicer.exe" />
                </div>
              </Section>
            )}

            <Section id="ssec-inventory" title="Inventory">
              <div className="field" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" id="s-inv-popup" checked={form.invPopup !== false} onChange={e => setForm(f => ({ ...f, invPopup: e.target.checked }))} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                  <label htmlFor="s-inv-popup" style={{ marginBottom: 0, cursor: 'pointer', fontSize: 14 }}>Show <strong>+ inv</strong> button on product cards</label>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4, marginLeft: 26 }}>When off, the button is hidden from all product cards</div>
              </div>

              <div className="field">
                <label>Storage locations</label>
                {locs.map((loc, idx) => (
                  <div key={loc} className="cat-row">
                    <span className="cat-row-name">{esc(loc)}</span>
                    <button className="btn cat-row-btn" disabled={idx === 0} onClick={() => moveStorageLocation(loc, 'up')}>↑</button>
                    <button className="btn cat-row-btn" onClick={() => openModal('rename-cat', { oldName: loc, mode: 'storage', title: 'Rename Location' })}>Rename</button>
                    <button className="btn cat-row-btn cat-row-del" disabled={locs.length <= 1} onClick={() => { if (confirm(`Remove "${loc}"?`)) removeStorageLocation(loc); }}>✕</button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input value={newLoc} onChange={e => setNewLoc(e.target.value)} placeholder="New location name" style={{ flex: 1 }} onKeyDown={e => { if (e.key === 'Enter' && newLoc.trim()) { addStorageLocation(newLoc.trim()); setNewLoc(''); } }} />
                  <button className="btn btn-primary" onClick={() => { if (newLoc.trim()) { addStorageLocation(newLoc.trim()); setNewLoc(''); } }}>Add</button>
                </div>
              </div>

              <div className="field" style={{ marginBottom: 0 }}>
                <label>Outgoing destinations</label>
                {dests.map((dest, idx) => (
                  <div key={dest} className="cat-row">
                    <span className="cat-row-name">{esc(dest)}</span>
                    <button className="btn cat-row-btn" disabled={idx === 0} onClick={() => moveOutgoingDest(idx, 'up')}>↑</button>
                    <button className="btn cat-row-btn" onClick={() => openModal('rename-cat', { oldName: dest, idx, mode: 'dest', title: 'Rename Destination' })}>Rename</button>
                    <button className="btn cat-row-btn cat-row-del" onClick={() => { if (confirm(`Remove destination "${dest}"?`)) removeOutgoingDest(dest); }}>✕</button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input value={newDest} onChange={e => setNewDest(e.target.value)} placeholder="New destination name" style={{ flex: 1 }} onKeyDown={e => { if (e.key === 'Enter' && newDest.trim()) { addOutgoingDest(newDest.trim()); setNewDest(''); } }} />
                  <button className="btn btn-primary" onClick={() => { if (newDest.trim()) { addOutgoingDest(newDest.trim()); setNewDest(''); } }}>Add</button>
                </div>
              </div>
            </Section>

          </div>
          <div className="settings-footer">
            <button className="btn" onClick={closeModal}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
