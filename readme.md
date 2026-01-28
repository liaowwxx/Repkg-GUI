# RePKG WebUI

A modern graphical interface for the [RePKG](https://github.com/notscuffed/repkg) command-line tool, designed for batch extraction and preview of Wallpaper Engine wallpapers.

<div align="center">

**English** | [简体中文](readme.zh-CN.md)

</div>

## ✨ Core Features

- **Visual Wallpaper Gallery**: Intuitive grid preview mode that automatically extracts `preview.jpg` or `preview.gif`, making wallpaper discovery as easy as browsing a photo album.
- **Smart Unpacking & Extraction**:
  - **PKG Auto-processing**: Deep unpacking for `.pkg` formats.
  - **Non-PKG Smart Scanning**: Automatically identifies wallpapers that don't require unpacking, recursively searches and extracts all `.png`, `.jpg`, `.mp4` resources from subdirectories.
- **Batch Multi-selection**: Supports multi-selection in the preview interface, enabling one-click batch extraction tasks.
- **Cross-platform Native Experience**:
  - **macOS**: Supports hidden title bar dragging, perfectly adapted to system UI.
  - **Windows**: Provides NSIS installer with customizable installation paths.
- **Real-time Logging System**: Detailed recording of each task's progress and results, with batch error tolerance.
- **Advanced Conversion Options**: Integrates TEX image conversion, recursive search, project renaming, and other native RePKG advanced parameters.

<img width="1184" height="764" alt="Interface Preview" src="https://github.com/user-attachments/assets/ed6274e1-fea1-4380-ae09-4636247c9c8b" />

---

## 🚀 Quick Start

### For Regular Users
1. Download the appropriate file for your system from [Releases](https://github.com/liao/repkg_webui/releases).
2. **Windows Users**: Run the `.exe` installer or use the portable version.
3. **macOS Users**: Double-click `.dmg` or `.app` to run.

### For Developers
1. **Install Dependencies**
   ```bash
   npm install
   ```
2. **Start Development Server**
   ```bash
   npm run electron:dev
   ```
3. **Build Application**
   ```bash
   # Build for macOS
   npm run electron:build:mac
   # Build for Windows (x64)
   npm run electron:build:win64
   ```

---

## 📖 Feature Modules

### 1. Extract
*   **Input**: Supports selecting single files or entire wallpaper root directories.
*   **Preview Area**: Automatically scans subfolders. Items with "Non-PKG" badges indicate pure resource folders.
*   **Settings Area**:
    *   **Output Settings**: Customize the extraction destination.
    *   **Conversion Options**: Check "Convert TEX to Images" to restore game textures to normal images.
    *   **Advanced Options**: Supports single directory mode, using original project names, etc.

### 2. Info
*   View detailed structure and properties of PKG/TEX files.
*   Quickly filter specific file entries within packages.

### 3. Help
*   Built-in complete RePKG command-line documentation for easy parameter reference.

---

## 🛠️ Tech Stack
- **Electron** - Desktop runtime environment
- **React 18** - Responsive frontend framework
- **Vite** - Fast build and hot reload
- **Tailwind CSS** - Modern styling management

## 📁 Project Structure
```text
repkg-webui/
├── electron/          # Electron main process & preload scripts
│   ├── main.js       # Core logic for file scanning, recursive copying
│   └── preload.js    # Cross-process API exposure
├── src/              # React application source
│   ├── components/   # Includes ExtractView (main interface), Gallery, etc.
│   └── hooks/        # useRepkg encapsulates command-line interactions
├── resources/        # RePKG binaries for each platform
└── build/            # Application icons & installation configuration
```

## ⚖️ Disclaimer
This tool is merely a graphical wrapper for the RePKG command-line tool, designed to improve wallpaper extraction efficiency.
*   This software **does not contain** any Wallpaper Engine resources.
*   Please use in compliance with relevant copyright agreements.
*   The software is in development stage; backing up important data is recommended.

## 🔗 Related Links
- [RePKG Original Project](https://github.com/notscuffed/repkg) - Thanks to notscuffed for core tool support.

---

> **Final Note**: This project was primarily AI-assisted in development, aiming to provide a personal yet efficient wallpaper extraction tool. If you find it useful, feel free to Star the repository.