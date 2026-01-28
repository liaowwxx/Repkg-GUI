# RePKG GUI 

这是一个为 [RePKG](https://github.com/notscuffed/repkg) 命令行工具开发的现代化图形界面，可以批量提取wallpaper engine壁纸文件

## ✨ 特性

- 🖥️ **跨平台**：支持 macOS 和 Windows
- 🎨 **现代化 UI**：使用 Tailwind CSS 构建的美观界面
- ⚡ **快速响应**：基于 Vite 的快速开发体验


<img width="1184" height="764" alt="截屏2026-01-27 14 36 47" src="https://github.com/user-attachments/assets/ed6274e1-fea1-4380-ae09-4636247c9c8b" />




## 🚀 快速开始

### 普通用户  

从Release下载对应系统的文件。  
Windows有便携版和安装版可选，建议使用便携版，安装版暂不支持更改安装位置。  
macOS为.app文件，双击打开即可。  


### 开发环境

1. **安装依赖**

```bash
npm install
```

2. **启动开发服务器**

```bash
npm run electron:dev
```

这将同时启动 Vite 开发服务器和 Electron 应用。

### 构建应用

**构建 macOS 应用：**

```bash
npm run electron:build:mac
```

**构建 Windows 应用：**

```bash
npm run electron:build:win
# 或明确指定 x64 架构
npm run electron:build:win64
```

## 使用说明

### Extract (提取)

- 选择 PKG 或 TEX 文件，或包含这些文件的目录
- 配置输出目录和选项
- 支持批量处理和容错模式

### Info (信息)

- 查看 PKG/TEX 文件的详细信息
- 支持排序和过滤
- 显示包内条目和 TEX 详细信息

### Help (帮助)

- 查看 RePKG 命令的帮助文档
- 支持查看特定命令的帮助信息

## 技术栈

- **Electron** - 跨平台桌面应用框架
- **React** - UI 框架
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架

## 项目结构

```
repkg-webui/
├── electron/          # Electron 主进程和预加载脚本
│   ├── main.js       # 主进程
│   └── preload.js    # 预加载脚本
├── src/              # React 应用源码
│   ├── components/   # React 组件
│   ├── hooks/        # 自定义 Hooks
│   ├── App.jsx       # 主应用组件
│   └── main.jsx      # 入口文件
├── resources/        # RePKG 可执行文件资源
└── package.json      # 项目配置
```


## 免责声明

本工具仅为 RePKG 命令行工具的图形化封装，不包含任何 Wallpaper Engine 资源。请在遵守相关版权协议的前提下使用。
软件处于开发初期，可能存在不稳定性，请不要在存放有重要文件的电脑上运行。

## 相关链接

- [RePKG 原项目](https://github.com/notscuffed/repkg)

## 写在最后

项目基本是用AI辅助完成的，主要是自用以及代码存档。
