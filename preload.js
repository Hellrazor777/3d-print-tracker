const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadData:            ()                          => ipcRenderer.invoke('load-data'),
  saveData:            (data)                      => ipcRenderer.invoke('save-data', data),
  openCsvDialog:       ()                          => ipcRenderer.invoke('open-csv-dialog'),
  saveCsvDialog:       (content)                   => ipcRenderer.invoke('save-csv-dialog', content),
  getLocalIP:          ()                          => ipcRenderer.invoke('get-local-ip'),
  n3dRequest:          (path, method, body, key)   => ipcRenderer.invoke('n3d-request', { path, method, body, apiKey: key }),
  onInventoryUpdated:  (cb)                        => ipcRenderer.on('inventory-updated', cb),
  loadSettings:        ()                          => ipcRenderer.invoke('load-settings'),
  saveSettings:        (s)                         => ipcRenderer.invoke('save-settings', s),
  pick3mfFolder:       ()                          => ipcRenderer.invoke('pick-3mf-folder'),
  upload3mf:           (productName, destFolder)   => ipcRenderer.invoke('upload-3mf', { productName, destFolder }),
  openFolder:          (folderPath)                => ipcRenderer.invoke('open-folder', folderPath),
  openInSlicer:        (filePath, slicer)          => ipcRenderer.invoke('open-in-slicer', { filePath, slicer }),
  getProductFolder:    (productName, rootFolder)   => ipcRenderer.invoke('get-product-folder', { productName, rootFolder }),
  createProductFolder: (productName, rootFolder)   => ipcRenderer.invoke('create-product-folder', { productName, rootFolder }),
  downloadImage:       (url, destFolder, fileName) => ipcRenderer.invoke('download-image', { url, destFolder, fileName }),
  uploadImage:         (destFolder, fileName)      => ipcRenderer.invoke('upload-image', { destFolder, fileName }),
  openExternal:        (url)                         => ipcRenderer.invoke('open-external', url),
});
