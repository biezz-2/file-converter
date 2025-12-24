import { NextRequest, NextResponse } from 'next/server';
import { Innertube, UniversalCache } from 'youtubei.js';
import { Jinter } from 'jintr';
import { execSync, exec } from 'child_process';
import * as util from 'util';

const execPromise = util.promisify(exec);

let yt: Innertube | null = null;

async function getInnertube() {
    if (!yt) {
        console.log('[YouTube] Initializing Innertube...');
        try {
            yt = await Innertube.create({
                cache: new UniversalCache(false),
                generate_session_locally: true
            });

            (yt.session as any).on('js-eval', (payload: { code: string; result: any }) => {
                try {
                    const evaluator = new (Jinter as any)(payload.code);
                    payload.result = evaluator.interpret();
                } catch (err: any) {
                    console.error('[YouTube] Signature deciphering failed:', err.message);
                }
            });
        } catch (err: any) {
            console.error('[YouTube] Innertube creation failed:', err.message);
            yt = null;
            throw err;
        }
    }
    return yt;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { url, videoId: providedVideoId, action, format, quality } = body;

        // Accept either url or videoId directly
        let videoId = '';
        
        if (providedVideoId) {
            // If videoId provided directly, use it
            videoId = providedVideoId;
        } else if (url) {
            // If URL provided, extract videoId from it
            try {
                const u = new URL(url);
                if (u.hostname === 'youtu.be') {
                    videoId = u.pathname.slice(1);
                } else if (u.hostname.includes('youtube.com')) {
                    videoId = u.searchParams.get('v') || '';
                    if (!videoId && u.pathname.startsWith('/shorts/')) {
                        videoId = u.pathname.split('/')[2];
                    }
                }
            } catch (e) {
                videoId = url;
            }
        }

        // Clean video ID
        if (videoId?.includes('?')) {
            videoId = videoId.split('?')[0];
        }

        if (!videoId || videoId.length < 10) {
            return NextResponse.json({ error: 'Invalid video ID - provide either url or videoId parameter' }, { status: 400 });
        }

        const innertube = await getInnertube();

        console.log(`[YouTube] Action: ${action}, VideoID: ${videoId}`);

        if (action === 'info') {
            try {
                const info = await innertube.getInfo(videoId);
                
                const allFormats = [
                    ...(info.streaming_data?.formats || []),
                    ...(info.streaming_data?.adaptive_formats || [])
                ];

                const videoFormats = allFormats.filter((f: any) => {
                    const mime = f.mime_type || '';
                    return mime.includes('video') && !mime.includes('audio');
                }).sort((a: any, b: any) => (b.height || 0) - (a.height || 0));

                const audioFormats = allFormats.filter((f: any) => {
                    const mime = f.mime_type || '';
                    return mime.includes('audio') && !mime.includes('video');
                }).sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

                console.log(`[YouTube] Found ${videoFormats.length} video formats and ${audioFormats.length} audio formats`);

                return NextResponse.json({
                    title: info.basic_info?.title || 'Video',
                    thumbnail: info.basic_info?.thumbnail?.[0]?.url || '',
                    duration: info.basic_info?.duration || 0,
                    author: info.basic_info?.author || 'Unknown',
                    videoFormats: videoFormats.map((f: any) => ({
                        qualityLabel: f.quality_label || `${f.height}p` || 'N/A',
                        height: f.height,
                        width: f.width,
                        fps: f.fps,
                        itag: f.itag
                    })),
                    audioFormats: audioFormats.map((f: any) => ({
                        qualityLabel: f.audio_quality || 'Best',
                        bitrate: f.bitrate,
                        itag: f.itag
                    }))
                });
            } catch (err: any) {
                console.error('[YouTube] Info error:', err.message);
                // Return graceful fallback
                return NextResponse.json({
                    title: 'Video',
                    thumbnail: '',
                    duration: 0,
                    author: 'Unknown',
                    videoFormats: [],
                    audioFormats: [],
                    error: 'Parser errors (non-critical)'
                });
            }
        }

        if (action === 'download') {
            try {
                console.log('[YouTube] Getting video info for download...');
                const info = await innertube.getInfo(videoId);
                const title = (info.basic_info?.title || 'video').replace(/[^\w\s]/gi, '').substring(0, 100);

                const allFormats = [
                    ...(info.streaming_data?.formats || []),
                    ...(info.streaming_data?.adaptive_formats || [])
                ];

                console.log(`[YouTube] Total formats available: ${allFormats.length}`);
                if (allFormats.length > 0) {
                    console.log(`[YouTube] Sample format keys: ${Object.keys(allFormats[0]).slice(0, 10).join(', ')}`);
                }

                // Helper function to get download URL via yt-dlp
                const getDownloadUrl = async (formatSpec: string): Promise<string> => {
                    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
                    const ytdlpPath = process.platform === 'win32' 
                        ? String.raw`F:\ATTABI\project\website\converter\.venv\Scripts\yt-dlp.exe`
                        : 'yt-dlp';
                    
                    const command = `"${ytdlpPath}" -f "${formatSpec}" -g "${youtubeUrl}"`;
                    console.log(`[YouTube] Executing: ${command.substring(0, 100)}...`);
                    
                    try {
                        const { stdout } = await execPromise(
                            command,
                            { 
                                timeout: 45000, 
                                maxBuffer: 1024 * 1024,
                                encoding: 'utf-8'
                            } as any
                        );
                        
                        const downloadUrl = (typeof stdout === 'string' ? stdout : stdout.toString()).trim().split('\n')[0];
                        if (!downloadUrl || !downloadUrl.startsWith('http')) {
                            throw new Error(`Invalid URL from yt-dlp: ${downloadUrl}`);
                        }
                        return downloadUrl;
                    } catch (error: any) {
                        console.log(`[YouTube] yt-dlp error: ${error.message.substring(0, 150)}`);
                        throw error;
                    }
                };

                // Handle MP3 audio download
                if (format === 'mp3') {
                    console.log('[YouTube] Downloading audio as MP3...');
                    try {
                        const downloadUrl = await getDownloadUrl('ba'); // best audio
                        console.log('[YouTube] yt-dlp returned valid audio URL');
                        return NextResponse.json({ downloadUrl });
                    } catch (err: any) {
                        console.log(`[YouTube] Audio download failed: ${err.message}`);
                        throw err;
                    }
                } else {
                    // Handle MP4 video download
                    console.log(`[YouTube] Downloading video (quality: ${quality})...`);
                    
                    const targetItag = parseInt(quality);
                    let selectedFormat = null;

                    if (!isNaN(targetItag)) {
                        selectedFormat = allFormats.find((f: any) => f.itag === targetItag);
                        console.log(`[YouTube] Using itag: ${targetItag}`);
                    } else {
                        const videoFormats = allFormats.filter((f: any) => {
                            const mime = f.mime_type || '';
                            return mime.includes('video') && !mime.includes('audio');
                        }).sort((a: any, b: any) => (b.height || 0) - (a.height || 0));

                        selectedFormat = videoFormats[0];
                        console.log(`[YouTube] Using best quality: ${selectedFormat?.height}p`);
                    }

                    if (!selectedFormat) {
                        throw new Error('No suitable video format found');
                    }

                    console.log(`[YouTube] Video format keys: ${Object.keys(selectedFormat).join(', ')}`);

                    // Map itags to yt-dlp format codes
                    const itagToFormat: {[key: number | string]: string} = {
                        18: 'worst',  // Low quality
                        22: '22',     // 720p
                        137: '137',   // 1080p
                        248: '248',   // 1080p VP9
                        299: '299',   // 1080p60
                        304: '304',   // 1440p60
                        313: '313',   // 4K
                        315: '315'    // 8K
                    };
                    
                    const itag = (selectedFormat as any).itag;
                    const formatSpec = itagToFormat[itag] || 'best[ext=mp4]/best';
                    
                    try {
                        console.log('[YouTube] Using yt-dlp to obtain download URL...');
                        const downloadUrl = await getDownloadUrl(formatSpec);
                        console.log('[YouTube] yt-dlp returned valid video URL');
                        return NextResponse.json({ downloadUrl });
                    } catch (err: any) {
                        console.log(`[YouTube] Video download failed: ${err.message}`);
                        throw err;
                    }
                }
            } catch (err: any) {
                console.error('[YouTube] Download error:', err.message);
                return NextResponse.json({
                    error: err.message || 'Download failed',
                    details: err.stack
                }, { status: 500 });
            }
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('YouTube error:', error.message);
        return NextResponse.json({
            error: error.message || 'Internal server error',
            details: error.stack
        }, { status: 500 });
    }
}
