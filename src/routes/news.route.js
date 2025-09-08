const express = require('express');
const router = express.Router();
const scrapeDetik = require('../services/detikScrapers');
const tags = require('../config/tags');

router.get('/detik-news', async (req, res) => {
    const tag = (req.query.tag || 'karawang').toLowerCase().trim();
    const includeContent = req.query.content === 'true' || req.query.full === 'true';
    const contentLimit = parseInt(req.query.contentLimit) || 500;
    const contentFormat = req.query.format === 'paragraphs' ? 'paragraphs' : 'string';

    if (!tags.includes(tag)) return res.status(400).json({ error: 'Tag tidak tersedia' });

    try {
        const options = { includeContent, contentLimit, contentFormat };
        const data = await scrapeDetik(tag, options);
        res.json({
            source: `Detik - ${tag}`,
            tag,
            total: data.length,
            includeContent,
            data,
        });
    } catch (err) {
        res.status(500).json({ error: 'Gagal mengambil data berita' });
    }
});

module.exports = router;
