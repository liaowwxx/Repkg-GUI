import { app, BrowserWindow, ipcMain, dialog, protocol, net, shell } from 'electron';
import { spawn, exec } from 'child_process';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import os from 'os';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IS_MAC = process.platform === 'darwin';
const IS_WINDOWS = process.platform === 'win32';

// 缓存目录路径
let cacheDir = null;

function getCacheDir(baseDir) {
  if (!cacheDir && baseDir) {
    cacheDir = path.join(baseDir, 'cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
  }
  return cacheDir;
}

// 清理缓存
function cleanupCache() {
  if (currentWallpaperProcess) {
    currentWallpaperProcess.kill('SIGKILL');
    currentWallpaperProcess = null;
  }
  if (cacheDir && fs.existsSync(cacheDir)) {
    try {
      console.log('正在清理缓存:', cacheDir);
      fs.rmSync(cacheDir, { recursive: true, force: true });
    } catch (err) {
      console.error('清理缓存失败:', err);
    }
  }
}

// 注册自定义协议以处理本地图片预览，支持流式传输以播放视频
protocol.registerSchemesAsPrivileged([
  { scheme: 'repkg-thumb', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, bypassCSP: true } }
]);

// 获取资源目录路径
function getResourcesPath() {
  if (app.isPackaged) {
    // 在打包后的应用中，资源文件在 extraResources 目录
    // Windows: process.resourcesPath 指向 resources 目录（extraResources 的位置）
    // macOS: process.resourcesPath 指向 .app/Contents/Resources
    let resourcesPath = path.join(process.resourcesPath, 'resources');
    
    console.log('打包模式 - 资源路径检查:');
    console.log('  process.resourcesPath:', process.resourcesPath);
    console.log('  预期资源路径:', resourcesPath);
    console.log('  资源目录存在:', fs.existsSync(resourcesPath));
    
    // macOS 特定处理
    if (IS_MAC) {
      // 在 macOS 上，extraResources 会被放在 .app/Contents/Resources/
      // 所以 resources 目录应该在 process.resourcesPath/resources/
      if (fs.existsSync(resourcesPath)) {
        console.log('✅ macOS: 找到资源目录');
        return resourcesPath;
      }
      
      // 如果标准路径不存在，尝试直接检查 process.resourcesPath
      if (fs.existsSync(process.resourcesPath)) {
        const dirs = fs.readdirSync(process.resourcesPath);
        console.log('  Resources 目录内容:', dirs);
        
        // 检查 resources 是否直接在 Resources 下
        const directResources = path.join(process.resourcesPath, 'resources');
        if (fs.existsSync(directResources)) {
          console.log('✅ macOS: 使用直接资源路径');
          return directResources;
        }
      }
      
      // 尝试相对于 app 的路径
      const appPath = app.getAppPath();
      const altPath = path.join(path.dirname(appPath), '..', 'Resources', 'resources');
      console.log('  尝试备用路径:', altPath);
      if (fs.existsSync(altPath)) {
        console.log('✅ macOS: 使用备用资源路径');
        return altPath;
      }
    }
    
    // Windows 特定处理
    if (IS_WINDOWS) {
      // Windows 上，extraResources 可能在 process.resourcesPath 下
      if (fs.existsSync(resourcesPath)) {
        console.log('✅ Windows: 找到资源目录');
        return resourcesPath;
      }
      
      // 尝试直接在 process.resourcesPath
      if (fs.existsSync(process.resourcesPath)) {
        console.log('✅ Windows: 使用 process.resourcesPath 作为资源路径');
        return process.resourcesPath;
      }
      
      // 尝试相对于 exe 文件的路径
      const exeDir = path.dirname(process.execPath);
      const altPath = path.join(exeDir, 'resources');
      if (fs.existsSync(altPath)) {
        console.log('✅ Windows: 使用备用资源路径');
        return altPath;
      }
    }
    
    console.warn('⚠️ 警告: 未找到资源目录，使用预期路径:', resourcesPath);
    return resourcesPath;
  }
  // 开发模式
  const devPath = path.join(__dirname, '..', 'resources');
  console.log('开发模式 - 资源路径:', devPath);
  return devPath;
}

// 获取可执行文件路径
function getExecutablePath() {
  const resourcesPath = getResourcesPath();
  console.log('获取可执行文件路径，资源目录:', resourcesPath);
  
  if (IS_WINDOWS) {
    // Windows 版本：优先使用 win-x64 目录
    const winPath = path.join(resourcesPath, 'win-x64', 'RePKG.exe');
    console.log('Windows 路径:', winPath);
    console.log('Windows 路径存在:', fs.existsSync(winPath));
    
    if (fs.existsSync(winPath)) {
      return winPath;
    }
    
    // 如果 win-x64 不存在，列出资源目录内容以便调试
    if (fs.existsSync(resourcesPath)) {
      try {
        const dirs = fs.readdirSync(resourcesPath);
        console.log('资源目录内容:', dirs);
      } catch (e) {
        console.error('无法读取资源目录:', e);
      }
    } else {
      console.error('资源目录不存在:', resourcesPath);
    }
    
    // 如果 win-x64 不存在，尝试 osx-arm64（仅用于开发/测试）
    const fallbackPath = path.join(resourcesPath, 'osx-arm64', 'RePKG.exe');
    if (fs.existsSync(fallbackPath)) {
      console.warn('警告: 使用 osx-arm64 目录的 RePKG.exe，建议使用 win-x64 目录');
      return fallbackPath;
    }
    
    // 如果都不存在，返回预期的 Windows 路径（即使不存在也会返回，让调用者处理错误）
    console.error('错误: 找不到 RePKG.exe，预期路径:', winPath);
    return winPath;
  }
  // macOS 版本
  const macPath = path.join(resourcesPath, 'osx-arm64', 'RePKG');
  console.log('macOS 路径:', macPath);
  console.log('macOS 路径存在:', fs.existsSync(macPath));
  return macPath;
}

let mainWindow;
let currentRepkgProcess = null;
let currentWallpaperProcess = null;

function createWindow() {
  // 获取 preload 脚本路径
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('Preload 脚本路径:', preloadPath);
  console.log('Preload 文件存在:', fs.existsSync(preloadPath));

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      allowRunningInsecureContent: true, // 允许跨协议加载资源
    },
    titleBarStyle: IS_MAC ? 'hiddenInset' : 'default',
    backgroundColor: '#f8fafc',
  });

  // 监听页面加载完成
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('页面加载完成');
  });

  // 监听页面加载错误
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('页面加载失败:', errorCode, errorDescription);
    if (!app.isPackaged) {
      // 开发模式下，等待 Vite 服务器启动
      setTimeout(() => {
        mainWindow.loadURL('http://localhost:5173');
      }, 2000);
    }
  });

  // 监听控制台消息
  mainWindow.webContents.on('console-message', (event, level, message) => {
    console.log(`[Renderer ${level}]:`, message);
  });

  if (app.isPackaged) {
    const appPath = app.getAppPath();
    const indexPath = path.join(appPath, 'dist', 'index.html');
    console.log('打包模式 - 应用根目录:', appPath);
    console.log('打包模式 - 预期 HTML 路径:', indexPath);
    
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath).catch((err) => {
        console.error('加载 HTML 文件失败:', err);
      });
    } else {
      console.error('错误: 找不到 HTML 文件:', indexPath);
      // 尝试备用路径（针对某些打包配置）
      const altIndexPath = path.join(__dirname, '..', 'dist', 'index.html');
      console.log('尝试备用 HTML 路径:', altIndexPath);
      mainWindow.loadFile(altIndexPath).catch((err) => {
        console.error('加载备用 HTML 文件失败:', err);
        mainWindow.webContents.executeJavaScript(`
          document.body.innerHTML = '<div style="padding: 20px; color: red;"><h1>启动错误</h1><p>无法找到应用页面文件。</p><p>路径: ${indexPath.replace(/\\/g, '/')}</p></div>';
        `);
      });
    }
  } else {
    console.log('开发模式: 连接到 http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173').catch((err) => {
      console.error('加载 URL 失败:', err);
      // 如果 Vite 服务器还没启动，显示提示
      mainWindow.webContents.executeJavaScript(`
        document.body.innerHTML = '<div style="padding: 20px; text-align: center;"><h1>等待 Vite 服务器启动...</h1><p>请确保运行了 npm run electron:dev</p></div>';
      `);
    });
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // 处理自定义协议请求
  protocol.handle('repkg-thumb', (request) => {
    try {
      const url = new URL(request.url);
      // 解码路径并规范化
      let filePath = decodeURIComponent(url.pathname);
      
      // 处理 macOS/Linux 下可能出现的双斜杠问题
      if (!IS_WINDOWS) {
        // 如果路径以 // 开头（常见于 repkg-thumb://local//Users/...），将其替换为单斜杠
        filePath = filePath.replace(/^\/\//, '/');
      } else {
        // Windows 处理：去掉开头的斜杠以获得 C:/... 格式
        if (filePath.startsWith('/')) {
          filePath = filePath.slice(1);
        }
      }
      
      // 验证文件是否存在
      if (!fs.existsSync(filePath)) {
        console.error('协议请求的文件不存在:', filePath);
        return new Response('Not Found', { status: 404 });
      }

      const fileUrl = pathToFileURL(filePath).toString();
      return net.fetch(fileUrl);
    } catch (err) {
      console.error('协议处理失败:', err);
      return new Response('Error', { status: 500 });
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  cleanupCache();
});

app.on('window-all-closed', () => {
  if (!IS_MAC) {
    app.quit();
  }
});

// IPC 处理程序
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'PKG/TEX Files', extensions: ['pkg', 'tex'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('run-repkg', async (event, args) => {
  if (currentRepkgProcess) {
    return { code: -1, stderr: '已有正在运行的进程' };
  }

  return new Promise((resolve, reject) => {
    const executable = getExecutablePath();
    
    // ... (rest of the checks)
    if (!fs.existsSync(executable)) {
      const errorMsg = `找不到 RePKG 可执行文件: ${executable}\n请确保 resources/${IS_WINDOWS ? 'win-x64' : 'osx-arm64'}/ 目录存在且包含 RePKG${IS_WINDOWS ? '.exe' : ''} 文件`;
      console.error(errorMsg);
      reject(new Error(errorMsg));
      return;
    }
    
    const executableDir = path.dirname(executable);
    const executableName = path.basename(executable);
    
    const cmdPrefix = IS_WINDOWS ? '' : './';
    const fullCmd = `${cmdPrefix}${executableName}`;

    currentRepkgProcess = spawn(fullCmd, args, {
      cwd: executableDir,
      shell: false,
    });

    let stdout = '';
    let stderr = '';

    currentRepkgProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      event.sender.send('repkg-output', data.toString());
    });

    currentRepkgProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      event.sender.send('repkg-output', data.toString());
    });

    currentRepkgProcess.on('close', (code) => {
      currentRepkgProcess = null;
      resolve({
        code,
        stdout,
        stderr,
      });
    });

    currentRepkgProcess.on('error', (error) => {
      currentRepkgProcess = null;
      reject(error);
    });
  });
});

ipcMain.handle('stop-repkg', () => {
  if (currentRepkgProcess) {
    if (IS_WINDOWS) {
      // Windows 下使用 taskkill 确保杀死整个进程树
      spawn('taskkill', ['/pid', currentRepkgProcess.pid, '/f', '/t']);
    } else {
      currentRepkgProcess.kill('SIGKILL');
    }
    currentRepkgProcess = null;
    return true;
  }
  return false;
});

ipcMain.handle('get-platform', () => {
  return {
    platform: process.platform,
    isMac: IS_MAC,
    isWindows: IS_WINDOWS,
  };
});

ipcMain.handle('scan-wallpapers', async (event, dirPath) => {
  if (!dirPath || !fs.existsSync(dirPath)) return [];
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const wallpapers = [];
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subPath = path.join(dirPath, entry.name);
        // 检查目录是否存在且可读
        try {
          const subEntries = fs.readdirSync(subPath);
          
          let previewPath = null;
          if (subEntries.includes('preview.jpg')) {
            previewPath = path.join(subPath, 'preview.jpg');
          } else if (subEntries.includes('preview.gif')) {
            previewPath = path.join(subPath, 'preview.gif');
          }
          
          if (previewPath) {
            // 找到第一个 pkg 文件
            const pkgFile = subEntries.find(file => file.toLowerCase().endsWith('.pkg'));
            const hasPkg = !!pkgFile;
            
            // 读取 project.json
            let projectInfo = {};
            const projectJsonPath = path.join(subPath, 'project.json');
            if (fs.existsSync(projectJsonPath)) {
              try {
                const content = fs.readFileSync(projectJsonPath, 'utf8');
                projectInfo = JSON.parse(content);
              } catch (err) {
                console.error(`解析 project.json 失败 (${subPath}):`, err);
              }
            }

            // 使用更标准的 URL 构造方式：repkg-thumb://local/PATH
            const previewUrl = `repkg-thumb://local/${previewPath}`;
            
            const wallpaper = {
              id: entry.name,
              name: entry.name,
              title: projectInfo.title || entry.name,
              type: projectInfo.type || 'unknown',
              contentrating: projectInfo.contentrating || 'Everyone',
              description: projectInfo.description || '',
              path: subPath,
              pkgPath: hasPkg ? path.join(subPath, pkgFile) : null, // 记录具体的 pkg 路径
              preview: previewUrl,
              isPkg: hasPkg,
            };

            // 发送单个壁纸发现事件
            event.sender.send('wallpaper-found', wallpaper);
            wallpapers.push(wallpaper);
          }
        } catch (subErr) {
          console.error(`访问子目录失败 (${subPath}):`, subErr);
        }
      }
    }
    return wallpapers;
  } catch (error) {
    console.error('扫描壁纸出错:', error);
    return [];
  }
});

ipcMain.handle('copy-directory', async (event, { srcPath, destDir, customName }) => {
  if (!fs.existsSync(srcPath) || !destDir) return { success: false, error: '路径不存在' };
  
  try {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    const baseName = customName || path.basename(srcPath);
    const targetPath = path.join(destDir, baseName);
    
    // Node.js 16.7.0+ has fs.cpSync
    if (fs.cpSync) {
      fs.cpSync(srcPath, targetPath, { recursive: true });
    } else {
      // 递归复制函数
      const copyRecursiveSync = (src, dest) => {
        const stats = fs.statSync(src);
        if (stats.isDirectory()) {
          if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
          }
          fs.readdirSync(src).forEach((child) => {
            copyRecursiveSync(path.join(src, child), path.join(dest, child));
          });
        } else {
          fs.copyFileSync(src, dest);
        }
      };
      copyRecursiveSync(srcPath, targetPath);
    }
    
    return { success: true, targetPath };
  } catch (error) {
    console.error('复制目录出错:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('copy-wallpaper-assets', async (event, { srcPath, destDir }) => {
  if (!fs.existsSync(srcPath) || !destDir) return { success: false, error: '路径不存在' };
  
  try {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    const assetExtensions = ['.png', '.jpg', '.jpeg', '.mp4'];
    let copiedCount = 0;
    
    // 递归搜索文件
    function scanAndCopy(currentSrc, currentDest) {
      const entries = fs.readdirSync(currentSrc, { withFileTypes: true });
      
      for (const entry of entries) {
        const srcFullPath = path.join(currentSrc, entry.name);
        
        if (entry.isDirectory()) {
          // 如果是目录，递归处理
          const destSubDir = path.join(currentDest, entry.name);
          // 只有当该目录下可能有资源时才创建目录（或者直接按需创建）
          scanAndCopy(srcFullPath, destSubDir);
        } else {
          // 如果是文件，检查扩展名
          const ext = path.extname(entry.name).toLowerCase();
          if (assetExtensions.includes(ext)) {
            // 确保目标子目录存在
            if (!fs.existsSync(currentDest)) {
              fs.mkdirSync(currentDest, { recursive: true });
            }
            const destFullPath = path.join(currentDest, entry.name);
            fs.copyFileSync(srcFullPath, destFullPath);
            copiedCount++;
          }
        }
      }
    }
    
    scanAndCopy(srcPath, destDir);
    
    return { success: true, copiedCount };
  } catch (error) {
    console.error('递归复制资源出错:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-path', async (event, filePath) => {
  if (!filePath || !fs.existsSync(filePath)) return { success: false, error: '路径不存在' };
  try {
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    console.error('打开路径失败:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-cache-dir', (event, baseDir) => {
  return getCacheDir(baseDir);
});

ipcMain.handle('ensure-dir', (event, dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return true;
});

ipcMain.handle('get-largest-assets', async (event, dirPath) => {
  if (!dirPath || !fs.existsSync(dirPath)) return [];
  
  const assetExtensions = ['.png', '.jpg', '.jpeg', '.mp4'];
  const assets = [];
  
  function scan(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (assetExtensions.includes(ext)) {
          const stats = fs.statSync(fullPath);
          assets.push({
            name: entry.name,
            path: fullPath,
            size: stats.size,
            ext: ext
          });
        }
      }
    }
  }
  
  try {
    scan(dirPath);
    // 按大小降序排序并取前 5 个
    return assets.sort((a, b) => b.size - a.size).slice(0, 15);
  } catch (error) {
    console.error('获取最大资源出错:', error);
    return [];
  }
});

ipcMain.handle('set-wallpaper', async (event, filePath) => {
  if (!filePath || !fs.existsSync(filePath)) return { success: false, error: '文件不存在' };
  
  if (IS_MAC) {
    // 无论设置什么类型的壁纸，都先停止当前正在运行的视频壁纸进程
    if (currentWallpaperProcess) {
      console.log('停止当前视频壁纸进程');
      currentWallpaperProcess.kill('SIGKILL');
      currentWallpaperProcess = null;
    }

    const ext = path.extname(filePath).toLowerCase();
    const isVideo = ext === '.mp4' || ext === '.mov';
    
    if (isVideo) {
      try {
        const resourcesPath = getResourcesPath();
        const playerPath = path.join(resourcesPath, 'bin', 'WallpaperPlayer');
        
        if (!fs.existsSync(playerPath)) {
          return { success: false, error: '找不到视频壁纸播放组件，请检查 resources/bin/WallpaperPlayer 是否存在' };
        }

        console.log('启动视频壁纸播放器:', playerPath, '视频:', filePath);
        currentWallpaperProcess = spawn(playerPath, [filePath]);
        
        currentWallpaperProcess.on('error', (err) => {
          console.error('视频壁纸播放器启动错误:', err);
        });

        return { success: true, isVideo: true };
      } catch (err) {
        return { success: false, error: `启动视频播放器失败: ${err.message}` };
      }
    } else {
      // 静态图片壁纸 - 改用 Finder 逻辑，在现代 macOS 上更稳定
      const script = `tell application "Finder" to set desktop picture to POSIX file "${filePath}"`;
      return new Promise((resolve) => {
        exec(`osascript -e '${script}'`, (error) => {
          if (error) {
            console.error('设置壁纸失败:', error);
            // 备选方案：如果 Finder 失败，尝试 System Events 的另一种写法
            const backupScript = `tell application "System Events" to tell every desktop to set picture to "${filePath}"`;
            exec(`osascript -e '${backupScript}'`, (backupError) => {
              if (backupError) {
                resolve({ success: false, error: backupError.message });
              } else {
                resolve({ success: true });
              }
            });
          } else {
            resolve({ success: true });
          }
        });
      });
    }
  } else if (IS_WINDOWS) {
    return { success: false, error: '目前仅支持 macOS 设置壁纸' };
  }
  
  return { success: false, error: '不支持的平台' };
});
