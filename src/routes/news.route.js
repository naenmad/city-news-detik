const express = require('express');
const router = express.Router();
const scrapeDetik = require('../services/detikScrapers');
const tags = require('../config/tags');

router.get('/detik-news', async (req, res) => {
    const tag = req.query.tag || 'karawang';
    if (!tags.includes(tag)) return res.status(400).json({ error: 'Tag tidak tersedia' });

    try {
        const data = await scrapeDetik(tag);
        res.json({
            source: `Detik - ${tag}`,
            tag,
            total: data.length,
            data,
        });
    } catch (err) {
        res.status(500).json({ error: 'Gagal mengambil data berita' });
    }
});

module.exports = router;
