# RePKG ToolBox

A modern graphical interface developed for the [RePKG](https://github.com/notscuffed/repkg) command-line tool, enabling batch preview/unpacking of Wallpaper Engine wallpaper files on macOS. Also allows setting dynamic/static wallpapers for Mac.

<div align="center">

**English** | [简体中文](readme.zh-CN.md)

</div>



<img width="1312" height="1000" alt="Screenshot 2026-01-29 at 11.52.15 AM" src="https://github.com/user-attachments/assets/e9d2ee6a-ae2a-4e12-8fa5-e522651a2f89" />
<img width="1052" height="588" alt="Screenshot 2026-02-01 at 00.20.40 AM" src="https://github.com/user-attachments/assets/c570fb01-4a28-4799-b43f-02ca9b9fce87" />


## ✨ Core Features

-   **Visual Wallpaper Gallery**: Features an intuitive grid preview mode, making finding wallpapers as easy as browsing an album.
-   **Set Video Wallpaper for macOS**: Right-click on a previewed wallpaper, the program will automatically unpack it, display the included resource files, and allow you to freely select a video/image to set as your Mac desktop wallpaper.
-   **Categorized Search/Filter**: Analyze JSON metadata to freely filter and search wallpapers.
-   **Smart Unpacking & Extraction**:
    -   **PKG Automatic Processing**: Deep unpacking for `.pkg` files.
    -   **Non-PKG Smart Scan**: Automatically identifies wallpapers that don't require unpacking, recursively searches and extracts all `.png`, `.jpg`, `.mp4` resources from their subdirectories.
    -   **Copy-Only Option**: Check the 'Copy Only' option in settings for quick wallpaper dumping.
-   **Batch Multi-selection Processing**: Supports multi-selection via mouse in the preview interface for one-click batch extraction tasks.
-   **Real-time Logging System**: Detailed logging for every task's progress and results, supporting batch error tolerance.

---

## 🚀 Quick Start

### Regular Users
1. Download the appropriate file for your system from [Releases](https://github.com/liaowwxx/Repkg-GUI/releases/).
3. **macOS Users**: Double-click the `.app` to run, or use the dmg installer.

### Developers
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
   ```

## Project Structure
```text
repkg-webui/
├── electron/          # Electron Main Process & Preload Scripts
│   ├── main.js       # Core logic for file scanning, recursive copying, etc.
│   └── preload.js    # Cross-process API exposure
├── src/              # React Application Source Code
│   ├── components/   # Includes ExtractView (main interface), Gallery, etc.
│   └── hooks/        # useRepkg hook encapsulating command-line interaction
├── resources/        # Platform-specific RePKG binaries
└── build/            # Application icons and installation configurations
```

## Disclaimer
This tool is solely a graphical wrapper for the RePKG command-line tool, aiming to improve wallpaper extraction efficiency.
*   This software does **NOT** contain any Wallpaper Engine resources.
*   Please use it in compliance with relevant copyright agreements.
*   The software is in the development phase; running it on computers with critical data is not recommended.

## Related Links
- [RePKG Original Project](https://github.com/notscuffed/repkg) - Thanks to notscuffed for the core tool support.

---

> **Final Note**: This project is primarily developed with the assistance of AI, aiming to provide a personal-use and highly efficient wallpaper extraction tool. If you find it useful, stars are welcome.
