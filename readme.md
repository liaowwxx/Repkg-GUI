# RePKG ToolBox

这是一个基于 [RePKG](https://github.com/notscuffed/repkg) 命令行工具开发的现代化图形界面。添加了很多实用的小功能。可以批量预览/解包wallpaper engine壁纸文件，为壁纸设置分类收藏夹，以及为macOS设置静态/动态视频壁纸。

<div align="center">

[English](readme.en.md) | **简体中文**

</div>

<div style="display: flex; justify-content: space-between;">
  <img src="https://github.com/user-attachments/assets/17f921ce-3954-4807-836d-25184cbe0be2" alt="main" style="width: 48%;">
  <img src="https://github.com/user-attachments/assets/7f6bb1a1-3a8f-4e2d-8a03-e5a6661a54d9" alt="set wallpaper" style="width: 48%;">
</div>

## 核心特性

- **类wallpaper engine的可视化壁纸相册**。
- **为macOS设置视频/图片壁纸**：可以右键预览的壁纸，程序会自动解包，展示当前壁纸所包含的资源文件，可以自由选择视频/图片以设置为Mac的桌面壁纸。

> Windows不支持使用此软件设置壁纸，请使用Wallpaper Engine设置。

- **分类搜索/查找**：根据年龄分级，壁纸类型，壁纸标题，自由对壁纸进行筛选，搜索。
- **分类收藏夹**：可以把壁纸添加到你自定义的收藏夹中。并且随时通过筛选功能进行查看。
- **批量多选处理**：支持在预览界面通过鼠标多选，一键批量执行提取任务。
- **多语言支持**：点击右上角语言切换按钮，在中英文间切换。

## 可选功能

- **标签搜索**：可以从[HuggingFace](https://huggingface.co/SmilingWolf/wd-v1-4-moat-tagger-v2/tree/main)上下载tagger模型(只需要model.onnx和selected_tags.csv)。为每一个壁纸预览图进行打标签，以增强搜索。

## 注意事项

- 软件的**收藏夹**功能和**标签搜索**功能均会修改壁纸文件夹中的project.json。
- 软件处于**测试阶段**，可能存在bug。

---

## 快速开始

### 普通用户

1. 从 [Releases](https://github.com/liaowwxx/Repkg-GUI/releases/) 下载对应系统的文件。
2. **macOS 用户**：双击 `.app` 即可运行，或者使用 `.dmg`安装包。
3. **Windows用户**：双击 `.exe`安装，或者使用便携版本，解压后运行 `RePKG ToolBox.exe`。

由于我没有Apple Developer Program账号，所以应用启动时会提示损坏，解决方法：

```bash
#首次启动前，在终端中运行以下指令：
sudo xattr -rd com.apple.quarantine "/Applications/RePKG WebUI.app"
```

如果您担心安全性问题，也可以将项目克隆到本地，随后自行构建，这能避免应用被添加 com.apple.quarantine 属性，而被禁止运行。

### 开发者

1. **将项目克隆至本地**

   ```bash
   git clone git@github.com:liaowwxx/Repkg-Toolbox.git
   ```
2. **安装依赖**

   ```bash
   npm install
   ```
3. **启动开发服务器(可选，测试用)**

   ```bash
   npm run electron:dev
   ```
4. **构建应用**

   ```bash
   # 构建 macOS 版
   npm run electron:build:mac
   # 构建 Windows 版
   npm run electron:build:win64
   ```

## 免责声明

本工具仅为 RePKG 命令行工具的图形化封装，旨在提高壁纸提取的效率。

* 本软件**不包含**任何 Wallpaper Engine 资源。
* 请在遵守相关版权协议的前提下使用。
* 软件处于开发阶段，不建议在存有重要数据的电脑上运行。

## 相关链接

- [RePKG 原项目](https://github.com/notscuffed/repkg) 

---

> **写在最后**：本项目由 AI 辅助开发。如果您觉得有用，欢迎 Star 关注。
