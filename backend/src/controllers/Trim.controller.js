import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set the path automatically using the installer
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export const trimVideo = (req, res) => {
  const { filePath, audioPath, startTime, endTime } = req.body;
  console.log("BODY RECEIVED:", req.body);
  console.log("--- DEBUG START ---");
  console.log("Video Path Received:", filePath);
  console.log("Audio Path Received:", audioPath); // If this is undefined, the issue is in React
  console.log("Start Time:", startTime, "End Time:", endTime);
  console.log("--- DEBUG END ---");
  if (!filePath || startTime === undefined || endTime === undefined) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const duration = endTime - startTime;
  if (duration <= 0) {
    return res
      .status(400)
      .json({ error: "End time must be greater than start time" });
  }

  const outputDir = path.resolve(
    __dirname,
    "..",
    "..",
    "public",
    "Uploads",
    "Trimmed"
  );
  const outputName = `video-trimmed-${Date.now()}.mp4`;
  const outputPath = path.join(outputDir, outputName);

  // Cleanup logic
  try {
    if (fs.existsSync(outputDir)) {
      const files = fs.readdirSync(outputDir);
      for (const file of files) {
        fs.unlinkSync(path.join(outputDir, file));
      }
    }
  } catch (err) {
    console.error("Cleanup error:", err);
  }

  const inputPath = path.resolve(filePath);
  let command = ffmpeg(inputPath).setStartTime(startTime).setDuration(duration);

  // --- THE MERGE LOGIC ---
// --- THE MERGE LOGIC ---
if (audioPath) {
  const absoluteAudioPath = path.resolve(audioPath);
  console.log("Merging with audio track:", absoluteAudioPath);

  command = command.input(absoluteAudioPath).outputOptions([
    "-map 0:v:0", 
    "-map 1:a:0", 
    "-c:v libx264", 
    "-preset ultrafast", 
    "-crf 28",           
    "-c:a aac", 
    "-shortest", 
  ]);
} else {
  command = command.outputOptions([
    "-c:v libx264",
    "-preset ultrafast",
    "-crf 28",
    "-c:a aac"
  ]);
}

  // Final Execution
  command
    .on("start", (cmd) => console.log("FFmpeg Command:", cmd))
    .on("error", (err) => {
      console.error("FFmpeg Error:", err.message);
      res
        .status(500)
        .json({ error: "Processing failed", details: err.message });
    })
    .on("end", () => {
      console.log("Finished processing:", outputName);
      res.status(200).json({
        success: true,
        message: audioPath ? "Video trimmed and audio merged" : "Video trimmed",
        data: {
          trimmedPath: `Uploads/Trimmed/${outputName}`,
          fileName: outputName,
        },
      });
    })
    .save(outputPath);
};
