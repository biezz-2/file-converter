import { NextRequest, NextResponse } from 'next/server';
import { convertImage } from '@/lib/engine/image';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const files = formData.getAll('files') as File[];
        const outputFormat = formData.get('format') as string;

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files provided' }, { status: 400 });
        }

        // For now, handle single file conversion in this endpoint
        // We can expand this to multiple files later
        const file = files[0];
        const buffer = Buffer.from(await file.arrayBuffer());

        // Check if it's an image
        if (file.type.startsWith('image/')) {
            const resultBuffer = await convertImage(buffer, outputFormat);

            return new NextResponse(resultBuffer as any, {
                headers: {
                    'Content-Type': `image/${outputFormat}`,
                    'Content-Disposition': `attachment; filename="converted.${outputFormat}"`,
                },
            });
        }

        // Handle video and audio conversion
        if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
            const { convertMedia } = await import('@/lib/engine/media');
            const resultBuffer = await convertMedia(buffer, outputFormat);

            const contentType = file.type.startsWith('video/') ? `video/${outputFormat}` : `audio/${outputFormat}`;
            return new NextResponse(resultBuffer as any, {
                headers: {
                    'Content-Type': contentType,
                    'Content-Disposition': `attachment; filename="converted.${outputFormat}"`,
                },
            });
        }

        return NextResponse.json({ error: 'Unsupported file type. We currently support images, video, and audio.' }, { status: 400 });
    } catch (error: any) {
        console.error('Conversion error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
