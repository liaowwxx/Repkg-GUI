const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  runRepkg: (args) => ipcRenderer.invoke('run-repkg', args),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  onRepkgOutput: (callback) => {
    ipcRenderer.on('repkg-output', (event, data) => callback(data));
  },
  removeRepkgOutputListener: () => {
    ipcRenderer.removeAllListeners('repkg-output');
  },
});

console.log('[Preload] electronAPI 已成功暴露到 window 对象');
