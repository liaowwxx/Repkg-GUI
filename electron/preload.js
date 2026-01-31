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
  setWallpaper: (filePath) => ipcRenderer.invoke('set-wallpaper', filePath),
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
