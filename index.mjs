#!/usr/bin/env node
import inquirer from "inquirer";
import { execSync } from "child_process";
import fs from "fs-extra";
import chalk from "chalk";
import ora from "ora";
import archiver from "archiver";
import path from "path";
import { fileURLToPath } from "url";
import ytdlp from "yt-dlp-exec";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === Fetch playlist info ===
async function getPlaylistInfo(url) {
  try {
    const result = await ytdlp(url, {
      dumpSingleJson: true,
      flatPlaylist: true
    });
    return result.entries.map(v => ({
      title: v.title || "Unknown Title",
      url: `https://www.youtube.com/watch?v=${v.id}`
    }));
  } catch (error) {
    console.error(chalk.red("❌ Failed to fetch playlist info:"), error.message);
    process.exit(1);
  }
}

// === Download a single video ===
async function downloadVideo(video, outputDir) {
  const spinner = ora(chalk.cyan(`Downloading: ${video.title}`)).start();
  try {
    const sanitizedTitle = video.title.replace(/[<>:"/\\|?*]+/g, "");
    const outputPath = path.join(outputDir, `${sanitizedTitle}.mp4`);
    await ytdlp(video.url, {
      output: outputPath,
      format: "bestvideo+bestaudio/best",
      mergeOutputFormat: "mp4"
    });
    spinner.succeed(chalk.green(`✅ Downloaded: ${video.title}`));
  } catch (error) {
    spinner.fail(chalk.red(`❌ Failed: ${video.title}`));
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
╔═══════════════════════════════════╗
║     🎬 YOUTUBE PLAYLIST DOWNLOADER ║
╚═══════════════════════════════════╝
  by MaheshTechnicals
  `));

  // Ask for playlist URL
  const { playlistURL } = await inquirer.prompt([
    {
      type: "input",
      name: "playlistURL",
      message: chalk.yellow("Enter YouTube Playlist URL:"),
      validate: input => input.startsWith("http") || "Please enter a valid URL"
    }
  ]);

  console.log(chalk.blue("\nFetching playlist info..."));
  const videos = await getPlaylistInfo(playlistURL);
  console.log(chalk.green(`\n✅ Found ${videos.length} videos!\n`));

  // Ask which videos to download
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

  // Prepare download directory
  const outputDir = path.join(__dirname, "downloads");
  await fs.ensureDir(outputDir);

  // Download each selected video
  for (const video of selectedVideos) {
    await downloadVideo(video, outputDir);
  }

  // Create ZIP archive
  const zipFile = path.join(__dirname, "playlist.zip");
  console.log(chalk.yellow("\nCreating ZIP file..."));
  await createZip(outputDir, zipFile);
  console.log(chalk.green(`\n📦 Created ZIP: ${zipFile}`));

  // Cleanup
  await fs.remove(outputDir);
  console.log(chalk.gray("🧹 Cleaned up raw video files."));
  console.log(chalk.bold.green("\n🎉 All Done! Enjoy your videos.\n"));
})().catch(async err => {
  if (err.name === "ExitPromptError") {
    console.log(chalk.red("\n✋ Operation cancelled by user."));
    const outputDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "downloads");
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
