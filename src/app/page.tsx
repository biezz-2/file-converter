import Link from 'next/link'
import Background3D from '@/components/3d/Background3D'

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-4 lg:p-24 overflow-hidden">
      <Background3D />
      <div className="absolute top-8 left-0 w-full z-10 flex justify-center">
        <p className="px-4 py-2 rounded-full border border-gray-500/30 bg-gray-900/50 backdrop-blur-md text-xs font-mono text-gray-300">
          Enterprise Converter & Downloader
        </p>
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto px-4 mt-20 lg:mt-0">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-3xl opacity-30 rounded-full w-full h-full transform scale-150" />

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 pb-2 tracking-tight">
          Enterprise Scale
        </h1>
        <p className="text-lg md:text-xl text-gray-400 mt-6 max-w-2xl mx-auto leading-relaxed">
          High-Performance File Conversion & 8K YouTube Downloader
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/convert" className="w-full sm:w-auto">
            <button className="px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-500/25 w-full cursor-pointer">
              Start Converting
            </button>
          </Link>
          <Link href="/compress" className="w-full sm:w-auto">
            <button className="px-8 py-3.5 rounded-full bg-green-600 hover:bg-green-500 text-white font-semibold transition-all shadow-lg shadow-green-500/25 w-full cursor-pointer">
              Compress Files
            </button>
          </Link>
          <Link href="/youtube" className="w-full sm:w-auto">
            <button className="px-8 py-3.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold transition-all w-full backdrop-blur-sm cursor-pointer">
              Download YouTube
            </button>
          </Link>
        </div>
      </div>
    </main>
  )
}
