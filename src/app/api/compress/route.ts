import { NextRequest, NextResponse } from 'next/server';
import { compressImage } from '@/lib/engine/image';
import { createZipArchive } from '@/lib/engine/archive';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const files = formData.getAll('files') as File[];
        const level = (formData.get('level') as 'low' | 'medium' | 'high') || 'medium';

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files provided' }, { status: 400 });
        }

        if (files.length === 1) {
            const file = files[0];
            const buffer = Buffer.from(await file.arrayBuffer()) as any;

            if (file.type.startsWith('image/')) {
                const resultBuffer = await compressImage(buffer, level);

                return new NextResponse(resultBuffer as any, {
                    headers: {
                        'Content-Type': file.type,
                        'Content-Disposition': `attachment; filename="compressed_${file.name}"`,
                    },
                });
            }
        } else {
            // Multiple files - Create a ZIP
            const processedFiles: Array<{ name: string; buffer: Buffer }> = [];

            for (const file of files) {
                let buffer = Buffer.from(await file.arrayBuffer()) as any;

                if (file.type.startsWith('image/')) {
                    buffer = await compressImage(buffer, level);
                }

                processedFiles.push({ name: file.name, buffer });
            }

            const zipBuffer = await createZipArchive(processedFiles);

            return new NextResponse(zipBuffer as any, {
                headers: {
                    'Content-Type': 'application/zip',
                    'Content-Disposition': `attachment; filename="compressed_files.zip"`,
                },
            });
        }

        return NextResponse.json({ error: 'Unsupported operation' }, { status: 400 });
    } catch (error: any) {
        console.error('Compression error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
