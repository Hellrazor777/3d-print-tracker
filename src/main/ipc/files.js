const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { dialog, shell } = require('electron');
const { execFile } = require('child_process');

module.exports = function registerFilesHandlers(ipcMain, mainWin, loadSettings) {
  // ── CSV dialogs ──
  ipcMain.handle('open-csv-dialog', async () => {
    const result = await dialog.showOpenDialog({ filters: [{ name: 'CSV', extensions: ['csv'] }], properties: ['openFile'] });
    if (result.canceled || !result.filePaths.length) return null;
    try { return fs.readFileSync(result.filePaths[0], 'utf8'); } catch(e) { return null; }
  });

  ipcMain.handle('save-csv-dialog', async (_, content) => {
    const result = await dialog.showSaveDialog({ defaultPath: '3d-print-export.csv', filters: [{ name: 'CSV', extensions: ['csv'] }] });
    if (result.canceled || !result.filePath) return false;
    try { fs.writeFileSync(result.filePath, content, 'utf8'); return true; } catch(e) { return false; }
  });

  // ── 3MF folder picker ──
  ipcMain.handle('pick-3mf-folder', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (result.canceled || !result.filePaths.length) return null;
    return result.filePaths[0];
  });

  // ── 3MF upload ──
  ipcMain.handle('upload-3mf', async (_, { productName, destFolder }) => {
    const result = await dialog.showOpenDialog({
      title: 'Select 3MF file',
      filters: [{ name: '3MF Files', extensions: ['3mf'] }, { name: 'All Files', extensions: ['*'] }],
      properties: ['openFile']
    });
    if (result.canceled || !result.filePaths.length) return null;
    const srcPath = result.filePaths[0];
    const fileName = path.basename(srcPath);
    const safeName = productName.replace(/[<>:"\/\\|?*]/g, '_');
    const productFolder = path.join(destFolder, safeName);
    if (!fs.existsSync(productFolder)) fs.mkdirSync(productFolder, { recursive: true });
    const destPath = path.join(productFolder, fileName);
    try { fs.copyFileSync(srcPath, destPath); return { fileName, destPath, productFolder }; }
    catch(e) { return { error: e.message }; }
  });

  // ── Open folder in Explorer ──
  ipcMain.handle('open-folder', async (_, folderPath) => {
    try { await shell.openPath(folderPath); return true; }
    catch(e) { return false; }
  });

  // ── Get/create product folder ──
  ipcMain.handle('get-product-folder', (_, { productName, rootFolder }) => {
    if (!rootFolder) return null;
    const safeName = productName.replace(/[<>:"\/\\|?*]/g, '_');
    const folderPath = path.join(rootFolder, safeName);
    try { if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true }); }
    catch(e) { console.error('Could not create folder:', e.message); }
    return folderPath;
  });

  // ── Create product folder on product creation ──
  ipcMain.handle('create-product-folder', (_, { productName, rootFolder }) => {
    if (!rootFolder || !productName) return null;
    const safeName = productName.replace(/[<>:"\/\\|?*]/g, '_');
    const folderPath = path.join(rootFolder, safeName);
    try {
      if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
      return folderPath;
    } catch(e) { return null; }
  });

  // ── Open file or folder in slicer ──
  ipcMain.handle('open-in-slicer', async (_, { filePath, slicer }) => {
    const settings = loadSettings();
    const slicerPath = slicer === 'bambu'
      ? (settings.bambuPath || 'C:\\Program Files\\Bambu Studio\\bambu-studio.exe')
      : (settings.orcaPath || 'C:\\Program Files\\OrcaSlicer\\orca-slicer.exe');

    let targetFile = filePath;
    try {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        const files = fs.readdirSync(filePath).filter(f => f.toLowerCase().endsWith('.3mf'));
        if (files.length > 0) targetFile = path.join(filePath, files[0]);
        else { await shell.openPath(filePath); return { ok: true, fallback: true }; }
      }
    } catch(e) {}

    try {
      if (fs.existsSync(slicerPath)) {
        execFile(slicerPath, [targetFile], { detached: true });
        return { ok: true };
      } else {
        await shell.openPath(targetFile);
        return { ok: true, fallback: true };
      }
    } catch(e) { return { ok: false, error: e.message }; }
  });

  // ── Image download (for N3D thumbnails) ──
  ipcMain.handle('download-image', async (_, { url, destFolder, fileName }) => {
    try {
      if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder, { recursive: true });
      const destPath = path.join(destFolder, fileName);
      await new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(destPath);
        lib.get(url, res => {
          if (res.statusCode === 301 || res.statusCode === 302) {
            file.close();
            const downloadImageFn = require('./files').downloadImage;
            return resolve(downloadImageFn({ url: res.headers.location, destFolder, fileName }));
          }
          res.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
          file.on('error', reject);
        }).on('error', reject);
      });
      return { ok: true, destPath };
    } catch(e) { return { ok: false, error: e.message }; }
  });

  // ── Image upload (manual product image) ──
  ipcMain.handle('upload-image', async (_, { destFolder, fileName }) => {
    const result = await dialog.showOpenDialog({
      title: 'Select product image',
      filters: [{ name: 'Images', extensions: ['jpg','jpeg','png','webp','gif'] }],
      properties: ['openFile']
    });
    if (result.canceled || !result.filePaths.length) return null;
    const srcPath = result.filePaths[0];
    const ext = path.extname(srcPath);
    const dest = path.join(destFolder, (fileName || 'cover') + ext);
    try {
      if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder, { recursive: true });
      fs.copyFileSync(srcPath, dest);
      return { ok: true, destPath: dest };
    } catch(e) { return { ok: false, error: e.message }; }
  });

  // ── Open external URL in browser ──
  ipcMain.handle('open-external', async (_, url) => {
    try { await shell.openExternal(url); return true; }
    catch(e) { return false; }
  });
};
