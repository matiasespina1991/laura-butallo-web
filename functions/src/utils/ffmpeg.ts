import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

/**
 * Transcode a video inputPath to a single WebM outputPath with given resolution and quality settings.
 * VP9 + Opus codec as requested.
 */
export function transcodeToWebM(
  inputPath: string,
  outputPath: string,
  height: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-c:v libvpx-vp9',
        '-b:v 0',
        '-crf 30',
        `-vf scale=-2:${height}`,
        '-c:a libopus',
        '-threads 2',
      ])
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
}

/**
 * Generate single thumbnail (poster)from video at time 1s
 */

export function generateThumbnail(
  inputPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        timestamps: ['1'],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '1280x?',
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err));
  });
}

/**
 * Extract metadata (duration, codec, bitrate, width/height)
 */
export function probeMetadata(inputPath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}
