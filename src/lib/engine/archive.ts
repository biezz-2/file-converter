import archiver from 'archiver';
import { PassThrough } from 'stream';

export async function createZipArchive(
    files: Array<{ name: string; buffer: Buffer }>
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const archive = archiver('zip', {
            zlib: { level: 9 }, // Sets the compression level.
        });

        const buffers: Buffer[] = [];
        const stream = new PassThrough();

        stream.on('data', (chunk) => buffers.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(buffers)));
        stream.on('error', reject);

        archive.pipe(stream);

        for (const file of files) {
            archive.append(file.buffer, { name: file.name });
        }

        archive.finalize();
    });
}
