"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { useState, useCallback } from "react"
import { toast } from "react-hot-toast"

export default function ConvertPage() {
    const { data: session } = useSession()
    const [files, setFiles] = useState<File[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [selectedFormat, setSelectedFormat] = useState("")

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const droppedFiles = Array.from(e.dataTransfer.files)
        const validFiles = droppedFiles.filter(file => {
            if (file.size > 1024 * 1024 * 1024) {
                toast.error(`File ${file.name} is too large. Max size is 1GB.`)
                return false
            }
            return true
        })
        setFiles(prev => [...prev, ...validFiles])
    }, [])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files)
            const validFiles = selectedFiles.filter(file => {
                if (file.size > 1024 * 1024 * 1024) {
                    toast.error(`File ${file.name} is too large. Max size is 1GB.`)
                    return false
                }
                return true
            })
            setFiles(prev => [...prev, ...validFiles])
        }
    }, [])

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleConvert = async () => {
        if (files.length === 0 || !selectedFormat) return

        setIsProcessing(true)
        setError(null)

        try {
            const formData = new FormData()
            files.forEach(file => formData.append('files', file))
            formData.append('format', selectedFormat)

            const response = await fetch('/api/convert', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Conversion failed')
            }

            // Download the file
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `converted.${selectedFormat}`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 lg:p-24">
            <h1 className="text-4xl font-bold mb-2">File Converter</h1>
            <p className="text-gray-400 mb-8">Upload your files up to <span className="text-blue-400 font-semibold">1GB</span> to convert them to different formats.</p>

            {!session && (
                <div className="w-full max-w-2xl mb-6 p-4 rounded-lg bg-blue-900/20 border border-blue-500/30 backdrop-blur-sm">
                    <p className="text-sm text-blue-300 text-center">
                        💡 <Link href="/login" className="font-semibold underline hover:text-blue-200">Login</Link> untuk menyimpan history konversi Anda
                    </p>
                </div>
            )}

            {error && (
                <div className="w-full max-w-2xl mb-6 p-4 rounded-lg bg-red-900/20 border border-red-500/30 backdrop-blur-sm">
                    <p className="text-sm text-red-300 text-center">{error}</p>
                </div>
            )}

            <div className="w-full max-w-2xl mb-12">
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`relative p-12 border-2 border-dashed rounded-xl transition-all ${isDragging
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 bg-gray-900/50'
                        } backdrop-blur-sm`}
                >
                    <input
                        type="file"
                        multiple
                        onChange={handleFileInput}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isProcessing}
                    />
                    <div className="text-center pointer-events-none">
                        <svg className="mx-auto h-12 w-12 text-gray-500 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="text-gray-500">Drag and drop files here, or click to select files</p>
                        <p className="text-gray-600 text-sm mt-2">Support for images, documents, videos, and audio (Max 1GB per file)</p>
                    </div>
                </div>

                {files.length > 0 && (
                    <div className="mt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Selected Files ({files.length})</h3>
                            <button
                                onClick={() => setFiles([])}
                                className="text-sm text-red-400 hover:text-red-300 transition-colors"
                                disabled={isProcessing}
                            >
                                Clear All
                            </button>
                        </div>

                        <div className="space-y-3 mb-6">
                            {files.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                                    <div className="flex-1 min-w-0 mr-4">
                                        <p className="text-sm font-medium text-white truncate">{file.name}</p>
                                        <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                                    </div>
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="text-gray-400 hover:text-red-400 transition-colors"
                                        title="Remove file"
                                        disabled={isProcessing}
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <select
                                value={selectedFormat}
                                onChange={(e) => setSelectedFormat(e.target.value)}
                                className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-500 text-white"
                                disabled={isProcessing}
                            >
                                <option value="">Select output format</option>
                                <optgroup label="Images">
                                    <option value="png">PNG</option>
                                    <option value="jpg">JPG</option>
                                    <option value="webp">WebP</option>
                                    <option value="gif">GIF</option>
                                </optgroup>
                                <optgroup label="Documents">
                                    <option value="pdf">PDF</option>
                                    <option value="docx">DOCX</option>
                                    <option value="txt">TXT</option>
                                </optgroup>
                                <optgroup label="Audio">
                                    <option value="mp3">MP3</option>
                                    <option value="wav">WAV</option>
                                    <option value="flac">FLAC</option>
                                </optgroup>
                                <optgroup label="Video">
                                    <option value="mp4">MP4</option>
                                    <option value="webm">WebM</option>
                                    <option value="avi">AVI</option>
                                </optgroup>
                            </select>

                            <button
                                onClick={handleConvert}
                                disabled={!selectedFormat || isProcessing}
                                className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold transition-all shadow-lg shadow-blue-500/25 disabled:shadow-none flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Converting...
                                    </>
                                ) : (
                                    `Convert ${files.length} file${files.length > 1 ? 's' : ''}`
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <SpecificConverters />
            <Link href="/" className="mt-8 text-blue-500 hover:text-blue-400 hover:underline">
                &larr; Back to Home
            </Link>
        </div>
    )
}

function SpecificConverters() {
    const [isOpen, setIsOpen] = useState(true);

    const converters = [
        "DJV Converter", "EPS Converter", "PPM Converter",
        "ART Converter", "DPX Converter", "WMZ Converter",
        "DDS Converter", "HEIC Converter", "AVIF Converter",
        "PCX Converter", "TIF Converter", "JPEG Converter",
        "EMZ Converter", "TGA Converter", "DIB Converter",
        "DJVU Converter", "CBZ Converter", "HEIF Converter",
        "JXL Converter", "ICO Converter", "CBR Converter",
        "JFIF Converter", "PSB Converter", "ARW Converter",
        "X3F Converter", "Panasonic RAW Converter", "NRW Converter",
        "NEF Converter", "RWL Converter", "Sigma RAW Converter",
        "K25 Converter", "Kodak RAW Converter", "CRW Converter",
        "DCS Converter", "DRF Converter", "CR3 Converter",
        "Canon RAW Converter", "ORF (Olympus Raw) Converter", "DCR Converter",
        "RAW Converter", "Sony RAW Converter", "CR2 Converter",
        "RW2 Converter", "Pentax RAW Converter", "Samsung RAW Converter",
        "SRW Converter", "PEF Converter", "RAF Converter",
        "DNG Converter", "KDC Converter", "SRF Converter",
        "PTX Converter", "Leica RAW Converter", "SR2 Converter",
        "Nikon RAW Converter", "PSD Converter", "SVG Converter",
        "WebP Converter", "GIF Converter", "ODD Converter",
        "PNG Converter", "BMP Converter", "JPG Converter",
        "TIFF Converter"
    ];

    return (
        <div className="w-full max-w-4xl mt-12 mb-24 overflow-hidden rounded-xl bg-gray-900/40 border border-gray-700/50 backdrop-blur-md">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors group"
            >
                <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">Specific image converters</h2>
                <svg
                    className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                <div className="p-6 pt-0 border-t border-gray-800/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 mt-4">
                        {converters.map((name, index) => (
                            <Link
                                key={index}
                                href={`/convert?to=${name.split(' ')[0].toLowerCase()}`}
                                className="text-sm text-blue-400/80 hover:text-blue-300 py-1 transition-all hover:translate-x-1 flex items-center gap-2"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500/30"></span>
                                {name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
