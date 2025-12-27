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
function buildVideoFilter(height: number) {
  // Tone-map HDR sources to SDR Rec.709 to avoid brightness shifts.
  return [
    'zscale=transfer=linear:npl=100',
    'tonemap=hable:desat=0',
    'zscale=transfer=bt709:primaries=bt709:matrix=bt709',
    `scale=-2:${height}:flags=lanczos`,
    'format=yuv420p'
  ].join(',');
}

function buildPosterFilter() {
  // Match video tone-mapping for consistent posters.
  return [
    'zscale=transfer=linear:npl=100',
    'tonemap=hable:desat=0',
    'zscale=transfer=bt709:primaries=bt709:matrix=bt709',
    'scale=1280:-2:flags=lanczos',
    'format=yuv420p'
  ].join(',');
}

export function transcodeToWebM(
  inputPath: string,
  outputPath: string,
  height: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-an',
        '-c:v libvpx-vp9',
        '-b:v 0',
        '-crf 30',
        `-vf ${buildVideoFilter(height)}`,
        '-pix_fmt yuv420p',
        '-colorspace bt709',
        '-color_primaries bt709',
        '-color_trc bt709'
      ])
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
}

/**
 * Generate single thumbnail (poster)from video at time 1s
 */

export function generatePoster(
  inputPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([`-vf ${buildPosterFilter()}`])
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
