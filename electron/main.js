import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IS_MAC = process.platform === 'darwin';
const IS_WINDOWS = process.platform === 'win32';

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
      webSecurity: true,
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
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
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
  return new Promise((resolve, reject) => {
    const executable = getExecutablePath();
    
    // 检查可执行文件是否存在
    if (!fs.existsSync(executable)) {
      const errorMsg = `找不到 RePKG 可执行文件: ${executable}\n请确保 resources/${IS_WINDOWS ? 'win-x64' : 'osx-arm64'}/ 目录存在且包含 RePKG${IS_WINDOWS ? '.exe' : ''} 文件`;
      console.error(errorMsg);
      reject(new Error(errorMsg));
      return;
    }
    
    const executableDir = path.dirname(executable);
    const executableName = path.basename(executable);
    
    console.log('执行 RePKG:');
    console.log('  可执行文件:', executable);
    console.log('  工作目录:', executableDir);
    console.log('  命令参数:', args);

    // 在 macOS 上确保有执行权限
    if (IS_MAC) {
      try {
        fs.chmodSync(executable, 0o755);
      } catch (e) {
        console.warn('无法设置执行权限:', e);
      }
    }

    const cmdPrefix = IS_WINDOWS ? '' : './';
    const fullCmd = `${cmdPrefix}${executableName}`;

    const process = spawn(fullCmd, args, {
      cwd: executableDir,
      shell: false,
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
      // 实时发送输出
      event.sender.send('repkg-output', data.toString());
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
      event.sender.send('repkg-output', data.toString());
    });

    process.on('close', (code) => {
      resolve({
        code,
        stdout,
        stderr,
      });
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
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
        const subEntries = fs.readdirSync(subPath);
        
        let previewPath = null;
        if (subEntries.includes('preview.jpg')) {
          previewPath = path.join(subPath, 'preview.jpg');
        } else if (subEntries.includes('preview.gif')) {
          previewPath = path.join(subPath, 'preview.gif');
        }
        
        if (previewPath) {
          // 检查是否有 pkg 文件
          const hasPkg = subEntries.some(file => file.toLowerCase().endsWith('.pkg'));
          
          // 将图片转换为 base64 以便在前端显示
          const imageBuffer = fs.readFileSync(previewPath);
          const ext = path.extname(previewPath).toLowerCase();
          const mimeType = ext === '.gif' ? 'image/gif' : 'image/jpeg';
          const base64Image = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
          
          wallpapers.push({
            id: entry.name,
            name: entry.name,
            path: subPath,
            preview: base64Image,
            isPkg: hasPkg,
          });
        }
      }
    }
    return wallpapers;
  } catch (error) {
    console.error('扫描壁纸出错:', error);
    return [];
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
