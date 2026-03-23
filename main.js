const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const DATA_PATH = path.join(app.getPath('userData'), 'data.json');
const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json');
const PORT = 3000;
let localServer = null;
let mainWin = null;
let actualPort = PORT;

// Import IPC and server modules
const registerDataHandlers = require('./src/main/ipc/data');
const registerFilesHandlers = require('./src/main/ipc/files');
const registerN3dHandlers = require('./src/main/ipc/n3d');
const startLocalServer = require('./src/main/server');
const dataModule = require('./src/main/ipc/data');

function createWindow() {
  mainWin = new BrowserWindow({
    width: 1280, height: 800, minWidth: 800, minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'build-resources', 'icon.ico'),
    title: '3D Print Tracker',
  });
  mainWin.loadFile(path.join(__dirname, 'src', 'index.html'));
  mainWin.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();

  // Register IPC handlers (getPort returns actual bound port after server starts)
  registerDataHandlers(ipcMain, DATA_PATH, SETTINGS_PATH, () => actualPort);
  registerFilesHandlers(ipcMain, mainWin, dataModule.loadSettings.bind(null, SETTINGS_PATH));
  registerN3dHandlers(ipcMain);

  // Start local server — auto-retries on EADDRINUSE, updates actualPort when bound
  localServer = startLocalServer(PORT, DATA_PATH, mainWin, (port) => { actualPort = port; });

  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => {
  if (localServer) localServer.close();
  if (process.platform !== 'darwin') app.quit();
});
