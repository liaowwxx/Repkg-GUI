# RePKG WebUI

This is a modern graphical user interface developed for the [RePKG](https://github.com/notscuffed/repkg) command-line tool, designed for batch extraction and preview of Wallpaper Engine wallpapers.

<div align="center">

**English** | [简体中文](readme.zh-CN.md)

</div>



<img width="1308" height="887" alt="Screenshot 2026-01-29 at 02.36.51" src="https://github.com/user-attachments/assets/4b37f318-ac38-4cb5-81b3-9936f92929ad" />  

<img width="1184" height="764" alt="UI Preview" src="https://github.com/user-attachments/assets/ed6274e1-fea1-4380-ae09-4636247c9c8b" />


## ✨ Core Features

*   **Visual Wallpaper Gallery**: Utilizes an intuitive grid preview mode, automatically extracting `preview.jpg` or `preview.gif`, making finding wallpapers as simple as browsing a photo album.
*   **Categorize/Search/Find**: Analyze JSON files to freely filter and search through wallpapers.
*   **Intelligent Unpacking & Extraction**:
    *   **Automatic PKG Processing**: Deep unpacking specifically for `.pkg` files.
    *   **Non-PKG Smart Scanning**: Automatically identifies wallpapers that don't require unpacking, recursively searching for and extracting all `.png`, `.jpg`, `.mp4` resources within their subdirectories.
    *   **Copy-Only Option**: Check an option to perform fast wallpaper dumping by copying only.
*   **Batch Multi-select Processing**: Supports multi-selecting items in the preview interface with the mouse to perform batch extraction tasks with one click.
*   **Cross-Platform Native Experience**:
    Developed with Electron for a consistent experience across platforms.
*   **Real-time Logging System**: Logs detailed processing progress and results for each task, supporting batch error tolerance.

---

## 🚀 Quick Start

### General Users
1.  Download the file for your operating system from [Releases](https://github.com/liaowwxx/Repkg-GUI/releases/).
2.  **Windows Users**: Run the `.exe` installer or use the portable version.
3.  **macOS Users**: Double-click the `.app` to run.

### Developers
1.  **Install Dependencies**
    ```bash
    npm install
    ```
2.  **Start the Development Server**
    ```bash
    npm run electron:dev
    ```
3.  **Build the Application**
    ```bash
    # Build for macOS
    npm run electron:build:mac
    # Build for Windows (x64)
    npm run electron:build:win64
    ```


## Project Structure
```text
repkg-webui/
├── electron/          # Electron Main Process & Preload Scripts
│   ├── main.js       # Core logic for file scanning, recursive copying, etc.
│   └── preload.js    # Exposes APIs across processes
├── src/              # React Application Source Code
│   ├── components/   # Contains ExtractView (main interface), Gallery, and other components
│   └── hooks/        # useRepkg hook encapsulating command-line interaction
├── resources/        # RePKG binaries for various platforms
└── build/            # Application icons and installation configurations
```

## Disclaimer
This tool is merely a graphical wrapper for the RePKG command-line tool, aiming to improve the efficiency of wallpaper extraction.
*   This software does **not** contain any Wallpaper Engine assets.
*   Please use it in compliance with relevant copyright agreements.
*   The software is in the development stage; it is not recommended to run it on computers containing important data.

## Related Links
*   [RePKG Original Project](https://github.com/notscuffed/repkg) - Thanks to notscuffed for the core tool support.

---

> **Final Note**: This project was primarily developed with the assistance of AI, aiming to provide a personal and efficient tool for wallpaper extraction. If you find it useful, feel free to give it a Star.