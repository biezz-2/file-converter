import sharp from 'sharp';

export async function convertImage(
    inputBuffer: Buffer,
    outputFormat: string,
    options: { quality?: number; width?: number; height?: number } = {}
): Promise<Buffer> {
    let pipeline = sharp(inputBuffer);

    if (options.width || options.height) {
        pipeline = pipeline.resize(options.width, options.height, {
            fit: 'inside',
            withoutEnlargement: true,
        });
    }

    const quality = options.quality || 80;

    switch (outputFormat.toLowerCase()) {
        case 'jpg':
        case 'jpeg':
            return await pipeline.jpeg({ quality }).toBuffer();
        case 'png':
            return await pipeline.png({ quality }).toBuffer();
        case 'webp':
            return await pipeline.webp({ quality }).toBuffer();
        case 'avif':
            return await pipeline.avif({ quality }).toBuffer();
        case 'gif':
            return await pipeline.gif().toBuffer();
        case 'tiff':
            return await pipeline.tiff({ quality }).toBuffer();
        default:
            throw new Error(`Unsupported output format: ${outputFormat}`);
    }
}

export async function compressImage(
    inputBuffer: Buffer,
    level: 'low' | 'medium' | 'high'
): Promise<Buffer> {
    const qualityMap = {
        low: 80,
        medium: 60,
        high: 40,
    };

    const quality = qualityMap[level];

    // By default, we detect the input format or just use sharp's auto-optimization
    // For simplicity, we convert to the same format but with optimized settings
    const metadata = await sharp(inputBuffer).metadata();
    const format = metadata.format;

    if (!format) throw new Error('Could not detect image format');

    return await convertImage(inputBuffer, format, { quality });
}
