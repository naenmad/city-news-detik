const axios = require('axios');
const cheerio = require('cheerio');
const normalize = require('../utils/normalize');
const { URL } = require('url');

async function scrapeDetik(tag) {
    const url = `https://www.detik.com/tag/${tag}`;
    try {
        const { data } = await axios.get(url, {
            headers: {
                // Some sites block non-browser User-Agents
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 10000,
        });

        const $ = cheerio.load(data);
        const results = [];

        // Try multiple selectors as site structure may change
        const items = $('.list-content__item, .listfeed__item, article, .search-result__item');

        items.each((i, el) => {
            // Multiple fallback selectors for title/time/link
            const title = $(el).find('.media__title, .title, h2, h3, a').first().text().trim();
            let link = $(el).find('a').attr('href');
            const time = $(el).find('.media__date, .date, time').first().text().trim();

            // Try to extract the best image from any <img> inside the element.
            let image = null;
            const imgs = $(el).find('img').toArray();

            const preferPattern = /akcdn\.detik\.net\.id|community\/media|\/visual\//i;
            const isPlaceholder = (url) => {
                if (!url) return true;
                const lower = url.toLowerCase();
                if (lower.includes('default-') || lower.includes('detik2/images/default') || lower.includes('placeholder')) return true;
                if (lower.endsWith('.gif') && lower.includes('default')) return true;
                if (lower.includes('logo') || lower.includes('watermark') || lower.includes('spacer') || lower.includes('pixel')) return true;
                // tiny dimensions in url
                if (/\b(\d{1,3})x(\d{1,3})\b/.test(lower)) {
                    const m = lower.match(/(\d{1,3})x(\d{1,3})/);
                    if (m) {
                        const w = parseInt(m[1], 10), h = parseInt(m[2], 10);
                        if (w <= 50 && h <= 50) return true;
                    }
                }
                return false;
            };

            const pickFromSrcset = (srcset) => {
                if (!srcset) return null;
                const candidates = srcset.split(',').map(s => s.trim()).map(s => {
                    const [u, szz] = s.split(/\s+/);
                    return { url: u, size: parseInt((szz || '').replace(/[^0-9]/g, '')) || 0 };
                }).sort((a, b) => b.size - a.size);
                return candidates.length ? candidates[0].url : null;
            };

            // First pass: prefer images matching preferPattern and not placeholder
            for (const node of imgs) {
                const $img = $(node);
                const candidates = [];
                const srcset = $img.attr('srcset') || $img.attr('data-srcset');
                const srcFromSet = pickFromSrcset(srcset);
                if (srcFromSet) candidates.push(srcFromSet);
                const dataSrc = $img.attr('data-src') || $img.attr('data-original') || $img.attr('data-lazy');
                if (dataSrc) candidates.push(dataSrc);
                const src = $img.attr('src');
                if (src) candidates.push(src);

                for (const c of candidates) {
                    if (!c) continue;
                    if (preferPattern.test(c) && !isPlaceholder(c)) {
                        image = c;
                        break;
                    }
                }
                if (image) break;
            }

            // Second pass: pick any non-placeholder image (largest srcset first)
            if (!image) {
                for (const node of imgs) {
                    const $img = $(node);
                    const srcset = $img.attr('srcset') || $img.attr('data-srcset');
                    const srcFromSet = pickFromSrcset(srcset);
                    const dataSrc = $img.attr('data-src') || $img.attr('data-original') || $img.attr('data-lazy');
                    const src = $img.attr('src');
                    const list = [srcFromSet, dataSrc, src].filter(Boolean);
                    for (const c of list) {
                        if (!isPlaceholder(c)) {
                            image = c;
                            break;
                        }
                    }
                    if (image) break;
                }
            }

            if (!link) {
                // sometimes the anchor is on a child element
                link = $(el).attr('href') || $(el).find('a').first().attr('data-href');
            }

            if (title && link) {
                // Normalize relative links
                try {
                    const resolved = new URL(link, url);
                    link = resolved.toString();
                } catch (e) {
                    // leave as-is if URL parsing fails
                }

                // Normalize image URL (decode entities, resolve relative) and ignore placeholders
                if (image) {
                    try {
                        image = image.replace(/&amp;/g, '&');
                        const resolvedImg = new URL(image, url);
                        image = resolvedImg.toString();
                    } catch (e) {
                        // leave image as-is if URL parsing fails
                    }
                    if (isPlaceholder(image)) image = null;
                }

                // Push normalized result; og:image fallback can run later if enabled
                results.push(normalize({ title, link, time, image }));
            }
        });


        // Optionally fetch article pages to extract og:image if image is missing
        if (process.env.USE_OG_IMAGE === '1' && results.length > 0) {
            const looksLikeBadImage = (imgUrl) => {
                if (!imgUrl) return true;
                const lower = imgUrl.toLowerCase();
                const badWords = ['logo', 'watermark', 'placeholder', 'blank', 'spacer', 'pixel'];
                if (badWords.some(w => lower.includes(w))) return true;
                if (/\b(\d{1,3})x(\d{1,3})\b/.test(lower)) {
                    const m = lower.match(/(\d{1,3})x(\d{1,3})/);
                    if (m) {
                        const w = parseInt(m[1], 10), h = parseInt(m[2], 10);
                        if (w <= 50 && h <= 50) return true;
                    }
                }
                return false;
            };

            for (let i = 0; i < results.length; i++) {
                if (!results[i].image || looksLikeBadImage(results[i].image)) {
                    try {
                        const { data: articleHtml } = await axios.get(results[i].link, {
                            headers: { 'User-Agent': 'Mozilla/5.0' },
                            timeout: 8000,
                        });
                        const $$ = cheerio.load(articleHtml);
                        const ogImage = $$('meta[property="og:image"]').attr('content') || $$('meta[name="og:image"]').attr('content');
                        if (ogImage) results[i].image = ogImage;
                    } catch (e) {
                        // ignore fetch errors for article pages
                    }
                }
            }
        }

        return results;
    } catch (err) {
        console.error('scrapeDetik error:', err.message);
        return [];
    }
}

module.exports = scrapeDetik;
