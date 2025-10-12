# 🎬 YouTube Playlist Downloader (YPD)

![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D20.x-brightgreen.svg)
![Author](https://img.shields.io/badge/Author-Mahesh%20Technicals-cyan.svg)

A powerful and user-friendly terminal-based tool to download entire YouTube playlists with features like multi-video selection, progress display, automatic ZIP creation, and cleanup.

---

## ✨ Features

- **Interactive Interface**: Fetches all videos from a playlist and lets you choose which ones to download using an interactive menu.
- **Best Quality**: Automatically downloads videos in the best available video and audio quality and merges them into a single `.mp4` file.
- **ZIP Archiving**: Optionally compresses all downloaded videos into a single, convenient `.zip` file named after the playlist.
- **Automatic Cleanup**: If you choose to create a ZIP file, the script automatically removes the raw video files to save space.
- **User-Friendly**: Provides clear, color-coded feedback for download progress, success, and errors.
- **Robust Error Handling**: Gracefully handles user cancellations and unexpected errors, cleaning up any partial downloads.

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed on your system:

1.  **[Node.js](https://nodejs.org/)**: **Version 20 or higher.**
    - For a detailed guide on installing Node.js on Android via Termux, follow this guide: **[How to Install Node.js on Android](https://maheshtechnicals.com/how-to-install-node-js-on-android/)**.
2.  **[yt-dlp](https://github.com/yt-dlp/yt-dlp#installation)**: This tool relies on `yt-dlp` being installed and available in your system's PATH. This is a crucial dependency.

---

## 🚀 Installation & Usage

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/MaheshTechnicals/Youtube-Playlist-Downloader-YPD.git](https://github.com/MaheshTechnicals/Youtube-Playlist-Downloader-YPD.git)
    ```

2.  **Navigate to the project directory:**
    ```sh
    cd Youtube-Playlist-Downloader-YPD
    ```

3.  **Install the dependencies:**
    ```sh
    npm install
    ```

4.  **Run the application:**
    ```sh
    npm start
    ```

The script will then guide you through the process of entering a playlist URL, selecting videos, and downloading them.

---

## 🔧 Key Dependencies

This project is built with the help of these amazing libraries:

- [yt-dlp-exec](https://www.npmjs.com/package/yt-dlp-exec): To run `yt-dlp` commands.
- [Inquirer](https://www.npmjs.com/package/inquirer): For the interactive command-line prompts.
- [Chalk](https://www.npmjs.com/package/chalk): To style the terminal output with colors.
- [Archiver](https://www.npmjs.com/package/archiver): For creating the ZIP archives.
- [fs-extra](https://www.npmjs.com/package/fs-extra): For convenient file system operations.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/MaheshTechnicals/Youtube-Playlist-Downloader-YPD/issues).

1.  **Fork** the repository.
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the Branch (`git push origin feature/AmazingFeature`).
5.  Open a **Pull Request**.

---

## ⚠️ Disclaimer

This tool is intended for personal and educational use only. The developers are not responsible for how you use this application. Please respect the copyright of the content creators and adhere to YouTube's terms of service. Downloading copyrighted material without permission may be illegal in your country. Use this software at your own risk.

---

## 💖 Support The Project

If you find this tool helpful and want to support my work, please consider buying me a coffee!

<a href="https://www.paypal.com/paypalme/Varma161" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>

- **UPI:** `maheshtechnicals@apl`

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Developed by <b>Mahesh Technicals</b>
</p>
