# RePKG WebUI (for macOS)

这是一个为 [RePKG](https://github.com/notscuffed/repkg) 命令行工具开发的图形化界面（WebUI），基于 Streamlit 构建。支持 macOS


## 快速开始

### 从release下载app文件，双击运行，浏览器会自动打开streamlit页面。

### 如果您的电脑有配制好的python环境，也可以克隆本项目，直接运行app.py(一般情况下macOS出场自带python)
```bash
git clone https://github.com/your-username/repkg-webui.git
cd repkg-webui
```

```bash
pip install streamlit
```

```bash
streamlit run app.py
```

## 使用技巧

- **提取 PKG**：在“Extract”功能中，点击“📁 文件”或“📂 目录”按钮选择输入，点击“📂 选择”设置输出。
- **批量处理**：如果你有大量的 PKG 文件（如 Wallpaper Engine 的 content 目录），建议勾选“批量容错模式”，程序会逐个处理并自动跳过损坏的文件。
- **TEX 转换**：如果只想转换独立的 `.tex` 文件为图片，请勾选“将 TEX 转换为图像 (-t)”并选择对应的目录。

## 免责声明

本工具仅为 RePKG 命令行工具的图形化封装，不包含任何 Wallpaper Engine 资源。请在遵守相关版权协议的前提下使用。

## 关于 RePKG 内核说明

由于 [RePKG](https://github.com/notscuffed/repkg) 原作者目前仅提供了适用于 Windows 平台的预编译版本，本项目内置的 macOS 版内核是基于其开源代码在 macOS 环境下重新编译生成的。
