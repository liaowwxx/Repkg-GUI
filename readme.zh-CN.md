# RePKG WebUI 

这是一个为 [RePKG](https://github.com/notscuffed/repkg) 命令行工具开发的现代化图形界面，为 Wallpaper Engine 壁纸的批量提取与预览而设计。


<div align="center">

[English](README.md) | **简体中文**

</div>

## ✨ 核心特性

-  **可视化壁纸相册**：采用直观的网格预览模式，自动提取 `preview.jpg` 或 `preview.gif`，让寻找壁纸像刷相册一样简单。
-  **智能解包与提取**：
    - **PKG 自动处理**：针对 `.pkg` 格式进行深度解包。
    - **非 PKG 智能扫描**：自动识别无需解包的壁纸，递归搜索并提取其子目录下的所有 `.png`、`.jpg`、`.mp4` 资源。
-  **批量多选处理**：支持在预览界面通过鼠标多选，一键批量执行提取任务。
-  **跨平台原生体验**：
    - **macOS**：支持隐藏式标题栏拖拽，完美适配系统 UI。
    - **Windows**：提供 NSIS 安装程序，支持自定义安装路径。
-  **实时日志系统**：详细记录每一个任务的处理进度与结果，支持批量容错。
-  **高级转换选项**：集成 TEX 图像转换、递归搜索、项目重命名等多种 RePKG 原生高级参数。

<img width="1184" height="764" alt="界面预览" src="https://github.com/user-attachments/assets/ed6274e1-fea1-4380-ae09-4636247c9c8b" />

---

## 🚀 快速开始

### 普通用户
1. 从 [Releases](https://github.com/liao/repkg_webui/releases) 下载对应系统的文件。
2. **Windows 用户**：运行 `.exe` 安装程序或使用便携版。
3. **macOS 用户**：双击 `.dmg` 或 `.app` 即可运行。

### 开发者
1. **安装依赖**
   ```bash
   npm install
   ```
2. **启动开发服务器**
   ```bash
   npm run electron:dev
   ```
3. **构建应用**
   ```bash
   # 构建 macOS 版
   npm run electron:build:mac
   # 构建 Windows 版 (x64)
   npm run electron:build:win64
   ```

---

## 📖 功能板块

### 1. Extract (提取)
*   **输入**：支持选择单个文件或整个壁纸根目录。
*   **预览区**：自动扫描子文件夹。带有“非PKG”角标的项目表示为纯资源文件夹。
*   **设置区**：
    *   **输出设置**：自定义提取后的存放位置。
    *   **转换选项**：勾选“TEX 转图像”可将游戏内纹理还原为普通图片。
    *   **高级选项**：支持单一目录模式、使用项目原名命名等。

### 2. Info (信息)
*   查看 PKG/TEX 文件的详细结构与属性。
*   快速筛选包内特定文件条目。

### 3. Help (帮助)
*   内置 RePKG 完整命令行文档，方便查询参数含义。

---

##  技术栈
- **Electron** - 桌面端运行环境
- **React 18** - 响应式前端框架
- **Vite** - 极速构建与热更新
- **Tailwind CSS** - 现代化样式管理

##  项目结构
```text
repkg-webui/
├── electron/          # Electron 主进程与预加载脚本
│   ├── main.js       # 处理文件扫描、递归复制等核心逻辑
│   └── preload.js    # 跨进程 API 暴露
├── src/              # React 应用源码
│   ├── components/   # 包含 ExtractView (主界面)、Gallery 等组件
│   └── hooks/        # useRepkg 封装了与命令行的交互
├── resources/        # 各平台 RePKG 二进制文件
└── build/            # 应用图标与安装配置
```

##  免责声明
本工具仅为 RePKG 命令行工具的图形化封装，旨在提高壁纸提取的效率。
*   本软件**不包含**任何 Wallpaper Engine 资源。
*   请在遵守相关版权协议的前提下使用。
*   软件处于开发阶段，建议在重要数据前进行备份。

##  相关链接
- [RePKG 原项目](https://github.com/notscuffed/repkg) - 感谢 notscuffed 的核心工具支持。

---

> **写在最后**：本项目主要由 AI 辅助开发，旨在提供一个自用且高效的壁纸提取利器。如果您觉得有用，欢迎 Star 关注。
