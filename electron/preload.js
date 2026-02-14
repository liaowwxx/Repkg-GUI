const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectTaggerModel: () => ipcRenderer.invoke('select-tagger-model'),
  getTaggerTags: (modelDir) => ipcRenderer.invoke('get-tagger-tags', modelDir),
  runPreviewTagger: (opts) => ipcRenderer.invoke('run-preview-tagger', opts),
  onTaggerProgress: (callback) => {
    ipcRenderer.on('tagger-progress', (event, data) => callback(data));
  },
  removeTaggerProgressListener: () => {
    ipcRenderer.removeAllListeners('tagger-progress');
  },
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
  saveBase64AsTemp: (base64Data) => ipcRenderer.invoke('save-base64-as-temp', base64Data),
  saveAssetToSavedRes: (data) => ipcRenderer.invoke('save-asset-to-saved-res', data),
  updateWallpaperCollections: (data) => ipcRenderer.invoke('update-wallpaper-collections', data),
  deleteCollection: (data) => ipcRenderer.invoke('delete-collection', data),
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
