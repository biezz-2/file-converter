"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { useState, useCallback } from "react"
import { toast } from "react-hot-toast"

export default function CompressPage() {
    const { data: session } = useSession()
    const [files, setFiles] = useState<File[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [compressionLevel, setCompressionLevel] = useState("medium")
    const [compressionType, setCompressionType] = useState("quality")

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

    const getSupportedFormatsCount = () => {
        return "300+"
    }

    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleCompress = async () => {
        if (files.length === 0) return

        setIsProcessing(true)
        setError(null)

        try {
            const formData = new FormData()
            files.forEach(file => formData.append('files', file))
            formData.append('level', compressionLevel)

            const response = await fetch('/api/compress', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Compression failed')
            }

            // Download the file
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            // If multiple files, it's a ZIP, otherwise use the filename pattern from backend
            a.download = files.length > 1 ? 'compressed_files.zip' : `compressed_${files[0].name}`
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
            <h1 className="text-4xl font-bold mb-2">File Compressor</h1>
            <p className="text-gray-400 mb-2">Compress your files up to <span className="text-green-400 font-semibold">1GB</span> to reduce size while maintaining quality.</p>
            <p className="text-sm text-gray-500 mb-8">Supports {getSupportedFormatsCount()} file formats</p>

            {!session && (
                <div className="w-full max-w-2xl mb-6 p-4 rounded-lg bg-blue-900/20 border border-blue-500/30 backdrop-blur-sm">
                    <p className="text-sm text-blue-300 text-center">
                        💡 <Link href="/login" className="font-semibold underline hover:text-blue-200">Login</Link> untuk menyimpan history kompresi Anda
                    </p>
                </div>
            )}

            {error && (
                <div className="w-full max-w-2xl mb-6 p-4 rounded-lg bg-red-900/20 border border-red-500/30 backdrop-blur-sm">
                    <p className="text-sm text-red-300 text-center">{error}</p>
                </div>
            )}

            <div className="w-full max-w-2xl">
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`relative p-12 border-2 border-dashed rounded-xl transition-all ${isDragging
                        ? 'border-green-500 bg-green-500/10'
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
                        <svg className="mx-auto h-12 w-12 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-gray-500">Drag and drop files here, or click to select files</p>
                        <p className="text-gray-600 text-sm mt-2">Images, videos, documents, archives, and more (Max 1GB per file)</p>
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

                        <div className="space-y-4 mb-6 p-4 rounded-lg bg-gray-800/30 border border-gray-700">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">Compression Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        disabled={isProcessing}
                                        onClick={() => setCompressionType("quality")}
                                        className={`px-4 py-2 rounded-lg transition-all ${compressionType === "quality"
                                            ? "bg-green-600 text-white"
                                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                            }`}
                                    >
                                        Best Quality
                                    </button>
                                    <button
                                        disabled={isProcessing}
                                        onClick={() => setCompressionType("size")}
                                        className={`px-4 py-2 rounded-lg transition-all ${compressionType === "size"
                                            ? "bg-green-600 text-white"
                                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                            }`}
                                    >
                                        Smallest Size
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">
                                    Compression Level: <span className="text-green-400 capitalize">{compressionLevel}</span>
                                </label>
                                <input
                                    disabled={isProcessing}
                                    type="range"
                                    min="1"
                                    max="3"
                                    value={compressionLevel === "low" ? 1 : compressionLevel === "medium" ? 2 : 3}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value)
                                        setCompressionLevel(val === 1 ? "low" : val === 2 ? "medium" : "high")
                                    }}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-600"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>Low</span>
                                    <span>Medium</span>
                                    <span>High</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleCompress}
                            disabled={isProcessing}
                            className="w-full px-8 py-3 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold transition-all shadow-lg shadow-green-500/25 flex items-center justify-center gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Compressing...
                                </>
                            ) : (
                                `Compress ${files.length} file${files.length > 1 ? 's' : ''}`
                            )}
                        </button>
                    </div>
                )}
            </div>

            <Link href="/" className="mt-8 text-blue-500 hover:text-blue-400 hover:underline">
                &larr; Back to Home
            </Link>
        </div>
    )
}
