import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { PassThrough } from 'stream';

// Set ffmpeg path
if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
}

export async function convertMedia(
    inputBuffer: Buffer,
    outputFormat: string,
    options: { audioBitrate?: string; videoBitrate?: string } = {}
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const inputStream = new PassThrough();
        inputStream.end(inputBuffer);

        const outputStream = new PassThrough();
        const chunks: Buffer[] = [];

        outputStream.on('data', (chunk) => chunks.push(chunk));
        outputStream.on('end', () => resolve(Buffer.concat(chunks)));
        outputStream.on('error', reject);

        let command = ffmpeg(inputStream)
            .toFormat(outputFormat)
            .on('error', (err) => {
                console.error('FFmpeg error:', err);
                reject(err);
            });

        if (options.audioBitrate) {
            command = command.audioBitrate(options.audioBitrate);
        }

        if (options.videoBitrate) {
            command = command.videoBitrate(options.videoBitrate);
        }

        command.pipe(outputStream);
    });
}

export async function extractAudio(
    inputBuffer: Buffer,
    outputFormat: string = 'mp3'
): Promise<Buffer> {
    return convertMedia(inputBuffer, outputFormat, { audioBitrate: '128k' });
}
