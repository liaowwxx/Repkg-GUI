import { app, BrowserWindow, ipcMain, dialog, protocol, net, shell } from 'electron';
import { spawn, exec } from 'child_process';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import os from 'os';
import fs from 'fs';
import sharp from 'sharp';
import { pipeline, env } from '@xenova/transformers';
import axios from 'axios';

// 配置 transformers 缓存和本地模型路径
env.allowLocalModels = true;
env.allowRemoteModels = true;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 优化 Chromium 渲染性能，解决 "tile memory limits exceeded" 警告
app.commandLine.appendSwitch('max-tiles-for-interest-area', '512');
app.commandLine.appendSwitch('num-raster-threads', '4');
if (process.platform === 'darwin') {
  app.commandLine.appendSwitch('enable-gpu-rasterization');
  app.commandLine.appendSwitch('enable-zero-copy');
}

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

// --- 自然语言搜索支持变量 ---
let embeddingPipeline = null;
let vectorCache = []; // { id, path, vector, description }
let currentDBPath = null; // 记录当前加载的 DB 路径

// 辅助函数：加载嵌入模型
async function loadEmbeddingModel(modelPath) {
  if (embeddingPipeline) return embeddingPipeline;
  
  // 更加健壮的本地路径判断：只要是绝对路径或者存在的路径
  const isLocalPath = modelPath && (path.isAbsolute(modelPath) || fs.existsSync(modelPath));
  
  // 备份原始设置
  const oldRemoteModels = env.allowRemoteModels;
  const oldLocalPath = env.localModelPath;

  try {
    if (isLocalPath) {
      console.log('正在强制从本地路径加载模型:', modelPath);
      
      // 彻底禁用远程连接
      env.allowRemoteModels = false;
      env.local_files_only = true; 
      
      // 解决路径拼接问题的核心：将 localModelPath 设为模型所在的父目录
      const absolutePath = path.resolve(modelPath);
      const modelDir = path.dirname(absolutePath);
      const modelName = path.basename(absolutePath);
      
      env.localModelPath = modelDir;
      
      console.log('Transformers 运行环境配置:', {
        localModelPath: env.localModelPath,
        allowRemoteModels: env.allowRemoteModels,
        modelName: modelName
      });

      embeddingPipeline = await pipeline('feature-extraction', modelName);
    } else {
      const modelId = modelPath || 'Xenova/all-MiniLM-L6-v2';
      console.log('网络加载模式:', modelId);
      env.allowRemoteModels = true;
      env.local_files_only = false;
      embeddingPipeline = await pipeline('feature-extraction', modelId);
    }
    return embeddingPipeline;
  } catch (err) {
    console.error('模型加载失败详情:', err);
    throw err;
  } finally {
    // 恢复全局环境设置
    env.allowRemoteModels = oldRemoteModels;
    env.local_files_only = false;
    env.localModelPath = oldLocalPath;
  }
}

// 辅助函数：处理图片为 LLM 可用的 base64
async function processImageForLLM(imagePath) {
  try {
    const ext = path.extname(imagePath).toLowerCase();
    let buffer;
    
    if (ext === '.gif') {
      // GIF 取第一帧
      buffer = await sharp(imagePath, { animated: false })
        .toFormat('png')
        .resize(512, 512, { fit: 'inside' })
        .toBuffer();
    } else {
      buffer = await sharp(imagePath)
        .resize(512, 512, { fit: 'inside' })
        .toBuffer();
    }
    
    return buffer.toString('base64');
  } catch (err) {
    console.error('图片预处理失败:', imagePath, err);
    return null;
  }
}

// 辅助函数：调用 LLM
async function callLLM(providerUrl, apiKey, model, prompt, base64Image, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      // 按照 OpenAI 标准协议，providerUrl 作为 base_url，拼接 /chat/completions
      const response = await axios.post(`${providerUrl}/chat/completions`, {
        model: model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${base64Image}`
                }
              },
              {
                type: "text",
                text: prompt
              }
            ]
          }
        ],
        max_tokens: 300
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      });
      
      // 按照 OpenAI 标准解析返回结果
      if (response.data && response.data.choices && response.data.choices[0].message) {
        return response.data.choices[0].message.content;
      }
      
      // 兼容某些特殊格式
      if (response.data && response.data.content && Array.isArray(response.data.content)) {
        const textItem = response.data.content.find(item => item.type === 'text');
        if (textItem) return textItem.text;
      }

      throw new Error('无法解析 LLM 返回内容');
    } catch (err) {
      const isNetworkError = err.code === 'EPIPE' || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT';
      if (isNetworkError && i < retries - 1) {
        console.warn(`LLM 调用失败 (${err.code}), 正在进行第 ${i + 1} 次重试...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 等待 2 秒后重试
        continue;
      }
      console.error('LLM 调用最终失败:', err.response?.data || err.message);
      throw err;
    }
  }
}

// 辅助函数：余弦相似度
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    mA += vecA[i] * vecA[i];
    mB += vecB[i] * vecB[i];
  }
  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  if (mA === 0 || mB === 0) return 0;
  return dotProduct / (mA * mB);
}

// --- IPC 处理程序 ---

ipcMain.handle('check-nl-status', async (event, dirPath) => {
  if (!dirPath || !fs.existsSync(dirPath)) return { total: 0, processed: 0, needsUpdate: true };
  
  // 如果路径变了，清空缓存并尝试从新路径加载
  const dbPath = path.join(dirPath, 'repkg_vectors.json');
  if (currentDBPath !== dbPath) {
    vectorCache = [];
    currentDBPath = dbPath;
    if (fs.existsSync(dbPath)) {
      try {
        vectorCache = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      } catch (e) {
        console.error('加载向量库失败:', e);
      }
    }
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  let total = 0;
  let processed = 0;
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const projectJsonPath = path.join(dirPath, entry.name, 'project.json');
      const hasPreview = fs.existsSync(path.join(dirPath, entry.name, 'preview.jpg')) || 
                        fs.existsSync(path.join(dirPath, entry.name, 'preview.png')) || 
                        fs.existsSync(path.join(dirPath, entry.name, 'preview.gif'));
      
      if (hasPreview) {
        total++;
        if (fs.existsSync(projectJsonPath)) {
          try {
            const content = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8'));
            if (content.preview_description && content.preview_description.trim().length > 0) {
              processed++;
            }
          } catch (e) {}
        }
      }
    }
  }
  
  const dbExists = fs.existsSync(dbPath);
  
  return { 
    total, 
    processed, 
    needsUpdate: !dbExists || processed < total,
    isDBLoaded: vectorCache.length > 0
  };
});

ipcMain.handle('update-nl-db', async (event, { dirPath, config }) => {
  const { llmProvider, llmApiKey, llmModel, embeddingModelPath } = config;
  const prompt = "用一段50字左右的话描述图片中的内容，包括主体，动作，风格等。";
  
  if (!dirPath || !fs.existsSync(dirPath)) return { success: false, error: '路径不存在' };

  try {
    // 1. 扫描并补充 LLM 描述
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const tasks = [];
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const wpPath = path.join(dirPath, entry.name);
        const projectJsonPath = path.join(wpPath, 'project.json');
        
        let previewFile = null;
        for (const f of ['preview.jpg', 'preview.png', 'preview.gif']) {
          if (fs.existsSync(path.join(wpPath, f))) {
            previewFile = path.join(wpPath, f);
            break;
          }
        }
        
        if (previewFile) {
          let projectInfo = {};
          if (fs.existsSync(projectJsonPath)) {
            try { projectInfo = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8')); } catch (e) {}
          }
          
          if (!projectInfo.preview_description) {
            tasks.push({ wpPath, projectJsonPath, previewFile, projectInfo });
          }
        }
      }
    }

    // 并行处理描述 (限制并发)
    const totalTasks = tasks.length;
    let completedTasks = 0;
    const batchSize = 10;
    
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      await Promise.all(batch.map(async (task) => {
        try {
          const base64 = await processImageForLLM(task.previewFile);
          if (base64) {
            const description = await callLLM(llmProvider, llmApiKey, llmModel, prompt, base64);
            task.projectInfo.preview_description = description;
            fs.writeFileSync(task.projectJsonPath, JSON.stringify(task.projectInfo, null, 2));
          }
        } catch (err) {
          console.error(`处理 ${task.wpPath} 失败:`, err.message);
        }
        completedTasks++;
        event.sender.send('nl-progress', { total: totalTasks, processed: completedTasks, task: 'LLM 描述生成中...' });
      }));
      // 在每批（10个）请求之间休息 500ms，减轻服务器瞬间压力
      if (i + batchSize < tasks.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // 2. 构建向量库
    event.sender.send('nl-progress', { total: 100, processed: 0, task: '加载嵌入模型...' });
    
    await loadEmbeddingModel(embeddingModelPath);

    const allWps = [];
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const projectJsonPath = path.join(dirPath, entry.name, 'project.json');
        if (fs.existsSync(projectJsonPath)) {
          try {
            const content = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8'));
            if (content.preview_description) {
              // 获取标题，如果没有则使用文件夹名
              const title = content.title || entry.name;
              // 构造加权文本：标题重复 2 次 + 描述
              // 格式: "标题 标题 描述内容"
              const weightedText = `${title} ${title} ${content.preview_description}`;
              allWps.push({ id: entry.name, description: weightedText });
            }
          } catch (e) {}
        }
      }
    }

    const vectors = [];
    for (let i = 0; i < allWps.length; i++) {
      const wp = allWps[i];
      const output = await embeddingPipeline(wp.description, { pooling: 'mean', normalize: true });
      vectors.push({
        id: wp.id,
        vector: Array.from(output.data),
        description: wp.description
      });
      event.sender.send('nl-progress', { total: allWps.length, processed: i + 1, task: '向量化处理中...' });
    }

    const dbPath = path.join(dirPath, 'repkg_vectors.json');
    fs.writeFileSync(dbPath, JSON.stringify(vectors));
    vectorCache = vectors;

    return { success: true };
  } catch (err) {
    console.error('构建向量库失败:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('vector-search', async (event, { query, topK, dirPath, embeddingModelPath }) => {
  if (!embeddingPipeline || vectorCache.length === 0) {
    // 尝试加载
    const dbPath = path.join(dirPath, 'repkg_vectors.json');
    if (fs.existsSync(dbPath)) {
      vectorCache = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } else {
      return { success: false, error: '向量库未构建' };
    }
    
    if (!embeddingPipeline) {
      await loadEmbeddingModel(embeddingModelPath);
    }
  }

  try {
    const output = await embeddingPipeline(query, { pooling: 'mean', normalize: true });
    const queryVector = Array.from(output.data);
    
    const results = vectorCache.map(item => ({
      id: item.id,
      score: cosineSimilarity(queryVector, item.vector)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
    
    return { success: true, results };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('rerank-results', async (event, { query, candidates, config }) => {
  const { llmProvider, llmApiKey, llmModel } = config;
  
  // 构造 Rerank Prompt
  const itemsList = candidates.map(c => `ID: ${c.id}\n标题: ${c.title}\n描述: ${c.preview_description}`).join('\n\n---\n\n');
  
  const prompt = `
你是一个非常严格的壁纸检索专家。你的唯一任务是：根据用户搜索词 "${query}"，从下面的候选壁纸列表中挑选出最匹配的壁纸 ID。

严格规则：
1. 只输出壁纸 ID，用英文逗号分隔（,），不要加空格或其他字符。
2. 严格按照相关度从高到低排序。
3. 必须完全或高度匹配搜索词描述的所有关键元素（场景、氛围、主体、风格、时间、颜色等）。如果某个元素明显不符（如搜索“城市中的少年”，但壁纸是“森林里的少年”），直接排除。
4. 如果没有完全匹配的壁纸，最多返回最接近的 3–5 个 ID。
5. 如果没有任何壁纸相关，输出空字符串（什么都不输出）。
6. 禁止输出任何解释、理由、JSON、括号、编号、换行或其他文字，只输出 ID 列表或空。

候选壁纸列表：
${itemsList}

输出格式示例：
ID1, ID2, ID3
`;

  try {
    // 复用之前的 axios 调用逻辑，但这次不需要图片
    const response = await axios.post(`${llmProvider}/chat/completions`, {
      model: llmModel,
      messages: [
        { role: "system", content: "你是一个专业的搜索结果排序助手，只输出结果 ID 列表。" },
        { role: "user", content: prompt }
      ],
      max_tokens: 500
    }, {
      headers: {
        'Authorization': `Bearer ${llmApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    let content = "";
    if (response.data && response.data.choices && response.data.choices[0].message) {
      content = response.data.choices[0].message.content;
    } else if (response.data && response.data.content) {
      const textItem = response.data.content.find(item => item.type === 'text');
      content = textItem ? textItem.text : "";
    }

    // 解析 ID 列表
    const rerankedIds = content.split(/[,，\n]/)
      .map(id => id.trim())
      .filter(id => id && candidates.some(c => c.id === id));

    return { success: true, results: rerankedIds };
  } catch (err) {
    console.error('Rerank 失败:', err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('clear-nl-descriptions', async (event, dirPath) => {
  if (!dirPath || !fs.existsSync(dirPath)) return { success: false, error: '路径不存在' };
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    let clearedCount = 0;
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const projectJsonPath = path.join(dirPath, entry.name, 'project.json');
        if (fs.existsSync(projectJsonPath)) {
          try {
            const content = fs.readFileSync(projectJsonPath, 'utf8');
            const projectInfo = JSON.parse(content);
            if (projectInfo.preview_description) {
              delete projectInfo.preview_description;
              fs.writeFileSync(projectJsonPath, JSON.stringify(projectInfo, null, 2), 'utf8');
              clearedCount++;
            }
          } catch (err) {
            console.error(`清除描述失败 (${projectJsonPath}):`, err);
          }
        }
      }
    }
    
    // 清除成功后同时清除向量库文件和内存缓存
    const dbPath = path.join(dirPath, 'repkg_vectors.json');
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
    vectorCache = [];
    
    return { success: true, clearedCount };
  } catch (error) {
    console.error('一键清除描述出错:', error);
    return { success: false, error: error.message };
  }
});

// --- 原有 IPC 处理程序继续 ---
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
              collections: projectInfo.repkgcollection || [],
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

ipcMain.handle('update-wallpaper-collections', async (event, { wallpaperPaths, collectionName, action }) => {
  const results = [];
  for (const wpPath of wallpaperPaths) {
    const projectJsonPath = path.join(wpPath, 'project.json');
    if (!fs.existsSync(projectJsonPath)) {
      results.push({ path: wpPath, success: false, error: 'project.json 不存在' });
      continue;
    }

    try {
      const content = fs.readFileSync(projectJsonPath, 'utf8');
      const projectInfo = JSON.parse(content);
      let collections = projectInfo.repkgcollection || [];

      if (action === 'add') {
        if (!collections.includes(collectionName)) {
          collections.push(collectionName);
        }
      } else if (action === 'remove') {
        collections = collections.filter(c => c !== collectionName);
      } else if (action === 'set') {
        // action 'set' can be used for renaming or resetting
        // but for now let's focus on add/remove as requested
      }

      projectInfo.repkgcollection = collections;
      fs.writeFileSync(projectJsonPath, JSON.stringify(projectInfo, null, 2), 'utf8');
      results.push({ path: wpPath, success: true, collections });
    } catch (err) {
      console.error(`更新 project.json 失败 (${wpPath}):`, err);
      results.push({ path: wpPath, success: false, error: err.message });
    }
  }
  return results;
});

ipcMain.handle('delete-collection', async (event, { rootPath, collectionName }) => {
  if (!rootPath || !fs.existsSync(rootPath)) return { success: false, error: '根路径不存在' };
  
  try {
    const entries = fs.readdirSync(rootPath, { withFileTypes: true });
    let updatedCount = 0;
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const projectJsonPath = path.join(rootPath, entry.name, 'project.json');
        if (fs.existsSync(projectJsonPath)) {
          const content = fs.readFileSync(projectJsonPath, 'utf8');
          const projectInfo = JSON.parse(content);
          if (projectInfo.repkgcollection && projectInfo.repkgcollection.includes(collectionName)) {
            projectInfo.repkgcollection = projectInfo.repkgcollection.filter(c => c !== collectionName);
            fs.writeFileSync(projectJsonPath, JSON.stringify(projectInfo, null, 2), 'utf8');
            updatedCount++;
          }
        }
      }
    }
    return { success: true, updatedCount };
  } catch (err) {
    console.error('删除收藏夹出错:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('set-wallpaper', async (event, filePath, options = {}) => {
  if (!filePath || !fs.existsSync(filePath)) return { success: false, error: '文件不存在' };
  
  const { isMuted = false } = options;
  
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

        const args = [filePath];
        if (isMuted) {
          args.push('--mute');
        }

        console.log('启动视频壁纸播放器:', playerPath, '视频:', filePath, '静音:', isMuted);
        currentWallpaperProcess = spawn(playerPath, args);
        
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
