const express = require('express');
const router = express.Router();
const detikScrapers = require('../services/detikScrapers');
const { getCityTags } = require('../config/tags');

// Cache untuk menyimpan hasil scraping sementara
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 menit

/**
 * Helper function untuk cache management
 */
function getCachedData(key) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    return null;
}

function setCachedData(key, data) {
    cache.set(key, {
        data,
        timestamp: Date.now()
    });
}

/**
 * GET /api/v2/news - Enhanced news endpoint with filters
 */
router.get('/news', async (req, res) => {
    try {
        const {
            tag,
            tags,
            limit = 10,
            page = 1,
            sort = 'newest',
            category,
            date
        } = req.query;

        // Validasi input
        if (!tag && !tags) {
            return res.status(400).json({
                error: 'Parameter "tag" atau "tags" diperlukan',
                example: '/api/v2/news?tag=jakarta atau /api/v2/news?tags=jakarta,bandung'
            });
        }

        // Handle multiple tags
        const cityTags = tags ? tags.split(',').map(t => t.trim()) : [tag];
        const availableTags = getCityTags();

        // Validasi tags
        const invalidTags = cityTags.filter(t => !availableTags.includes(t.toLowerCase()));
        if (invalidTags.length > 0) {
            return res.status(400).json({
                error: `Tag tidak valid: ${invalidTags.join(', ')}`,
                availableTags: availableTags
            });
        }

        // Scraping data untuk semua tags
        const results = await Promise.allSettled(
            cityTags.map(async (cityTag) => {
                const cacheKey = `news-${cityTag}-${date || 'latest'}`;
                let cached = getCachedData(cacheKey);

                if (!cached) {
                    cached = await detikScrapers.scrapeDetikNews(cityTag);
                    setCachedData(cacheKey, cached);
                }

                return {
                    tag: cityTag,
                    ...cached
                };
            })
        );

        // Gabungkan hasil dan filter
        let allNews = [];
        const errors = [];

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                const newsData = result.value;
                if (newsData.data && newsData.data.length > 0) {
                    allNews = allNews.concat(
                        newsData.data.map(article => ({
                            ...article,
                            sourceTag: cityTags[index]
                        }))
                    );
                }
            } else {
                errors.push({
                    tag: cityTags[index],
                    error: result.reason.message
                });
            }
        });

        // Filter berdasarkan kategori (jika ada)
        if (category) {
            allNews = allNews.filter(article =>
                article.title.toLowerCase().includes(category.toLowerCase()) ||
                (article.description && article.description.toLowerCase().includes(category.toLowerCase()))
            );
        }

        // Filter berdasarkan tanggal (jika ada)
        if (date) {
            // Implementasi filter tanggal sederhana
            allNews = allNews.filter(article => {
                // Untuk demo, kita asumsikan artikel hari ini
                return true;
            });
        }

        // Sorting
        if (sort === 'oldest') {
            allNews.reverse();
        }

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedNews = allNews.slice(startIndex, endIndex);

        const response = {
            success: true,
            meta: {
                total: allNews.length,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(allNews.length / limit),
                tags: cityTags,
                filters: {
                    category: category || null,
                    date: date || null,
                    sort
                }
            },
            data: paginatedNews
        };

        if (errors.length > 0) {
            response.warnings = errors;
        }

        res.json(response);

    } catch (error) {
        console.error('Error in enhanced news endpoint:', error);
        res.status(500).json({
            error: 'Terjadi kesalahan saat mengambil berita',
            message: error.message
        });
    }
});

/**
 * GET /api/v2/search - Global search endpoint
 */
router.get('/search', async (req, res) => {
    try {
        const { q, limit = 20, tag } = req.query;

        if (!q) {
            return res.status(400).json({
                error: 'Parameter "q" (query) diperlukan',
                example: '/api/v2/search?q=pemilu'
            });
        }

        const searchTags = tag ? [tag] : getCityTags().slice(0, 5); // Cari di 5 kota teratas
        const cacheKey = `search-${q}-${searchTags.join(',')}-${limit}`;

        let cached = getCachedData(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        const results = await Promise.allSettled(
            searchTags.map(cityTag => detikScrapers.scrapeDetikNews(cityTag))
        );

        let allNews = [];
        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.data) {
                allNews = allNews.concat(
                    result.value.data.map(article => ({
                        ...article,
                        sourceTag: searchTags[index]
                    }))
                );
            }
        });

        // Filter berdasarkan query
        const filteredNews = allNews.filter(article =>
            article.title.toLowerCase().includes(q.toLowerCase()) ||
            (article.description && article.description.toLowerCase().includes(q.toLowerCase()))
        ).slice(0, limit);

        const response = {
            success: true,
            query: q,
            total: filteredNews.length,
            searchedTags: searchTags,
            data: filteredNews
        };

        setCachedData(cacheKey, response);
        res.json(response);

    } catch (error) {
        console.error('Error in search endpoint:', error);
        res.status(500).json({
            error: 'Terjadi kesalahan saat melakukan pencarian',
            message: error.message
        });
    }
});

/**
 * GET /api/v2/categories - Available categories
 */
router.get('/categories', (req, res) => {
    const categories = [
        { id: 'politik', name: 'Politik', keywords: ['pemilu', 'pemerintah', 'presiden', 'menteri'] },
        { id: 'ekonomi', name: 'Ekonomi', keywords: ['rupiah', 'inflasi', 'bisnis', 'saham'] },
        { id: 'hukum', name: 'Hukum', keywords: ['pengadilan', 'jaksa', 'polisi', 'kasus'] },
        { id: 'pendidikan', name: 'Pendidikan', keywords: ['sekolah', 'universitas', 'siswa', 'guru'] },
        { id: 'kesehatan', name: 'Kesehatan', keywords: ['covid', 'rumah sakit', 'dokter', 'obat'] },
        { id: 'teknologi', name: 'Teknologi', keywords: ['digital', 'internet', 'aplikasi', 'startup'] },
        { id: 'olahraga', name: 'Olahraga', keywords: ['sepak bola', 'indonesia', 'pertandingan'] },
        { id: 'hiburan', name: 'Hiburan', keywords: ['artis', 'film', 'musik', 'selebriti'] }
    ];

    res.json({
        success: true,
        total: categories.length,
        data: categories
    });
});

/**
 * GET /api/v2/trending - Trending keywords
 */
router.get('/trending', async (req, res) => {
    try {
        const { period = 'daily', limit = 10 } = req.query;

        // Untuk demo, kita ambil sample dari beberapa kota
        const sampleTags = getCityTags().slice(0, 3);
        const results = await Promise.allSettled(
            sampleTags.map(tag => detikScrapers.scrapeDetikNews(tag))
        );

        let allTitles = [];
        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value.data) {
                allTitles = allTitles.concat(
                    result.value.data.map(article => article.title)
                );
            }
        });

        // Ekstrak kata kunci trending (implementasi sederhana)
        const wordCount = {};
        const commonWords = ['dan', 'di', 'ke', 'dari', 'untuk', 'yang', 'pada', 'dalam', 'dengan', 'oleh', 'akan', 'telah', 'tidak', 'ini', 'itu'];

        allTitles.forEach(title => {
            const words = title.toLowerCase()
                .replace(/[^a-zA-Z\s]/g, '')
                .split(' ')
                .filter(word => word.length > 3 && !commonWords.includes(word));

            words.forEach(word => {
                wordCount[word] = (wordCount[word] || 0) + 1;
            });
        });

        const trending = Object.entries(wordCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([keyword, count]) => ({ keyword, count }));

        res.json({
            success: true,
            period,
            generatedAt: new Date().toISOString(),
            total: trending.length,
            data: trending
        });

    } catch (error) {
        console.error('Error in trending endpoint:', error);
        res.status(500).json({
            error: 'Terjadi kesalahan saat mengambil data trending',
            message: error.message
        });
    }
});

/**
 * GET /api/v2/stats - API statistics
 */
router.get('/stats', (req, res) => {
    const stats = {
        success: true,
        timestamp: new Date().toISOString(),
        data: {
            supportedCities: getCityTags().length,
            cacheSize: cache.size,
            endpoints: [
                'GET /api/v2/news',
                'GET /api/v2/search',
                'GET /api/v2/categories',
                'GET /api/v2/trending',
                'GET /api/v2/stats'
            ],
            features: [
                'Multi-city support',
                'Pagination',
                'Search functionality',
                'Caching',
                'Category filtering',
                'Trending analysis'
            ]
        }
    };

    res.json(stats);
});

module.exports = router;
