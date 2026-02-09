# RePKG ToolBox

This is a modern graphical interface developed based on the [RePKG](https://github.com/notscuffed/repkg) command-line tool, with many practical features added. It allows batch previewing/unpacking of Wallpaper Engine wallpaper files, setting up categorized favorites for wallpapers, and configuring static/dynamic video wallpapers for macOS.

<div align="center">

[简体中文](readme.md) | **English**

</div>

## Core Features

*   **Wallpaper Engine-like Visual Wallpaper Album**.
*   **Set Video/Image Wallpapers for macOS**: Right-click on a previewed wallpaper, and the program will automatically unpack it, showing the resource files contained within. You can freely choose a video/image to set as your Mac desktop wallpaper.

> Windows does not support setting wallpapers with this software. Please use Wallpaper Engine for Windows.

*   **Categorized Search/Filtering**: Filter and search wallpapers freely based on age rating, wallpaper type, wallpaper title, etc.
*   **Categorized Favorites**: Add wallpapers to your custom-defined favorites folders and view them anytime using the filtering function.
*   **Batch Multi-Selection Processing**: Supports multi-selection with the mouse in the preview interface for one-click batch extraction tasks.
*   **Multi-language Support**: Click the language switch button in the top right corner to toggle between Chinese and English.

## Optional Features

*   **Tag Search**: Download the tagger model (only `model.onnx` and `selected_tags.csv` are needed) from [HuggingFace](https://huggingface.co/SmilingWolf/wd-v1-4-moat-tagger-v2/tree/main). It tags each wallpaper preview image to enhance search capabilities.

## Notes

*   Both the **Favorites** feature and the **Tag Search** feature will modify the `project.json` file within the wallpaper folders.
*   The software is in **beta testing** and may contain bugs.

---

## Quick Start

### Regular Users

1.  Download the file for your system from [Releases](https://github.com/liaowwxx/Repkg-GUI/releases/).
2.  **macOS Users**: Double-click the `.app` file to run it, or use the `.dmg` installer.
3.  **Windows Users**: Double-click the `.exe` installer, or use the portable version — extract it and run `RePKG ToolBox.exe`.

Since I do not have an Apple Developer Program account, the app might prompt as "damaged" upon first launch on macOS. Here's the solution:

```bash
# Before launching for the first time, run the following command in Terminal:
sudo xattr -rd com.apple.quarantine "/Applications/RePKG WebUI.app"
```

If you are concerned about security, you can also clone the project locally and build it yourself, which avoids the `com.apple.quarantine` attribute that prevents execution.

### Developers

1.  **Clone the project locally**

    ```bash
    git clone git@github.com:liaowwxx/Repkg-Toolbox.git
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Start the development server (optional, for testing)**

    ```bash
    npm run electron:dev
    ```

4.  **Build the application**

    ```bash
    # Build for macOS
    npm run electron:build:mac
    # Build for Windows
    npm run electron:build:win64
    ```

## Disclaimer

This tool is merely a graphical wrapper for the RePKG command-line tool, aiming to improve the efficiency of wallpaper extraction.

*   This software **does not contain** any Wallpaper Engine assets.
*   Please use it in compliance with relevant copyright agreements.
*   The software is in the development stage. Running it on computers with critical data is not recommended.

## Related Links

*   [Original RePKG Project](https://github.com/notscuffed/repkg)

---

> **Final Note**: This project was developed with the assistance of AI. If you find it useful, feel free to give it a Star.