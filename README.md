# 📰 Detik News API

> API ringan dan modern untuk mengambil berita terkini dari Detik.com dengan antarmuka web yang elegan

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16.x%20%7C%2018.x%20%7C%2020.x-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18.2-blue.svg)](https://expressjs.com/)

## 🌟 Fitur Utama

- 🚀 **API RESTful** - Endpoint yang clean dan mudah digunakan
- 🌍 **Multi-City Support** - Dukungan untuk 15+ kota di Indonesia
- 🔍 **Global Search** - Pencarian berita berdasarkan keyword
- 📱 **Responsive UI** - Antarmuka web modern dengan glassmorphism design
- 📖 **Content Extraction** - Ekstraksi isi berita lengkap dengan pembersihan otomatis
- 🧹 **Smart Content Cleaning** - Penghapusan script, iklan, dan elemen UI yang tidak diperlukan
- 📝 **Flexible Content Format** - Pilihan format string atau paragraf terstruktur
- 🔄 **Case-Insensitive Input** - Input otomatis di-convert ke lowercase
- ⚡ **Fast Performance** - Optimized scraping dengan caching
- 🔄 **Real-time Data** - Berita terkini langsung dari sumber
- 📊 **Pagination** - Navigasi hasil yang mudah
- 🎯 **Category Filter** - Filter berita berdasarkan kategori

## 🚀 Quick Start

### Prerequisites

- Node.js (v16.x atau lebih baru)
- npm atau yarn

### Instalasi

1. **Clone repository**
   ```bash
   git clone https://github.com/naenmad/city-news-detik.git
   cd city-news-detik
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Jalankan dalam mode development**
   ```bash
   npm run dev
   ```

4. **Atau jalankan dalam mode production**
   ```bash
   npm start
   ```

Server akan berjalan di `http://localhost:3000`

## 📚 Dokumentasi API

### Base URL
```
http://localhost:3000/api
```

### Endpoint Utama

#### 1. Ambil Berita Berdasarkan Kota

```http
GET /api/detik-news?tag={nama_kota}
```

**Parameter:**
- `tag` (required) - Nama kota (string)
- `limit` (optional) - Jumlah maksimal berita (number, default: 10)
- `content` (optional) - Sertakan isi berita lengkap (boolean, default: false)
- `contentLimit` (optional) - Batas karakter isi berita (number, default: 500)
- `format` (optional) - Format content: "string" atau "paragraphs" (default: "string")

**Contoh Request:**
```bash
# Berita basic (title, link, image, publishedAt, excerpt)
curl "http://localhost:3000/api/detik-news?tag=jakarta&limit=5"

# Berita dengan isi lengkap (format string)
curl "http://localhost:3000/api/detik-news?tag=jakarta&limit=3&content=true"

# Berita dengan isi dalam format paragraf terstruktur
curl "http://localhost:3000/api/detik-news?tag=jakarta&content=true&format=paragraphs"

# Berita dengan isi terbatas 300 karakter
curl "http://localhost:3000/api/detik-news?tag=jakarta&content=true&contentLimit=300"
```

**Response (Basic):**
```json
{
  "source": "Detik - jakarta",
  "tag": "jakarta",
  "total": 5,
  "includeContent": false,
  "data": [
    {
      "title": "Judul Berita",
      "link": "https://news.detik.com/...",
      "image": "https://akcdn.detik.net.id/...",
      "publishedAt": "2 jam lalu",
      "source": "Detik",
      "excerpt": "Ringkasan berita dalam 200 karakter..."
    }
  ]
}
```

**Response (With Content - String Format):**
```json
{
  "source": "Detik - jakarta",
  "tag": "jakarta",
  "total": 3,
  "includeContent": true,
  "data": [
    {
      "title": "Judul Berita",
      "link": "https://news.detik.com/...",
      "image": "https://akcdn.detik.net.id/...",
      "publishedAt": "2 jam lalu",
      "source": "Detik",
      "excerpt": "Ringkasan berita...",
      "content": "Isi berita lengkap yang sudah dibersihkan dari script, iklan, dan elemen UI yang tidak perlu. Content ini sudah difilter untuk menghasilkan teks yang rapi dan mudah dibaca."
    }
  ]
}
```

**Response (With Content - Paragraphs Format):**
```json
{
  "source": "Detik - jakarta",
  "tag": "jakarta",
  "total": 1,
  "includeContent": true,
  "data": [
    {
      "title": "Judul Berita",
      "link": "https://news.detik.com/...",
      "image": "https://akcdn.detik.net.id/...",
      "publishedAt": "2 jam lalu",
      "source": "Detik",
      "excerpt": "Ringkasan berita...",
      "content": {
        "format": "paragraphs",
        "totalParagraphs": 5,
        "totalWords": 250,
        "paragraphs": [
          {
            "id": 1,
            "text": "Paragraf pertama dari berita...",
            "wordCount": 45
          },
          {
            "id": 2,
            "text": "Paragraf kedua dari berita...",
            "wordCount": 52
          }
        ]
      }
    }
  ]
}
```
```

#### 2. Multi-City Support (API v2)

```http
GET /api/v2/news?tags={kota1,kota2,kota3}
```

**Parameter:**
- `tags` (required) - Daftar kota dipisah koma
- `limit` (optional) - Jumlah berita per kota
- `page` (optional) - Halaman pagination

**Contoh:**
```bash
curl "http://localhost:3000/api/v2/news?tags=jakarta,bandung,surabaya&limit=3"
```

#### 3. Global Search

```http
GET /api/v2/search?q={keyword}
```

**Parameter:**
- `q` (required) - Keyword pencarian
- `tag` (optional) - Batasi pencarian di kota tertentu
- `limit` (optional) - Jumlah hasil maksimal

**Contoh:**
```bash
curl "http://localhost:3000/api/v2/search?q=pemilu&limit=10"
```

### Kota yang Didukung

| Kota | Tag | Provinsi |
|------|-----|----------|
| Jakarta | `jakarta` | DKI Jakarta |
| Bandung | `bandung` | Jawa Barat |
| Surabaya | `surabaya` | Jawa Timur |
| Bogor | `bogor` | Jawa Barat |
| Karawang | `karawang` | Jawa Barat |
| Yogyakarta | `yogyakarta` | DI Yogyakarta |
| Semarang | `semarang` | Jawa Tengah |
| Medan | `medan` | Sumatera Utara |
| Makassar | `makassar` | Sulawesi Selatan |
| Palembang | `palembang` | Sumatera Selatan |
| Malang | `malang` | Jawa Timur |
| Denpasar | `denpasar` | Bali |
| Pontianak | `pontianak` | Kalimantan Barat |
| Balikpapan | `balikpapan` | Kalimantan Timur |
| Manado | `manado` | Sulawesi Utara |

## 🎨 Web Interface

API ini dilengkapi dengan antarmuka web modern yang dapat diakses di `http://localhost:3000`

### Fitur Web Interface:
- 🔍 **Form Pencarian** - Input dengan autocomplete untuk kota (auto-lowercase)
- ☑️ **Content Toggle** - Checkbox untuk menyertakan isi berita lengkap
- 📊 **View Toggle** - Beralih antara tampilan Cards dan JSON
- 📋 **Copy to Clipboard** - Copy response JSON dengan satu klik
- 📚 **Dokumentasi Interaktif** - Panduan lengkap penggunaan API
- 🔗 **Social Links** - Link ke GitHub dan LinkedIn developer

### Input Tips:
- **Case Insensitive**: Input "Jakarta", "JAKARTA", atau "jakarta" semua akan berfungsi
- **Auto-lowercase**: Input otomatis dikonversi ke huruf kecil
- **Content Mode**: Centang checkbox untuk mendapatkan isi berita lengkap (memerlukan waktu lebih lama)

## 🛠️ Teknologi yang Digunakan

- **Backend:**
  - Node.js
  - Express.js
  - Axios (HTTP client)
  - Cheerio (Web scraping)
  - CORS

- **Frontend:**
  - HTML5 semantik
  - CSS3 modern (Glassmorphism design)
  - Vanilla JavaScript (ES6+)
  - Responsive design

## 📁 Struktur Project

```
city-news-detik/
├── src/
│   ├── app.js                 # Entry point aplikasi
│   ├── config/
│   │   └── tags.js           # Konfigurasi kota
│   ├── routes/
│   │   ├── news.route.js     # Route API utama
│   │   └── enhanced-news.route.js # Route API v2
│   ├── services/
│   │   └── detikScrapers.js  # Web scraper
│   └── utils/
│       └── normalize.js      # Data normalization
├── public/
│   ├── index.html            # Web interface
│   ├── styles.css            # Styling
│   └── app.js               # Frontend JavaScript
├── package.json
└── README.md
```

## 🔧 Konfigurasi

### Environment Variables

Buat file `.env` di root directory:

```env
PORT=3000
ALLOW_ALL_TAGS=false
USE_OG_IMAGE=true
```

**Parameter:**
- `PORT` - Port server (default: 3000)
- `ALLOW_ALL_TAGS` - Izinkan semua tag kota (default: false)
- `USE_OG_IMAGE` - Gunakan Open Graph image sebagai fallback (default: true)

## 🚀 Deployment

### Deploy ke Heroku

1. **Install Heroku CLI**
2. **Login ke Heroku**
   ```bash
   heroku login
   ```
3. **Create Heroku app**
   ```bash
   heroku create your-app-name
   ```
4. **Set environment variables**
   ```bash
   heroku config:set PORT=3000
   ```
5. **Deploy**
   ```bash
   git push heroku main
   ```

### Deploy ke Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```
2. **Deploy**
   ```bash
   vercel
   ```

## 🔍 Error Handling

API mengembalikan error dalam format JSON:

```json
{
  "error": true,
  "message": "Deskripsi error",
  "code": "ERROR_CODE"
}
```

### Common Error Codes:

- `CITY_NOT_FOUND` - Kota tidak ditemukan
- `NO_NEWS_FOUND` - Tidak ada berita ditemukan
- `SCRAPING_ERROR` - Error saat scraping
- `INVALID_PARAMETER` - Parameter tidak valid

## ⚡ Performance & Limitations

### Response Time
- **Basic Mode** (excerpt only): ~500ms - 2s per request
- **Content Mode** (full content): ~2s - 8s per request (due to additional page fetching)

### Content Fetching
- **Excerpt**: Diambil dari halaman listing (cepat)
- **Full Content**: Memerlukan request tambahan ke halaman detail setiap artikel (lebih lambat)
- **Rate Limiting**: Hindari request bersamaan dengan `content=true` untuk mencegah overload

### Best Practices
```bash
# ✅ Untuk browsing cepat (gunakan excerpt)
curl "http://localhost:3000/api/detik-news?tag=jakarta&limit=10"

# ✅ Untuk detail artikel (batasi jumlah)
curl "http://localhost:3000/api/detik-news?tag=jakarta&limit=3&content=true"

# ❌ Hindari - terlalu berat
curl "http://localhost:3000/api/detik-news?tag=jakarta&limit=20&content=true"
```

## 📊 Rate Limiting

- **Default:** 100 requests per 15 menit per IP
- **Burst:** Maksimal 10 requests per detik

## 🤝 Contributing

Kontribusi sangat diterima! Silakan:

1. Fork repository ini
2. Buat branch fitur (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

### Development Guidelines

- Gunakan ESLint untuk code formatting
- Tulis tests untuk fitur baru
- Update dokumentasi jika diperlukan
- Follow conventional commits

## 📝 License

Project ini menggunakan [MIT License](LICENSE).

## 👨‍💻 Developer

**GitHub:** [@naenmad](https://github.com/naenmad)  
**LinkedIn:** [linkedin.com/in/naen](https://linkedin.com/in/naen)

## 🙏 Acknowledgments

- [Detik.com](https://detik.com) - Sumber berita
- [Express.js](https://expressjs.com/) - Web framework
- [Cheerio](https://cheerio.js.org/) - Server-side HTML parsing

## 📞 Support

Jika ada pertanyaan atau masalah:

1. Buka [Issue](https://github.com/naenmad/city-news-detik/issues) di GitHub
2. Kirim email ke developer
3. Hubungi via LinkedIn

---

⭐ **Star** repository ini jika bermanfaat!

**Made with ❤️ in Indonesia**