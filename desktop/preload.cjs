const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  notify: (payload) => {
    try {
      ipcRenderer.send('ledgerflow:notify', payload);
    } catch (e) {
      // ignore
    }
  }
});
