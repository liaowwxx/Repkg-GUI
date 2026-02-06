# RePKG ToolBox

这是一个为 [RePKG](https://github.com/notscuffed/repkg) 命令行工具开发的现代化图形界面，可在 macOS 上批量预览/解包 Wallpaper Engine 壁纸文件，或为 Mac 设置动态/静态壁纸。

<div align="center">

[English](readme.en.md) | **简体中文**

</div>

<img width="1214" height="874" alt="截屏2026-02-04 20 39 26" src="https://github.com/user-attachments/assets/5acd8def-fda7-4bf3-988b-56571e93ae46" />
<img width="1214" height="874" alt="截屏2026-02-04 20 39 49" src="https://github.com/user-attachments/assets/b724415d-5230-4c1a-84c4-1865b510c2c6" />

## ✨ 核心特性

- **可视化壁纸相册**：采用网格预览模式，浏览壁纸如同翻阅相册。
- **为 macOS 设置视频/图片壁纸**：右键预览壁纸后，程序自动解包并展示其资源文件，可选择视频或图片设为桌面壁纸。
- **分类搜索/筛选**：支持按年龄分级、壁纸类型、标题等进行筛选和搜索。
- **图像搜索壁纸**（开发中）：基于图像内容向量化检索，支持通过描述预览图片进行搜索。
- **自定义收藏夹**：将壁纸添加至自定义收藏夹，并可通过筛选功能快速查看。
- **智能解包与提取**：
  - **PKG 自动处理**：深度解包 `.pkg` 格式文件。
  - **非 PKG 智能扫描**：自动识别无需解包的壁纸，递归提取子目录下的 `.png`、`.jpg`、`.mp4` 资源。
  - **可选仅复制**：勾选“仅复制”选项，快速转储壁纸文件。
- **批量多选处理**：在预览界面支持鼠标多选，一键批量提取。
- **实时日志系统**：详细记录任务处理进度与结果，支持批量容错。
- **多语言支持**：点击右上角按钮切换中英文界面。

> Windows 平台不支持设置壁纸功能，请使用 Wallpaper Engine 设置壁纸。
> Windows 平台暂不支持图像搜索壁纸功能。

---

## 🚀 快速开始

### 普通用户

1. 从 [Releases](https://github.com/liaowwxx/Repkg-GUI/releases/) 下载适用于您系统的文件。
2. **macOS 用户**：双击 `.app` 运行，或使用 `.dmg` 安装包。
3. **Windows 用户**：双击 `.exe` 安装，或解压便携版后运行 `RePKG WebUI.exe`。
4. **选择或输入壁纸文件夹路径**：
   - 若使用 Steam 订阅壁纸：选择 Steam 的 Wallpaper Engine 创意工坊目录（通常位于 `Steam/steamapps/workshop/content/431960/…`）。
   - 若使用自行整理/备份的壁纸：选择包含多个壁纸文件夹的父目录（如将所有壁纸存放在名为“我的壁纸”的文件夹中，则选择该文件夹）。
5. **选择合适的输出路径**。

> 以下为可选设置，目前仅支持 macOS 平台，功能可能不稳定：

> 6. 从 Hugging Face 等网站下载文本嵌入模型（ONNX 格式），推荐 [bge-small-zh-v1.5](https://huggingface.co/Xenova/bge-small-zh-v1.5/tree/main)，并设置模型目录。请确保目录结构如下：
>
>    bge-small-v1.5/
>    ├── config.json
>    ├── tokenizer.json
>    ├── tokenizer_config.json
>    ├── quantize_config.json
>    ├── special_tokens_map.json
>    └── onnx/
>             ├── model.onnx
>             └── model_quantized.onnx

> 7. 在“自然语言搜索设置”中填写兼容 OpenAI 的模型供应商、密钥及**视觉模型名称**（所有数据不上传）。若注重隐私，也可使用本地 Ollama 作为模型供应商，推荐使用 **qwen3-vl:4b-instruct-q4_K_M** 以平衡效果与速度。

> 8. 首次运行时，程序将根据所设模型供应商为所有图片生成描述，此过程耗时较长。若使用本地 Ollama 服务，耗时将更长且受电脑性能影响。
> 9. 可选使用LLM进行深度重排，效果较好，但是无法做到类似向量检索的快速响应。

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
   # 构建 Windows 版
   npm run electron:build:win64
   ```

## 项目结构

```
repkg-webui/
├── electron/          # Electron 主进程与预加载脚本
│   ├── main.js       # 文件扫描、递归复制等核心逻辑
│   └── preload.js    # 跨进程 API 暴露
├── src/              # React 应用源码
│   ├── components/   # 包含 ExtractView（主界面）、Gallery 等组件
│   └── hooks/        # useRepkg 封装命令行交互
├── resources/        # 各平台 RePKG 二进制文件
└── build/            # 应用图标与安装配置
```

## 免责声明

本工具仅为 RePKG 命令行工具的图形化封装，旨在提升壁纸提取效率。

- 本软件**不包含**任何 Wallpaper Engine 资源。
- 请在遵守相关版权协议的前提下使用。
- 软件处于开发阶段，不建议在存有重要数据的电脑上运行。

## 相关链接

- [RePKG 原项目](https://github.com/notscuffed/repkg) - 感谢 notscuffed 提供的核心工具支持。

---

> **写在最后**：本项目由 AI 辅助开发，旨在提供一个高效的壁纸提取工具。如果您觉得有用，欢迎 Star 关注。
>
> （应该不会有神人和我一样在Mac上用虚拟机安装wallpaper engine 下载壁纸，然后用这个神秘小软件查看吧）
