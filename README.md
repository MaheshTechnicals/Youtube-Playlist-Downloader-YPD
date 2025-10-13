# 🎬 YouTube Downloader CLI (YPD)

![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D20.x-brightgreen.svg)
![Author](https://img.shields.io/badge/Author-Mahesh%20Technicals-cyan.svg)

An all-in-one terminal tool for downloading YouTube content. Choose from four modes: download a **single video**, multiple videos via **comma-separated URLs**, an entire **playlist**, or extract **high-quality MP3 audio**.

---

## ✨ Features

- **📺 Single Video Mode:**
    - Quickly download any single YouTube video in the best available quality.
    - Files are saved directly to `downloads/videos/`.

- **🎥 Multi-Video Mode:**
    - Download multiple videos in one go by pasting a comma-separated list of URLs.
    - Each video is saved to `downloads/multi/`.

- **📜 Playlist Mode:**
    - Download all videos from a public YouTube playlist.
    - Videos are neatly organized into a subfolder named after the playlist title inside `downloads/zips/`.

- **🎧 MP3 Downloader Mode:**
    - Extract and download the audio from any YouTube video as a high-quality MP3 file.
    - Perfect for music, podcasts, and lectures.
    - Audio files are saved to `downloads/mp3/`.

- **Simple & Fast**: A clean, menu-driven interface gets your downloads started in seconds.
- **Organized**: Automatically sorts your downloads into dedicated folders based on the mode used.

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed on your system:

1.  **[Node.js](https://nodejs.org/)**: **Version 20 or higher.**
    - For a guide on installing Node.js on Android via Termux, see: **[How to Install Node.js on Android](https://maheshtechnicals.com/how-to-install-node-js-on-android/)**.
2.  **Basic CLI knowledge Needed.**

---

## 🚀 Installation & Usage

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/MaheshTechnicals/Youtube-Playlist-Downloader-YPD.git

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
    The script will present a main menu. Choose an option and follow the on-screen prompts to paste the required URL(s).

---

## 🔧 Key Dependencies

- **[yt-dlp-exec](https://www.npmjs.com/package/yt-dlp-exec):** Executes `yt-dlp` commands for all downloading tasks.
- **[Inquirer](https://www.npmjs.com/package/inquirer):** Powers the interactive command-line menus.
- **[Chalk](https://www.npmjs.com/package/chalk):** Styles the terminal output with colors for better readability.
- **[fs-extra](https://www.npmjs.com/package/fs-extra):** Handles the creation of download directories.

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

This tool is for personal and educational use only. The developers are not responsible for how you use this application. Please respect the copyright of content creators and YouTube's terms of service. Downloading copyrighted material without permission may be illegal in your country. Use this software at your own risk.

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
