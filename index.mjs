#!/usr/bin/env node
import inquirer from "inquirer";
import fs from "fs-extra";
import chalk from "chalk";
import path from "path";
import { fileURLToPath } from "url";
import archiver from "archiver";
import * as tar from "tar";
import which from "which";
import { spawn, spawnSync } from "child_process";

/* ==========================
   PATHS
   ========================== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseDir = path.join(__dirname, "downloads");
const videosDir = path.join(baseDir, "videos");
const multiDir = path.join(baseDir, "multi");
const zipDir = path.join(baseDir, "zip");

await fs.ensureDir(videosDir);
await fs.ensureDir(multiDir);
await fs.ensureDir(zipDir);

/* ==========================
   Ensure yt-dlp (nightly) - uses pip (no sudo)
   ========================== */
async function ensureYtDlp() {
  try {
    await which("yt-dlp");
    return "yt-dlp";
  } catch {
    console.log(chalk.yellow("yt-dlp not found — installing nightly build via pip..."));
    try {
      spawnSync("python3", [
        "-m",
        "pip",
        "install",
        "-U",
        "https://github.com/yt-dlp/yt-dlp/releases/download/nightly/yt_dlp-0-py3-none-any.whl"
      ], { stdio: "inherit" });
      return "yt-dlp";
    } catch (e) {
      console.log(chalk.red("Failed to install yt-dlp automatically. Please install yt-dlp manually."));
      process.exit(1);
    }
  }
}

/* ==========================
   Ensure ffmpeg (system or ffmpeg-static fallback)
   ========================== */
async function ensureFfmpeg() {
  try {
    await which("ffmpeg");
    // ok
  } catch {
    console.log(chalk.yellow("ffmpeg not found — installing ffmpeg-static as fallback (npm)..."));
    // install locally into project
    spawnSync("npm", ["install", "ffmpeg-static"], { stdio: "inherit" });
    // no explicit set needed; yt-dlp will find ffmpeg-static binary in node_modules/.bin
  }
}

/* ==========================
   Archive helpers
   ========================== */
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

async function createTarGz(folder, tarFile) {
  const folderName = path.basename(folder);
  const parentDir = path.dirname(folder);
  return tar.c({ gzip: true, file: tarFile, cwd: parentDir }, [folderName]);
}

async function selectCompressionType() {
  const { comp } = await inquirer.prompt([
    {
      type: "list",
      name: "comp",
      message: "Choose compression format:",
      choices: [
        { name: "ZIP (.zip)", value: "zip" },
        { name: "TAR.GZ (.tar.gz)", value: "tar.gz" }
      ],
      default: "zip"
    }
  ]);
  return comp;
}

async function createArchive(folder, outDir, baseName) {
  const comp = await selectCompressionType();
  const file = comp === "zip" ? path.join(outDir, `${baseName}.zip`) : path.join(outDir, `${baseName}.tar.gz`);
  if (comp === "zip") await createZip(folder, file);
  else await createTarGz(folder, file);
  console.log(chalk.green(`📦 Archive created: ${file}`));
  return file;
}

/* ==========================
   Util
   ========================== */
function sanitize(name) {
  return name.replace(/[<>:"/\\|?*]+/g, "");
}

/* ==========================
   Clean progress download
   - Use yt-dlp's --progress-template to produce a single-line progress
   - Limit video height to 720p via format selector
   ========================== */
async function downloadVideo(url, outputDir) {
  const yt = await ensureYtDlp();
  await ensureFfmpeg();

  const outputPattern = path.join(outputDir, "%(title)s.%(ext)s");

  return new Promise((resolve, reject) => {
    // Format: best video up to 720p + best audio, fallback to best
    const formatSelector = "bestvideo[height<=720]+bestaudio/best";

    const args = [
      "-f", formatSelector,
      "--merge-output-format", "mp4",
      "--no-warnings",
      "--quiet",
      "--progress",
      "--progress-template", "Downloading: %(progress._percent_str)s • %(progress._speed_str)s • ETA %(progress._eta_str)s",
      "-o", outputPattern,
      url,
      "--no-playlist"
    ];

    const proc = spawn(yt, args);

    // Progress and messages are emitted to stdout by yt-dlp with this template
    proc.stdout.on("data", (d) => {
      const str = d.toString().trim();
      // keep single-line updating: prefix carriage return
      process.stdout.write("\r" + chalk.cyan(str) + "   ");
    });

    // suppress verbose stderr to avoid scrolling. If needed, show on errors.
    let stderr = "";
    proc.stderr.on("data", (d) => { stderr += d.toString(); });

    proc.on("close", (code) => {
      process.stdout.write("\n");
      if (code === 0) resolve();
      else {
        // print helpful error block
        console.error(chalk.red("yt-dlp error:"), stderr || `exit code ${code}`);
        reject(new Error("Download failed"));
      }
    });
  });
}

/* ==========================
   Playlist info (flat)
   ========================== */
async function getPlaylistInfo(url) {
  const yt = await ensureYtDlp();

  return new Promise((resolve, reject) => {
    const proc = spawn(yt, [url, "--dump-single-json", "--flat-playlist"]);
    let out = "";
    let err = "";
    proc.stdout.on("data", d => out += d.toString());
    proc.stderr.on("data", d => err += d.toString());

    proc.on("close", (code) => {
      if (code !== 0) {
        console.error(chalk.red("yt-dlp failed to fetch playlist:"), err);
        return reject(new Error("Failed to fetch playlist"));
      }
      try {
        const json = JSON.parse(out);
        resolve({
          title: json.title || "playlist",
          videos: (json.entries || []).map(e => ({
            title: e.title || e.id || "Unknown",
            url: `https://www.youtube.com/watch?v=${e.id}`
          }))
        });
      } catch (e) {
        console.error(chalk.red("Failed to parse playlist JSON"), e);
        reject(e);
      }
    });
  });
}

/* ==========================
   Single Video Mode
   ========================== */
async function singleVideoMode() {
  console.log(chalk.yellow("\n--- Single Video Mode ---"));
  const { videoURL } = await inquirer.prompt([
    {
      type: "input",
      name: "videoURL",
      message: chalk.yellow("Enter YouTube Video URL:"),
      validate: v => v && v.startsWith("http") ? true : "Please enter a valid URL"
    }
  ]);

  console.log(chalk.blue("\nDownloading..."));
  try {
    await downloadVideo(videoURL, videosDir);
    console.log(chalk.green("✅ Download complete — saved in downloads/videos"));
  } catch (e) {
    console.log(chalk.red("❌ Download failed:"), e.message);
  }
}

/* ==========================
   Multi Video Mode (links.txt)
   ========================== */
async function multiVideoMode() {
  console.log(chalk.yellow("\n--- Multi Videos Mode ---"));
  const linksFile = path.join(__dirname, "links.txt");
  if (!(await fs.pathExists(linksFile))) {
    console.log(chalk.red("❌ links.txt not found in current directory."));
    return;
  }

  const links = (await fs.readFile(linksFile, "utf8"))
    .split("\n").map(s => s.trim()).filter(Boolean);

  if (!links.length) {
    console.log(chalk.red("❌ links.txt is empty."));
    return;
  }

  console.log(chalk.blue(`\nFound ${links.length} video(s). Starting downloads...\n`));
  for (let i = 0; i < links.length; i++) {
    console.log(chalk.magenta(`[${i+1}/${links.length}]`));
    try {
      await downloadVideo(links[i], multiDir);
      console.log(chalk.green(`[${i+1}/${links.length}] ✅ Completed`));
    } catch (e) {
      console.log(chalk.red(`[${i+1}/${links.length}] ❌ Failed — ${e.message}`));
    }
  }

  const { zipChoice } = await inquirer.prompt([
    { type: "confirm", name: "zipChoice", message: "Do you want to archive the downloaded videos?", default: true }
  ]);

  if (zipChoice) {
    const count = (await fs.readdir(zipDir)).filter(f => f.startsWith("multi-")).length + 1;
    const zipFileName = `multi-${count}`;
    console.log(chalk.blue("\nCreating archive..."));
    await createArchive(multiDir, zipDir, zipFileName);
    await fs.emptyDir(multiDir);
  } else {
    console.log(chalk.gray("\n✅ Videos kept in downloads/multi folder."));
  }
}

/* ==========================
   Playlist Mode
   ========================== */
async function playlistMode() {
  console.log(chalk.yellow("\n--- Playlist Mode ---"));
  const { playlistURL } = await inquirer.prompt([
    {
      type: "input",
      name: "playlistURL",
      message: chalk.yellow("Enter YouTube Playlist URL:"),
      validate: v => v && v.startsWith("http") ? true : "Please enter a valid URL"
    }
  ]);

  console.log(chalk.blue("\nFetching playlist info..."));
  let info;
  try {
    info = await getPlaylistInfo(playlistURL);
  } catch (e) {
    console.log(chalk.red("❌ Failed to fetch playlist info."));
    return;
  }

  console.log(chalk.green(`\n✅ Found ${info.videos.length} videos in playlist: "${info.title}"\n`));

  const { selectedVideos } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "selectedVideos",
      message: chalk.magenta("Select videos to download:"),
      choices: info.videos.map(v => ({ name: v.title, value: v })),
      pageSize: 12,
      validate: list => list.length > 0 || "Please select at least one video!"
    }
  ]);

  const sanitized = sanitize(info.title);
  const playlistDir = path.join(baseDir, "playlist", sanitized);
  await fs.ensureDir(playlistDir);

  console.log(chalk.blue("\nStarting downloads...\n"));
  for (let i = 0; i < selectedVideos.length; i++) {
    const video = selectedVideos[i];
    console.log(chalk.magenta(`[${i+1}/${selectedVideos.length}] ${video.title}`));
    try {
      await downloadVideo(video.url, playlistDir);
      console.log(chalk.green(`[${i+1}/${selectedVideos.length}] ✅ Completed`));
    } catch (e) {
      console.log(chalk.red(`[${i+1}/${selectedVideos.length}] ❌ Failed — ${e.message}`));
    }
  }

  const { zipChoice } = await inquirer.prompt([
    { type: "confirm", name: "zipChoice", message: "Do you want to archive the downloaded videos?", default: true }
  ]);

  if (zipChoice) {
    console.log(chalk.blue("\nCreating archive..."));
    await createArchive(playlistDir, zipDir, sanitized);
    await fs.remove(playlistDir);
    console.log(chalk.gray("🧹 Raw files removed."));
  } else {
    console.log(chalk.gray(`\n✅ Videos kept in downloads/playlist/${sanitized}`));
  }
}

/* ==========================
   MAIN MENU
   ========================== */
(async () => {
  try {
    console.clear();
    console.log(chalk.cyan.bold("╔════════════════════════════════════════╗"));
    console.log(chalk.cyan.bold("║        YouTube Downloader CLI         ║"));
    console.log(chalk.cyan.bold("║          by Mahesh Technicals         ║"));
    console.log(chalk.cyan.bold("╚════════════════════════════════════════╝\n"));

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

    console.log(chalk.bold.green("\n🎉 All Done!"));
  } catch (err) {
    console.error(chalk.red("\n❌ Unexpected Error:"), err);
    process.exit(1);
  }
})();
