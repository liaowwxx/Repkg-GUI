# RePKG ToolBox

这是一个为 [RePKG](https://github.com/notscuffed/repkg) 命令行工具开发的现代化图形界面，可以在macOS上批量预览/解包wallpaper engine壁纸文件。或是为Mac设置动态/静态壁纸。

<div align="center">

[English](readme.md) | **简体中文**

</div>

<img width="1312" height="1000" alt="截屏2026-01-29 11 52 15" src="https://github.com/user-attachments/assets/e9d2ee6a-ae2a-4e12-8fa5-e522651a2f89" />
<img width="1052" height="588" alt="截屏2026-02-01 00 20 40" src="https://github.com/user-attachments/assets/c570fb01-4a28-4799-b43f-02ca9b9fce87" />

## ✨ 核心特性

- **可视化壁纸相册**：采用直观的网格预览模式，让寻找壁纸像刷相册一样简单。
- **为macOS设置视频壁纸**：可以右键预览的壁纸，程序会自动解包，展示当前壁纸所包含的资源文件，可以自由选择视频/图片以设置为Mac的桌面壁纸。
- **分类搜索/查找**：通过分析json，可以自由对壁纸进行筛选，搜索。
- **智能解包与提取**：
  - **PKG 自动处理**：针对 `.pkg` 格式进行深度解包。
  - **非 PKG 智能扫描**：自动识别无需解包的壁纸，递归搜索并提取其子目录下的所有 `.png`、`.jpg`、`.mp4` 资源。
  - **可选仅复制**：可以在选项中勾选仅复制，进行壁纸快速转储。
- **批量多选处理**：支持在预览界面通过鼠标多选，一键批量执行提取任务。
- **实时日志系统**：详细记录每一个任务的处理进度与结果，支持批量容错。
- **分类收藏夹**：现在，你可以把壁纸添加到你自定义的收藏夹中。并且随时通过筛选功能进行查看。

---

## 🚀 快速开始

### 普通用户

1. 从 [Releases](https://github.com/liaowwxx/Repkg-GUI/releases/) 下载对应系统的文件。
2. **macOS 用户**：双击 `.app` 即可运行，或者使用dmg安装包。

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
   ```

## 项目结构

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

## 免责声明

本工具仅为 RePKG 命令行工具的图形化封装，旨在提高壁纸提取的效率。

* 本软件**不包含**任何 Wallpaper Engine 资源。
* 请在遵守相关版权协议的前提下使用。
* 软件处于开发阶段，不建议在存有重要数据的电脑上运行。

## 相关链接

- [RePKG 原项目](https://github.com/notscuffed/repkg) - 感谢 notscuffed 的核心工具支持。

---

> **写在最后**：本项目主要由 AI 辅助开发，旨在提供一个自用且高效的壁纸提取利器。如果您觉得有用，欢迎 Star 关注。
