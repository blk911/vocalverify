const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('trayAPI', {
  init: (cb) => ipcRenderer.on('prompt:init', (_e, payload) => cb(payload)),
  decide: (id, choice) => ipcRenderer.send(`prompt:decision:${id}`, choice),
});
