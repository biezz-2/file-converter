"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Loader2, Download, Youtube, Music, Video, AlertCircle } from "lucide-react"
import toast from "react-hot-toast"

interface VideoInfo {
    title: string
    thumbnail: string
    duration: number
    author: string
    videoFormats: Array<{ qualityLabel: string; height: number; width: number; fps: number; itag: number; mimeType: string }>
    audioFormats: Array<{ qualityLabel: string; audioQuality: string; itag: number; mimeType: string }>
}

export default function YouTubePage() {
    const { data: session } = useSession()
    const [url, setUrl] = useState("")
    const [loading, setLoading] = useState(false)
    const [downloading, setDownloading] = useState(false)
    const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
    const [selectedFormat, setSelectedFormat] = useState<"mp4" | "mp3">("mp4")
    const [selectedQuality, setSelectedQuality] = useState<string>("")

    const handleFetchInfo = async () => {
        if (!url) {
            toast.error("Please enter a YouTube URL")
            return
        }

        setLoading(true)
        setVideoInfo(null)
        setSelectedQuality("")

        try {
            const response = await fetch("/api/youtube", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url, action: "info" }),
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to fetch video info")

            setVideoInfo(data)

            // Set default quality (highest video resolution)
            if (data.videoFormats && data.videoFormats.length > 0) {
                setSelectedQuality(data.videoFormats[0].itag.toString())
            }

            toast.success("Video info fetched successfully!")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = async () => {
        if (!videoInfo) return

        setDownloading(true)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 120000) // 120s timeout for high-res

        try {
            const response = await fetch("/api/youtube", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url,
                    action: "download",
                    format: selectedFormat,
                    quality: selectedFormat === "mp4" ? selectedQuality : "highest"
                }),
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                const data = await response.json()
                const errorMessage = data.error || "Download failed. YouTube might be blocking the request."

                if (response.status === 403) {
                    toast.error(
                        <div>
                            <p className="font-bold">YouTube Memblokir Permintaan (403)</p>
                            <p className="text-xs mt-1">Cobalah resolusi yang lebih rendah atau format MP3. YouTube sering memblokir pengunduhan kualitas 4K/8K secara langsung.</p>
                        </div>,
                        { duration: 6000 }
                    )
                } else {
                    throw new Error(errorMessage)
                }
                return
            }

                // API returns a JSON with the direct CDN URL. Navigate to it to start download.
                const data = await response.json()
                const downloadUrl = data?.downloadUrl
                if (!downloadUrl) throw new Error('No download URL returned')

                // Open the URL to let the browser handle the download (or navigation)
                try {
                    window.location.href = downloadUrl
                } catch (err) {
                    // Fallback to opening in a new tab/window
                    window.open(downloadUrl, '_blank')
                }

                toast.success("Download started!")
        } catch (error: any) {
            if (error.name === 'AbortError') {
                toast.error("Download timed out. High resolution videos take longer to process.")
            } else {
                toast.error(error.message || "An unexpected error occurred")
            }
            console.error("Download error:", error)
        } finally {
            setDownloading(false)
            clearTimeout(timeoutId)
        }
    }


    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-8 lg:p-24 relative overflow-hidden bg-slate-950 text-white">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/10 blur-[120px] rounded-full animate-pulse delay-1000" />
            </div>

            <div className="z-10 w-full max-w-2xl text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 mb-6 backdrop-blur-md">
                    <Youtube className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-semibold text-red-100">YouTube Downloader</span>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                    Premium <span className="text-red-500">YouTube</span> Tool
                </h1>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                    Download any YouTube video or audio in high quality with just one click.
                </p>

                {!session && (
                    <div className="w-full mb-6 p-4 rounded-xl bg-blue-900/20 border border-blue-500/20 backdrop-blur-sm flex items-center justify-center gap-2 transition-all hover:bg-blue-900/30">
                        <AlertCircle className="w-4 h-4 text-blue-400" />
                        <p className="text-sm text-blue-300">
                            <Link href="/login" className="font-bold underline hover:text-blue-200 decoration-blue-500/50">Login</Link> untuk menyimpan riwayat download Anda.
                        </p>
                    </div>
                )}

                <div className="w-full space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1 group">
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Tempel URL YouTube di sini..."
                                className="w-full pl-4 pr-12 py-4 rounded-2xl bg-slate-900/50 border border-slate-800 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all text-slate-100 placeholder:text-slate-500 backdrop-blur-md group-hover:bg-slate-900/80"
                            />
                        </div>
                        <button
                            onClick={handleFetchInfo}
                            disabled={loading || !url}
                            className="px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 active:scale-95"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Ambil Info"}
                        </button>
                    </div>

                    {videoInfo && (
                        <div className="mt-8 p-6 rounded-3xl bg-slate-900/40 border border-slate-800 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="w-full md:w-56 shrink-0 aspect-video rounded-2xl overflow-hidden border border-slate-700/50 group relative">
                                    <img
                                        src={videoInfo.thumbnail}
                                        alt={videoInfo.title}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                    />
                                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-bold">
                                        {Math.floor(videoInfo.duration / 60)}:{(videoInfo.duration % 60).toString().padStart(2, '0')}
                                    </div>
                                </div>
                                <div className="flex-1 text-left space-y-4">
                                    <div>
                                        <h3 className="font-bold text-lg line-clamp-2 text-slate-100 group-hover:text-red-400 transition-colors">
                                            {videoInfo.title}
                                        </h3>
                                        <p className="text-sm text-slate-400 mt-1">{videoInfo.author}</p>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <div className="flex p-1 rounded-xl bg-slate-800/50 border border-slate-700/50 w-full">
                                            <button
                                                onClick={() => setSelectedFormat("mp4")}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all font-semibold text-sm ${selectedFormat === "mp4"
                                                    ? "bg-red-600 text-white shadow-md shadow-red-900/40"
                                                    : "text-slate-400 hover:text-slate-200"
                                                    }`}
                                            >
                                                <Video className="w-4 h-4" /> MP4 Video
                                            </button>
                                            <button
                                                onClick={() => setSelectedFormat("mp3")}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all font-semibold text-sm ${selectedFormat === "mp3"
                                                    ? "bg-red-600 text-white shadow-md shadow-red-900/40"
                                                    : "text-slate-400 hover:text-slate-200"
                                                    }`}
                                            >
                                                <Music className="w-4 h-4" /> MP3 Audio
                                            </button>
                                        </div>

                                        {selectedFormat === "mp4" && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Pilih Resolusi (Dengan Audio)</label>
                                                <select
                                                    value={selectedQuality}
                                                    onChange={(e) => setSelectedQuality(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 focus:outline-none focus:border-red-500 transition-all text-slate-200"
                                                >
                                                    {videoInfo.videoFormats.map((f) => (
                                                        <option key={f.itag} value={f.itag}>
                                                            {f.qualityLabel} ({f.height}p) - {f.fps}fps
                                                        </option>
                                                    ))}
                                                </select>
                                                <p className="text-xs text-slate-400 mt-2">
                                                    ℹ️ Audio berkualitas tinggi akan digabungkan secara otomatis dengan video menggunakan FFmpeg
                                                </p>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleDownload}
                                            disabled={downloading || (selectedFormat === "mp4" && !selectedQuality)}
                                            className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-xl shadow-red-600/10 active:scale-95 disabled:opacity-50"
                                        >
                                            {downloading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Sedang Mengunduh...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-5 h-5" />
                                                    Download Sekarang
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <Link href="/" className="mt-12 inline-flex items-center text-slate-500 hover:text-white transition-colors gap-2 group">
                    <span className="group-hover:-translate-x-1 transition-transform">&larr;</span> Kembali ke Beranda
                </Link>
            </div>
        </div>
    )
}

