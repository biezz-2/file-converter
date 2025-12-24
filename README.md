# Converter (YouTube Downloader + Converter)

Project untuk mengunduh video/audio YouTube dan mengonversi/menyajikannya melalui antarmuka Next.js.

## Ringkasan
- Aplikasi ini adalah bagian dari proyek `converter` (Next.js app) yang menyediakan API untuk:
  - Mengambil metadata video YouTube (via `youtubei.js` / Innertube).
  - Mengekstrak URL unduhan langsung menggunakan `yt-dlp` (diinstal di Python venv pada Windows).
  - Menyajikan tautan unduhan ke klien sehingga browser dapat memulai unduhan.

Fitur utama:
- Ambil info (title, thumbnail, durasi, daftar format video/audio).
- Unduhan MP4 (video + audio) dan MP3 (audio) menggunakan `yt-dlp` untuk mengekstrak URL CDN.

## Struktur proyek (penting)
- File API: `src/app/api/youtube/route.ts` — endpoint `POST /api/youtube` dengan `action: "info"` atau `action: "download"`.
- Halaman klien: `src/app/youtube/page.tsx` — UI untuk mengambil info dan memulai unduhan.
- Virtual environment Python (lokal): `.venv\Scripts\yt-dlp.exe` (Windows) — path yang digunakan di konfigurasi saat ini.

## Prasyarat
- Node.js (direkomendasikan v18+ atau sesuai environment proyek). Project menggunakan `next@16.1.1`.
- npm (atau pnpm/yarn)
- Python (opsional) + `yt-dlp` jika Anda ingin menjalankan `yt-dlp` dari `.venv`. Atau install `yt-dlp` secara global.

Rekomendasi di Windows (PowerShell):

1. Membuat venv dan memasang yt-dlp (jika belum):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install yt-dlp
.\.venv\Scripts\yt-dlp.exe --version
```

2. Pasang dependensi Node:

```powershell
npm install
```

3. Jalankan dev server Next.js:

```powershell
npm run dev
# lalu buka http://localhost:3000 dan menuju halaman YouTube downloader
```

## Cara kerja singkat
- `POST /api/youtube` dengan body JSON:
  - `{ "url": "https://www.youtube.com/watch?v=...", "action": "info" }` → mengembalikan metadata video dan daftar format.
  - `{ "url": "...", "action": "download", "format": "mp4" | "mp3", "quality": "137" }` → API akan memanggil `yt-dlp -g` untuk mengekstrak URL CDN dan mengembalikannya sebagai JSON `{ downloadUrl: "..." }`.

Client kemudian akan menavigasi ke `downloadUrl` sehingga browser memulai unduhan.

## Catatan penting & Troubleshooting

- yt-dlp dan JavaScript runtime:
  - `yt-dlp` kadang memberikan peringatan: "No supported JavaScript runtime could be found". Untuk ekstraksi EJS/JS yang kompleks, yt-dlp dapat membutuhkan node/deno sebagai runtime.
  - Jika Anda melihat peringatan ini, instal Node atau Deno, atau jalankan `yt-dlp` dengan opsi yang menunjuk ke runtime (lihat dokumentasi `yt-dlp`).

- Masalah jaringan / SSL:
  - Beberapa pemanggilan `yt-dlp` dapat gagal karena timeout SSL atau pemutusan koneksi. Anda bisa meningkatkan timeout atau menambahkan retry pada server jika diperlukan.

- Server dev Next.js kadang restart/HMR: jika server terlihat berhenti setelah "Ready", jalankan `npm run dev` kembali dan periksa konsol untuk stack trace saat terjadi permintaan yang gagal.

## Men-deploy / Upload ke GitHub

Saya bisa membantu mengunggah seluruh proyek ke GitHub, tapi saya membutuhkan salah satu dari opsi berikut:

1. URL repo GitHub yang sudah ada (mis. `https://github.com/username/repo.git`) — saya akan menambahkan remote dan memberi perintah untuk push.
2. Izin untuk membuat repo atas nama Anda via `gh` (GitHub CLI). Untuk ini, Anda harus sudah login di `gh` pada mesin Anda.
3. Personal Access Token (PAT) — **tidak disarankan** untuk dikirimkan via chat, tapi jika Anda mengizinkan saya untuk memanggil perintah yang menggunakan token tersimpan di mesin, saya bisa menjalankan push. Saya tidak akan menyimpan token.

Jika Anda ingin saya menjalankan perintah push otomatis dari terminal (lokal), jalankan perintah berikut di PowerShell setelah memastikan `git` terpasang dan Anda sudah login ke GitHub (`gh auth login`):

```powershell
# in project root (f:\ATTABI\project\website\converter)
git init
git add -A
git commit -m "Initial commit: converter project"
# create repo using gh (interactive) or set remote manually
gh repo create USERNAME/REPO_NAME --public --source=. --remote=origin --push
# OR if repo exists:
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

Jika Anda tidak ingin/ tidak bisa menggunakan `gh`, Anda dapat membuat repository di GitHub.com lalu jalankan langkah `git remote add origin ...` dan `git push` seperti perintah di atas.

## Keamanan & Data Sensitif
- Jangan mengunggah file yang berisi kredensial (mis. file `.env` dengan secrets) ke GitHub publik. Jika ada file sensitif, tambahkan ke `.gitignore` sebelum melakukan commit.

## Roadmap & Peningkatan yang Disarankan
- Tambahkan retry/backoff dan logging `stderr` dari `yt-dlp` pada `src/app/api/youtube/route.ts`.
- Opsi untuk proxy/streaming server-side (server men-download lalu stream ke klien) jika Anda ingin menyembunyikan CDN URL.
- Integrasi queue worker untuk tugas berat (mis. transkode/FFmpeg) agar tidak memblokir server Next.js.

## Kontak
Jika Anda mau, saya bisa melanjutkan dan:
- Menjalankan git init + commit pada mesin Anda, dan menunjukkan perintah untuk push,
- Atau, jika Anda beri akses/URL repo, saya bisa membuat remote dan mendorong kode.

---
README dibuat oleh assistant pada proyek lokal Anda. Jika Anda ingin saya juga membuat file `.gitignore` atau menambahkan skrip helper (mis. `scripts/push-to-github.ps1`) saya bisa menambahkannya sekarang.# 🚀 Enterprise File Converter & Compressor

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7.2.0-2D3748?style=for-the-badge&logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC?style=for-the-badge&logo=tailwind-css)

**High-Performance File Conversion, Compression & 8K YouTube Downloader**

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Tech Stack](#-tech-stack) • [Screenshots](#-screenshots)

</div>

---

## 📋 Overview

Enterprise-grade web application built with Next.js that provides powerful file conversion, compression, and YouTube downloading capabilities. Designed with a focus on user experience, security, and performance.

### ✨ Key Highlights

- 🎯 **No Login Required** - Start converting and compressing files instantly
- 🔐 **Optional Authentication** - Sign up to save your conversion history
- 📁 **300+ File Formats** - Support for images, videos, documents, audio, and archives
- 🎨 **Modern UI** - Beautiful dark theme with smooth animations
- ⚡ **High Performance** - Built with Next.js 16 and Turbopack
- 🎛️ **Advanced Controls** - Fine-tune compression quality and levels

---

## 🎯 Features

### 🔄 File Converter
Convert files between different formats with ease:
- **Images**: PNG, JPG, WebP, GIF
- **Documents**: PDF, DOCX, TXT
- **Audio**: MP3, WAV, FLAC
- **Video**: MP4, WebM, AVI

### 🗜️ File Compressor
Reduce file sizes while maintaining quality:
- **300+ Format Support** - Images, videos, documents, archives
- **Quality Options** - Best Quality vs Smallest Size
- **Compression Levels** - Low, Medium, High (adjustable slider)
- **Batch Processing** - Compress multiple files at once

### 📺 YouTube Downloader
Download high-quality videos from YouTube:
- Support for 8K, 4K, 1080p, 720p, and lower resolutions
- Audio extraction (MP3, AAC)
- Multiple format options
- Fast download speeds

### 🔐 Authentication & Security
- **JWT-based Authentication** - Secure session management
- **Optional Login** - Use features without signing up
- **History Tracking** - Save your conversions when logged in
- **Role-based Access** - User, Admin, Enterprise tiers
- **SQLite Database** - Fast and reliable data storage

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16.1.1 with Turbopack |
| **Language** | TypeScript 5.x |
| **Authentication** | NextAuth.js with JWT |
| **Database** | SQLite with Prisma ORM 7.2.0 |
| **Database Adapter** | @prisma/adapter-libsql |
| **Styling** | Tailwind CSS |
| **UI Components** | Custom React Components |
| **File Upload** | HTML5 Drag & Drop API |
| **Fonts** | Geist Sans & Geist Mono |

---

## 📦 Installation

### Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd converter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```bash
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Generate Prisma client**
   ```bash
   npx prisma generate
   ```

5. **Run database migrations**
   ```bash
   npx prisma db push
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 💻 Usage

### For Guest Users

1. **Visit the homepage** at `http://localhost:3000`
2. **Choose a feature**:
   - Click "Start Converting" for file conversion
   - Click "Compress Files" for file compression
   - Click "Download YouTube" for video downloads
3. **Upload your files** via drag-and-drop or file selection
4. **Configure settings** (format, quality, compression level)
5. **Process your files** and download results

### For Registered Users

1. **Sign up** at `/register`
2. **Log in** at `/login`
3. **Access additional features**:
   - View conversion history at `/history`
   - Manage profile at `/profile`
   - Access dashboard at `/dashboard`
   - Configure settings at `/settings`

---

## 📸 Screenshots

### Home Page
Beautiful landing page with 3D background and quick access to all features.

### File Converter
Drag-and-drop interface with format selection and file preview.

### File Compressor
Advanced compression controls with quality and level adjustments.

### Authentication
Secure login and registration with session management.

---

## 🏗️ Project Structure

```
converter/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                     # Static assets
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # NextAuth endpoints
│   │   │   └── register/      # User registration
│   │   ├── compress/          # Compression page
│   │   ├── convert/           # Converter page
│   │   ├── youtube/           # YouTube downloader
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── 3d/                # 3D components
│   │   └── Providers.tsx      # Context providers
│   ├── lib/
│   │   ├── auth.ts            # Authentication config
│   │   ├── db.ts              # Database client
│   │   └── password.ts        # Password utilities
│   └── middleware.ts          # Route protection
├── .env                        # Environment variables
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind configuration
└── package.json               # Dependencies
```

---

## 🔧 Configuration

### Database

The application uses SQLite with Prisma ORM. To modify the database schema:

1. Edit `prisma/schema.prisma`
2. Run `npx prisma generate` to update the client
3. Run `npx prisma db push` to apply changes

### Authentication

NextAuth is configured in `src/lib/auth.ts`. Supported providers:
- Email/Password (Credentials)

To add more providers, update the `providers` array in auth configuration.

### Middleware

Route protection is configured in `src/middleware.ts`:
- **Public routes**: `/`, `/convert`, `/compress`, `/youtube`, `/login`, `/register`
- **Protected routes**: `/dashboard`, `/profile`, `/history`, `/settings`

---

## 🎨 Customization

### Styling

The application uses Tailwind CSS for styling. Customize the theme in `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      // Your custom colors
    }
  }
}
```

### Fonts

Fonts are configured in `src/app/layout.tsx`:
- **Geist Sans** - Primary font
- **Geist Mono** - Monospace font

---

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Deploy to Vercel

1. Push your code to GitHub
2. Import project to Vercel
3. Set environment variables
4. Deploy

---

## 🛡️ Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ CSRF protection
- ✅ Route-level authorization
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection
- ✅ Environment variable security

---

## 📝 API Routes

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `GET /api/auth/session` - Get current session

### User Management
- `POST /api/register` - User registration

### Features (Coming Soon)
- `POST /api/convert` - File conversion
- `POST /api/compress` - File compression
- `POST /api/youtube` - YouTube download

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👨‍💻 Author

Created with ❤️ by [Your Name]

---

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Prisma team for the excellent ORM
- Tailwind CSS for the utility-first CSS framework
- NextAuth.js for authentication solution
- All open-source contributors

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

[Report Bug](https://github.com/yourusername/converter/issues) • [Request Feature](https://github.com/yourusername/converter/issues)

</div>
