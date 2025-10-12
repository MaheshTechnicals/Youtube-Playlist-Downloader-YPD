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

// Force yt-dlp to use system executable
ytdlp.options = { executablePath: "yt-dlp" };

// === Fetch playlist info ===
async function getPlaylistInfo(url) {
  try {
    const result = await ytdlp(url, {
      dumpSingleJson: true,
      flatPlaylist: true
    });
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

// === Download a single video ===
async function downloadVideo(video, outputDir, index, total) {
  const sanitizedTitle = video.title.replace(/[<>:"/\\|?*]+/g, "");
  const outputPath = path.join(outputDir, `${sanitizedTitle}.mp4`);

  console.log(chalk.cyan(`\n[${index}/${total}] Downloading: ${video.title}`));

  try {
    await ytdlp(video.url, {
      output: outputPath,
      format: "bestvideo+bestaudio/best",
      mergeOutputFormat: "mp4"
    });
    console.log(chalk.green(`[${index}/${total}] ✅ Completed: ${video.title}`));
    return sanitizedTitle;
  } catch (err) {
    console.log(chalk.red(`[${index}/${total}] ❌ Failed: ${video.title}`));
    return null;
  }
}

// === Create ZIP file ===
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

// === Main Runner ===
(async () => {
  console.clear();
  console.log(chalk.bold.cyan(`
╔═════════════════════════════════════════════╗
║   🎬 YPD - YouTube Playlist Downloader      ║
║   🎥 Download & manage playlists easily     ║
╚═════════════════════════════════════════════╝
        by MaheshTechnicals
  `));

  // Playlist URL
  const { playlistURL } = await inquirer.prompt([
    {
      type: "input",
      name: "playlistURL",
      message: chalk.yellow("Enter YouTube Playlist URL:"),
      validate: input => input.startsWith("http") || "Please enter a valid URL"
    }
  ]);

  console.log(chalk.blue("\nFetching playlist info..."));
  const { title: playlistTitle, videos } = await getPlaylistInfo(playlistURL);
  console.log(chalk.green(`\n✅ Found ${videos.length} videos in playlist: "${playlistTitle}"\n`));

  // Video selection
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

  const outputDir = path.join(__dirname, "downloads");
  await fs.ensureDir(outputDir);

  // Download each selected video
  console.log(chalk.blue("\nStarting downloads...\n"));
  let counter = 0;
  for (const video of selectedVideos) {
    counter++;
    await downloadVideo(video, outputDir, counter, selectedVideos.length);
  }

  // Ask user if they want to zip
  const { zipChoice } = await inquirer.prompt([
    {
      type: "confirm",
      name: "zipChoice",
      message: chalk.yellow("\nDo you want to zip the downloaded videos?"),
      default: true
    }
  ]);

  if (zipChoice) {
    const sanitizedPlaylist = playlistTitle.replace(/[<>:"/\\|?*]+/g, "");
    const zipFile = path.join(__dirname, `${sanitizedPlaylist}.zip`);
    console.log(chalk.blue("\nCreating ZIP file..."));
    await createZip(outputDir, zipFile);
    console.log(chalk.green(`\n📦 ZIP created: ${zipFile}`));
    await fs.remove(outputDir);
    console.log(chalk.gray("🧹 Raw video files removed."));
  } else {
    console.log(chalk.gray("\n✅ Videos kept in downloads folder, no ZIP created."));
  }

  console.log(chalk.bold.green("\n🎉 All Done! Enjoy your videos.\n"));
})().catch(async err => {
  if (err.name === "ExitPromptError") {
    console.log(chalk.red("\n✋ Operation cancelled by user."));
    const outputDir = path.join(__dirname, "downloads");
    if (await fs.pathExists(outputDir)) {
      await fs.remove(outputDir);
      console.log(chalk.gray("🧹 Cleaned up partial downloads."));
    }
    process.exit(0);
  } else {
    console.error(chalk.red("\n❌ Unexpected Error:"), err);
    process.exit(1);
  }
});
