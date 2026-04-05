const fs   = require('fs');
const os   = require('os');
const path = require('path');
const db   = require('../db');

function getLocalIP() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
}

module.exports = function registerDataHandlers(ipcMain, DATA_PATH, SETTINGS_PATH, getPort) {
  // ── Data persistence ──
  ipcMain.handle('load-data', () => db.loadData(DATA_PATH, fs));

  ipcMain.handle('save-data', (_, data) => db.saveData(data, DATA_PATH, fs));

  ipcMain.handle('get-local-ip', () => getLocalIP() + ':' + (typeof getPort === 'function' ? getPort() : getPort));

  // ── Settings ──
  ipcMain.handle('load-settings', () => db.loadSettings(SETTINGS_PATH, fs));
  ipcMain.handle('save-settings', (_, s) => db.saveSettings(s, SETTINGS_PATH, fs));
};

module.exports.getLocalIP = getLocalIP;
module.exports.loadSettings = (SETTINGS_PATH) => db.loadSettings(SETTINGS_PATH, fs);
module.exports.saveSettings = (SETTINGS_PATH, s) => db.saveSettings(s, SETTINGS_PATH, fs);
