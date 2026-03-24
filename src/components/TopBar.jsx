import { useApp } from '../context/AppContext';

export default function TopBar() {
  const { currentView, setView, openModal, exportData } = useApp();

  return (
    <div className="topbar">
      <h1>3D Print Tracker</h1>
      <div className="view-toggle">
        <button id="vb-product"   className={`view-btn${currentView === 'product'   ? ' active' : ''}`} onClick={() => setView('product')}>Products</button>
        <button id="vb-archive"   className={`view-btn${currentView === 'archive'   ? ' active' : ''}`} onClick={() => setView('archive')}>Archive</button>
        <button id="vb-colours"   className={`view-btn${currentView === 'colours'   ? ' active' : ''}`} onClick={() => setView('colours')}>Colour</button>
        <button id="vb-inventory" className={`view-btn${currentView === 'inventory' ? ' active' : ''}`} onClick={() => setView('inventory')}>Inventory</button>
      </div>
      <button className="btn" onClick={() => openModal('settings')} title="settings">⚙ Settings</button>
      <button className="btn" onClick={() => openModal('n3d')} style={{ borderColor: '#7f77dd', color: '#3c3489' }}>N3D browse</button>
      <button className="btn" onClick={() => openModal('import', { mode: 'import' })}>↑ Import CSV</button>
      <button className="btn" onClick={exportData}>↓ Export CSV</button>
      <button className="btn" onClick={() => openModal('add-product')}>+ Add Product</button>
    </div>
  );
}
