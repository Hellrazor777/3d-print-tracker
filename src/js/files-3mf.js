// ── 3MF FILE HANDLING ──
async function uploadProduct3mf(productName) {
  if (!window.electronAPI) return;
  if (!appSettings.threeMfFolder) { alert('Please set your 3MF folder in Settings first.'); openSettings(); return; }
  const result = await window.electronAPI.upload3mf(productName, appSettings.threeMfFolder);
  if (!result || result.error) { if (result?.error) alert('Upload failed: ' + result.error); return; }
  if (!products[productName]) products[productName] = { category: '' };
  if (!products[productName].threeMfFiles) products[productName].threeMfFiles = [];
  if (!products[productName].threeMfFiles.includes(result.fileName)) {
    products[productName].threeMfFiles.push(result.fileName);
  }

  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:200';
  const inner = document.createElement('div');
  inner.style.cssText = 'background:var(--bg);border:0.5px solid var(--border2);border-radius:var(--radius-lg);padding:1.5rem;width:320px;max-width:95vw';
  inner.innerHTML =
    '<h3 style="font-size:16px;font-weight:600;margin-bottom:8px;color:var(--text)">3MF uploaded</h3>' +
    '<p style="font-size:13px;color:var(--text2);margin-bottom:1rem;line-height:1.5"><strong style="color:var(--text)">' + result.fileName + '</strong> has been saved to the product folder.</p>' +
    '<div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--bg2);border-radius:var(--radius);border:0.5px solid var(--border2);cursor:pointer" id="presliced-toggle">' +
      '<div id="presliced-check" style="width:20px;height:20px;border-radius:4px;border:2px solid var(--border2);background:transparent;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px"></div>' +
      '<div><div style="font-size:13px;font-weight:500;color:var(--text)">pre-sliced and ready to print</div><div style="font-size:11px;color:var(--text2);margin-top:2px">tick if this file is ready to send to the printer</div></div>' +
    '</div>' +
    '<div style="display:flex;gap:8px;margin-top:1rem;justify-content:flex-end">' +
      '<button class="btn btn-primary" id="presliced-save" style="flex:1">save</button>' +
    '</div>';
  modal.appendChild(inner);
  document.body.appendChild(modal);

  let isPresliced = false;
  document.getElementById('presliced-toggle').addEventListener('click', () => {
    isPresliced = !isPresliced;
    const chk = document.getElementById('presliced-check');
    chk.style.background = isPresliced ? 'var(--green)' : 'transparent';
    chk.style.borderColor = isPresliced ? 'var(--green)' : 'var(--border2)';
    chk.textContent = isPresliced ? '✓' : '';
    chk.style.color = 'white';
  });
  document.getElementById('presliced-save').addEventListener('click', async () => {
    products[productName].preSliced = isPresliced;
    modal.remove();
    await persist(); render();
  });
}

async function autoCreateProductFolder(productName) {
  if (!window.electronAPI || !appSettings.threeMfFolder || !productName) return;
  try { await window.electronAPI.createProductFolder(productName, appSettings.threeMfFolder); }
  catch(e) {}
}

function productHas3mf(productName) {
  return !!(products[productName]?.threeMfFiles && products[productName].threeMfFiles.length);
}

async function openProductFolder(productName) {
  if (!window.electronAPI) return;
  if (!appSettings.threeMfFolder) { alert('Please set your 3MF folder in Settings first.'); openSettings(); return; }
  const folder = await window.electronAPI.getProductFolder(productName, appSettings.threeMfFolder);
  if (folder) await window.electronAPI.openFolder(folder);
}

async function openProductInSlicer(productName) {
  if (!window.electronAPI) return;
  if (!appSettings.threeMfFolder) { alert('Please set your 3MF folder in Settings first.'); openSettings(); return; }
  const folder = await window.electronAPI.getProductFolder(productName, appSettings.threeMfFolder);
  if (!folder) return;
  const result = await window.electronAPI.openInSlicer(folder, appSettings.slicer || 'bambu');
  if (result && !result.ok) alert('Could not open slicer: ' + (result.error || 'unknown error'));
}

async function ensureProductFolder(productName) {
  if (!window.electronAPI || !appSettings.threeMfFolder) return;
  await window.electronAPI.getProductFolder(productName, appSettings.threeMfFolder);
  try { await window.electronAPI.openFolder('__create__' + productName + '__' + appSettings.threeMfFolder); } catch(e) {}
}
