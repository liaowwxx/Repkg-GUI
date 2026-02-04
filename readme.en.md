# RePKG ToolBox

>The English version of the README is machine-translated from Chinese and may contain errors.

This is a modern graphical interface developed for the [RePKG](https://github.com/notscuffed/repkg) command-line tool. It allows batch previewing/unpacking of Wallpaper Engine wallpaper files on macOS, or setting dynamic/static wallpapers for Mac.

<div align="center">

[简体中文](readme.md) | **English**

</div>

<img width="1214" height="874" alt="截屏2026-02-04 20 37 31" src="https://github.com/user-attachments/assets/62ffea77-b053-46ba-8b26-9c88b4ee7b35" />
<img width="1214" height="874" alt="截屏2026-02-04 20 37 53" src="https://github.com/user-attachments/assets/b85dab81-4bde-4e67-9f9a-013fb5e0d79f" />



## ✨ Core Features

- **Visual Wallpaper Gallery**: An intuitive grid preview mode, making finding wallpapers as easy as browsing a photo album.
- **Set Video/Image Wallpapers for macOS**: Right-click on a previewed wallpaper. The program will automatically unpack it, display the resource files contained in the wallpaper, and allow you to freely select videos/images to set as your Mac desktop wallpaper.

> Windows does not support using this software to set wallpapers.

- **Categorized Search/Filter**: Filter and search wallpapers freely based on age rating, wallpaper type, and wallpaper title.
- **Customizable Favorites**: You can now add wallpapers to your custom favorite categories and view them anytime using the filter function.
- **Smart Unpacking and Extraction**:
  - **PKG Auto-processing**: Deep unpacking for `.pkg` format files.
  - **Non-PKG Smart Scan**: Automatically identifies wallpapers that don't require unpacking, recursively searches and extracts all `.png`, `.jpg`, `.mp4` resources from their subdirectories.
  - **Optional Copy-Only**: Check the "Copy Only" option in settings for quick wallpaper dumping.
- **Batch Multi-select Processing**: Supports multi-selection with the mouse in the preview interface to execute batch extraction tasks with one click.
- **Real-time Log System**: Logs the progress and results of each task in detail, supporting batch error tolerance.
- **Multi-language Support**: Click the language switch button in the upper right corner to toggle between Chinese and English.

---

## 🚀 Quick Start

### For Regular Users

1. Download the appropriate file for your system from [Releases](https://github.com/liaowwxx/Repkg-GUI/releases/).
2. **macOS Users**: Double-click the `.app` file to run, or use the `.dmg` installer.
3. **Windows Users**: Double-click the `.exe` file to install, or use the portable version—after extracting, run `RePKG WebUI.exe`.

> Windows platform does not support the wallpaper setting function. Please use Wallpaper Engine software to set wallpapers.

### For Developers

1. **Install Dependencies**

   ```bash
   npm install
   ```
2. **Start Development Server**

   ```bash
   npm run electron:dev
   ```
3. **Build the Application**

   ```bash
   # Build for macOS
   npm run electron:build:mac
   # Build for Windows
   npm run electron:build:win64
   ```

## Project Structure

```text
repkg-webui/
├── electron/          # Electron main process and preload scripts
│   ├── main.js       # Handles core logic like file scanning, recursive copying
│   └── preload.js    # Exposes cross-process APIs
├── src/              # React application source code
│   ├── components/   # Includes ExtractView (main interface), Gallery, etc.
│   └── hooks/        # useRepkg hooks encapsulate command-line interaction
├── resources/        # RePKG binary files for each platform
└── build/            # Application icons and installation configuration
```

## Disclaimer

This tool is merely a graphical wrapper for the RePKG command-line tool, aimed at improving wallpaper extraction efficiency.

* This software **does NOT contain** any Wallpaper Engine resources.
* Please use it in compliance with relevant copyright agreements.
* The software is in the development stage. It is not recommended to run it on computers containing important data.

## Related Links

- [RePKG Original Project](https://github.com/notscuffed/repkg) - Thanks to notscuffed for the core tool support.

---

> **Final Note**: This project was developed with AI assistance, aiming to provide an efficient wallpaper extractor. If you find it useful, a Star is welcome.
