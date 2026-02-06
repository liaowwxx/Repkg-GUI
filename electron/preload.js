const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  runRepkg: (args) => ipcRenderer.invoke('run-repkg', args),
  stopRepkg: () => ipcRenderer.invoke('stop-repkg'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  scanWallpapers: (dirPath) => ipcRenderer.invoke('scan-wallpapers', dirPath),
  copyDirectory: (data) => ipcRenderer.invoke('copy-directory', data),
  copyWallpaperAssets: (data) => ipcRenderer.invoke('copy-wallpaper-assets', data),
  openPath: (filePath) => ipcRenderer.invoke('open-path', filePath),
  getCacheDir: (baseDir) => ipcRenderer.invoke('get-cache-dir', baseDir),
  ensureDir: (dirPath) => ipcRenderer.invoke('ensure-dir', dirPath),
  getLargestAssets: (dirPath) => ipcRenderer.invoke('get-largest-assets', dirPath),
  setWallpaper: (filePath, options) => ipcRenderer.invoke('set-wallpaper', filePath, options),
  updateWallpaperCollections: (data) => ipcRenderer.invoke('update-wallpaper-collections', data),
  deleteCollection: (data) => ipcRenderer.invoke('delete-collection', data),
  
  // NL Search
  checkNLStatus: (dirPath) => ipcRenderer.invoke('check-nl-status', dirPath),
  updateNLDB: (data) => ipcRenderer.invoke('update-nl-db', data),
  vectorSearch: (data) => ipcRenderer.invoke('vector-search', data),
  rerankResults: (data) => ipcRenderer.invoke('rerank-results', data),
  clearNLDescriptions: (dirPath) => ipcRenderer.invoke('clear-nl-descriptions', dirPath),
  onNLProgress: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('nl-progress', subscription);
    return () => ipcRenderer.removeListener('nl-progress', subscription);
  },
  removeNLProgressListener: () => {
    ipcRenderer.removeAllListeners('nl-progress');
  },

  onRepkgOutput: (callback) => {
    ipcRenderer.on('repkg-output', (event, data) => callback(data));
  },
  onWallpaperFound: (callback) => {
    ipcRenderer.on('wallpaper-found', (event, data) => callback(data));
  },
  removeWallpaperFoundListener: () => {
    ipcRenderer.removeAllListeners('wallpaper-found');
  },
  removeRepkgOutputListener: () => {
    ipcRenderer.removeAllListeners('repkg-output');
  },
});

console.log('[Preload] electronAPI 已成功暴露到 window 对象');
