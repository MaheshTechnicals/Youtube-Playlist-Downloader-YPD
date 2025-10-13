#!/usr/bin/env node
import inquirer from "inquirer";
import fs from "fs-extra";
import chalk from "chalk";
import path from "path";
import { fileURLToPath } from "url";
import ytdlp from "yt-dlp-exec";
import archiver from "archiver";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const baseDir = path.join(__dirname, "downloads");
const videosDir = path.join(baseDir, "videos");
const multiDir = path.join(baseDir, "multi");
const zipDir = path.join(baseDir, "zip");

// Ensure folders exist
await fs.ensureDir(videosDir);
await fs.ensureDir(multiDir);
await fs.ensureDir(zipDir);

ytdlp.options = { executablePath: "yt-dlp" };

// --- Helper: Create ZIP ---
async function createZip(folder, zipFile) {
  const output = fs.createWriteStream(zipFile);
  const archive = archiver("zip", { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(output);
    archive.directory(folder, false);
    archive.finalize();
  });
}

// --- Helper: Sanitize filename ---
function sanitize(name) {
  return name.replace(/[<>:"/\\|?*]+/g, "");
}

// --- Helper: Get quality label ---
function getQualityLabel(height) {
  if (height >= 1080) return "FHD";
  if (height >= 720) return "HD";
  if (height >= 480) return "SD";
  return "Low";
}

// --- Fetch playlist info ---
async function getPlaylistInfo(url) {
  try {
    const result = await ytdlp(url, { dumpSingleJson: true, flatPlaylist: true });
    return {
      title: result.title || "playlist",
      videos: result.entries.map(v => ({
        title: v.title || "Unknown Title",
        url: `https://www.youtube.com/watch?v=${v.id}`
      }))
    };
  } catch (error) {
    console.error(chalk.red("❌ Failed to fetch playlist info:"), error.message);
    process.exit(1);
  }
}

// --- Download a video ---
async function downloadVideo(videoURL, outputDir, resolutionFormat = "best") {
  try {
    await ytdlp(videoURL, {
      output: path.join(outputDir, "%(title)s.%(ext)s"),
      format: resolutionFormat,
      mergeOutputFormat: "mp4"
    });
  } catch (err) {
    console.log(chalk.red(`❌ Failed to download: ${videoURL}`));
  }
}

// --- Get available formats for Single Video ---
async function getFormats(url) {
  try {
    const result = await ytdlp(url, { dumpSingleJson: true });
    const formats = result.formats
      .filter(f => f.height && f.ext === "mp4" && f.acodec !== "none" && f.vcodec !== "none")
      .reduce((acc, cur) => { if (!acc.some(a => a.height === cur.height)) acc.push(cur); return acc; }, [])
      .sort((a, b) => b.height - a.height)
      .map(f => ({ name: `${f.height}p ${getQualityLabel(f.height)} (${f.ext})`, value: f.format_id }));
    return formats;
  } catch (err) {
    console.error(chalk.red("❌ Failed to fetch video formats."));
    process.exit(1);
  }
}

// --- SINGLE VIDEO MODE ---
async function singleVideoMode() {
  console.log(chalk.yellow("\n--- Single Video Mode ---"));
  console.log(chalk.cyan("Guide: Enter a YouTube video URL, then select the resolution (FHD/HD/SD/Low) to download.\n"));

  const { videoURL } = await inquirer.prompt([
    {
      type: "input",
      name: "videoURL",
      message: chalk.yellow("Enter YouTube Video URL:"),
      validate: input => input.startsWith("http") || "Please enter a valid URL"
    }
  ]);

  console.log(chalk.blue("\nFetching available resolutions..."));
  const formats = await getFormats(videoURL);

  const { selectedFormat } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedFormat",
      message: chalk.magenta("Select resolution to download:"),
      choices: formats
    }
  ]);

  console.log(chalk.cyan("\nDownloading video..."));
  await downloadVideo(videoURL, videosDir, selectedFormat);
  console.log(chalk.green("\n✅ Download completed and saved in 'downloads/videos'."));
}

// --- MULTI VIDEO MODE ---
async function multiVideoMode() {
  console.log(chalk.yellow("\n--- Multi Videos Mode ---"));
  console.log(chalk.cyan("Guide: Place a 'links.txt' file in this folder with one YouTube URL per line.\nYou can download all videos at once and optionally create a ZIP archive.\n"));

  const linksFile = path.join(__dirname, "links.txt");
  if (!(await fs.pathExists(linksFile))) {
    console.log(chalk.red("❌ links.txt not found in current directory."));
    process.exit(1);
  }

  const links = (await fs.readFile(linksFile, "utf8"))
    .split("\n").map(l => l.trim()).filter(Boolean);

  if (links.length === 0) {
    console.log(chalk.red("❌ links.txt is empty."));
    process.exit(1);
  }

  console.log(chalk.blue(`\nFound ${links.length} video URLs. Starting downloads...\n`));
  const total = links.length;
  for (const [index, url] of links.entries()) {
    console.log(chalk.cyan(`[${index + 1}/${total}] Downloading...`));
    await downloadVideo(url, multiDir);
    console.log(chalk.green(`[${index + 1}/${total}] ✅ Completed\n`));
  }

  const { zipChoice } = await inquirer.prompt([
    {
      type: "confirm",
      name: "zipChoice",
      message: chalk.yellow("\nDo you want to zip the downloaded videos?"),
      default: true
    }
  ]);

  if (zipChoice) {
    const count = (await fs.readdir(zipDir)).filter(f => f.startsWith("multi-")).length + 1;
    const zipFile = path.join(zipDir, `multi-${count}.zip`);
    console.log(chalk.blue("\nCreating ZIP file..."));
    await createZip(multiDir, zipFile);
    console.log(chalk.green(`📦 ZIP created: ${zipFile}`));
    await fs.emptyDir(multiDir);
  } else {
    console.log(chalk.gray("\n✅ Videos kept in downloads/multi folder, no ZIP created."));
  }
}

// --- PLAYLIST MODE ---
async function playlistMode() {
  console.log(chalk.yellow("\n--- Playlist Mode ---"));
  console.log(chalk.cyan("Guide: Enter a YouTube playlist URL.\nSelect which videos to download and optionally create a ZIP archive.\n"));

  const { playlistURL } = await inquirer.prompt([
    {
      type: "input",
      name: "playlistURL",
      message: chalk.yellow("Enter YouTube Playlist URL:"),
      validate: input => input.startsWith("http") || "Please enter a valid URL"
    },
  ]);

  console.log(chalk.blue("\nFetching playlist info..."));
  const { title: playlistTitle, videos } = await getPlaylistInfo(playlistURL);
  console.log(chalk.green(`\n✅ Found ${videos.length} videos in playlist: "${playlistTitle}"\n`));

  const { selectedVideos } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "selectedVideos",
      message: chalk.magenta("Select videos to download:"),
      choices: videos.map(v => ({ name: v.title, value: v })),
      pageSize: 10,
      validate: list => list.length > 0 || "Please select at least one video!"
    }
  ]);

  const sanitizedPlaylist = sanitize(playlistTitle);
  const playlistDir = path.join(baseDir, "playlist", sanitizedPlaylist);
  await fs.ensureDir(playlistDir);

  console.log(chalk.blue("\nStarting downloads...\n"));
  const total = selectedVideos.length;
  for (let i = 0; i < total; i++) {
    const video = selectedVideos[i];
    console.log(chalk.cyan(`[${i + 1}/${total}] Downloading: ${video.title}`));
    try {
      await ytdlp(video.url, {
        output: path.join(playlistDir, "%(title)s.%(ext)s"),
        format: "bestvideo+bestaudio/best",
        mergeOutputFormat: "mp4"
      });
      console.log(chalk.green(`[${i + 1}/${total}] ✅ Completed: ${video.title}\n`));
    } catch {
      console.log(chalk.red(`[${i + 1}/${total}] ❌ Failed: ${video.title}\n`));
    }
  }

  const { zipChoice } = await inquirer.prompt([
    {
      type: "confirm",
      name: "zipChoice",
      message: chalk.yellow("\nDo you want to zip the downloaded videos?"),
      default: true
    }
  ]);

  if (zipChoice) {
    const zipFile = path.join(zipDir, `${sanitizedPlaylist}.zip`);
    console.log(chalk.blue("\nCreating ZIP file..."));
    await createZip(playlistDir, zipFile);
    console.log(chalk.green(`📦 ZIP created: ${zipFile}`));
    await fs.remove(playlistDir);
    console.log(chalk.gray("🧹 Raw video files removed."));
  } else {
    console.log(chalk.gray(`\n✅ Videos kept in downloads/playlist/${sanitizedPlaylist} folder, no ZIP created.`));
  }
}

// --- MAIN MENU ---
(async () => {
  try {
    console.clear();

    console.log(chalk.cyan.bold("╔════════════════════════════════════════╗"));
    console.log(chalk.cyan.bold("║        YouTube Downloader CLI         ║"));
    console.log(chalk.cyan.bold("║          by Mahesh Technicals         ║"));
    console.log(chalk.cyan.bold("╚════════════════════════════════════════╝\n"));

    console.log(chalk.bold.green("Select Mode:\n"));
    console.log(chalk.yellow("1) Single Video") + chalk.gray("\n   Download a single YouTube video.\n   Choose resolution (FHD / HD / SD / Low).\n"));
    console.log(chalk.yellow("2) Multi Videos") + chalk.gray("\n   Download multiple videos from links.txt.\n   Optionally create a ZIP archive.\n"));
    console.log(chalk.yellow("3) Playlist") + chalk.gray("\n   Download videos from a YouTube playlist.\n   Select videos and optionally zip them.\n"));

    const { mode } = await inquirer.prompt([
      {
        type: "list",
        name: "mode",
        message: chalk.green("➡ Choose an option:"),
        choices: ["Single Video", "Multi Videos", "Playlist"]
      }
    ]);

    if (mode === "Single Video") await singleVideoMode();
    else if (mode === "Multi Videos") await multiVideoMode();
    else await playlistMode();

    console.log(chalk.bold.green("\n🎉 All Done! Enjoy your videos.\n"));

  } catch (err) {
    if (err.name === "ExitPromptError") {
      console.log(chalk.red("\n✋ Operation cancelled by user."));
      process.exit(0);
    } else {
      console.error(chalk.red("\n❌ Unexpected Error:"), err);
      process.exit(1);
    }
  }
})();
