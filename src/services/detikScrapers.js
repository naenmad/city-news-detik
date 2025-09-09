const axios = require('axios');
const cheerio = require('cheerio');
const normalize = require('../utils/normalize');
const { URL } = require('url');

/**
 * Advanced content cleaning function
 */
function cleanContent(content, contentLimit = null) {
    if (!content || typeof content !== 'string') return '';

    // Step 1: Remove JavaScript and ad code (more aggressive)
    content = content
        .replace(/googletag[^;]*;?/gi, '') // Remove ALL googletag references
        .replace(/\bgoogletag\b[^.]*\.[^;]*;?/gi, '')
        .replace(/function\s*\([^)]*\)\s*\{[^}]*\}/gi, '') // Remove function definitions
        .replace(/\(\s*function\s*\([^)]*\)[^}]*\}[^)]*\)/gi, '') // Remove IIFE
        .replace(/window\.[^;=]*[;=][^;]*;?/gi, '') // Remove window assignments
        .replace(/document\.[^;=]*[;=][^;]*;?/gi, '') // Remove document assignments
        .replace(/var\s+[^;]*;/gi, '') // Remove variable declarations
        .replace(/let\s+[^;]*;/gi, '') // Remove let declarations
        .replace(/const\s+[^;]*;/gi, '') // Remove const declarations
        .replace(/if\s*\([^)]*\)\s*\{[^}]*\}/gi, '') // Remove if statements
        .replace(/else\s*\{[^}]*\}/gi, '') // Remove else blocks
        .replace(/console\.[^;]*;?/gi, '') // Remove console calls
        .replace(/\.\s*display\s*\([^)]*\)/gi, '') // Remove display calls
        .replace(/\.\s*push\s*\([^)]*\)/gi, '') // Remove push calls
        .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remove script tags
        .replace(/<style[^>]*>.*?<\/style>/gis, '') // Remove style tags
        .replace(/<!--.*?-->/gs, '') // Remove HTML comments
        .replace(/\/\*.*?\*\//gs, '') // Remove CSS comments
        .replace(/\/\/.*$/gm, '') // Remove single line comments
        .replace(/\{[^{}]*googletag[^{}]*\}/gi, '') // Remove blocks containing googletag
        .replace(/\{[^{}]*function[^{}]*\}/gi, '') // Remove blocks containing function
        .replace(/jQuery\([^)]*\)/gi, '') // Remove jQuery calls
        .replace(/\$\([^)]*\)/gi, '') // Remove $ calls
        .replace(/setTimeout\([^)]*\)/gi, '') // Remove setTimeout
        .replace(/setInterval\([^)]*\)/gi, ''); // Remove setInterval

    // Step 2: Remove common website elements and UI text
    content = content
        .replace(/ADVERTISEMENT/gi, '')
        .replace(/SCROLL TO CONTINUE WITH CONTENT/gi, '')
        .replace(/Continue reading/gi, '')
        .replace(/Read more/gi, '')
        .replace(/Show more/gi, '')
        .replace(/Load more/gi, '')
        .replace(/Baca juga:/gi, '')
        .replace(/Lihat juga:/gi, '')
        .replace(/Simak juga:/gi, '')
        .replace(/Simak Video:/gi, '')
        .replace(/Tonton Video:/gi, '')
        .replace(/Saksikan video:/gi, '')
        .replace(/Loading\.\.\./gi, '')
        .replace(/Klik untuk memperbesar/gi, '')
        .replace(/\(Foto:\s*[^)]*\)/gi, '') // Remove photo credits
        .replace(/\[Gambas:Video[^]]*\]/gi, '') // Remove video placeholders
        .replace(/\[Gambas:Audio[^]]*\]/gi, '') // Remove audio placeholders
        .replace(/Share on Facebook/gi, '')
        .replace(/Tweet this/gi, '')
        .replace(/Pin on Pinterest/gi, '')
        .replace(/Follow us/gi, '')
        .replace(/Subscribe/gi, '')
        .replace(/Newsletter/gi, '');

    // Step 3: Remove source attribution and metadata
    content = content
        .replace(/–\s*(detikcom|detik\.com|CNN Indonesia|CNBC Indonesia|Kompas|Tempo|Tribun|Okezone|Liputan6)/gi, '')
        .replace(/\|\s*(detikcom|detik\.com|CNN Indonesia|CNBC Indonesia)/gi, '')
        .replace(/(Sumber|Source):\s*[^\n]*/gi, '')
        .replace(/(Reporter|Pewarta):\s*[^\n]*/gi, '')
        .replace(/(Editor|Redaktur):\s*[^\n]*/gi, '')
        .replace(/(Fotografer|Photographer):\s*[^\n]*/gi, '')
        .replace(/\(detik[^)]*\)/gi, '') // Remove detik attribution in parentheses
        .replace(/\(CNN[^)]*\)/gi, '') // Remove CNN attribution in parentheses
        .replace(/@detik\w*/gi, '') // Remove social media handles
        .replace(/#\w+/gi, ''); // Remove hashtags

    // Step 4: Remove timestamps and location stamps
    content = content
        .replace(/\w+,?\s*\d{1,2}\s+\w+\s+\d{4}\s+\d{1,2}:\d{2}\s+(WIB|WITA|WIT)/gi, '')
        .replace(/\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}/gi, '')
        .replace(/\([^)]*\d{1,2}\/\d{1,2}\/\d{4}[^)]*\)/gi, '');

    // Step 5: Clean up brackets and parentheses content (selective)
    content = content
        .replace(/\[Live\]/gi, '') // Remove live tags
        .replace(/\[Update\]/gi, '') // Remove update tags
        .replace(/\[Breaking\]/gi, '') // Remove breaking tags
        .replace(/\[FOTO\]/gi, '') // Remove photo tags
        .replace(/\[VIDEO\]/gi, ''); // Remove video tags

    // Step 6: Remove CSS and styling artifacts
    content = content
        .replace(/important;\s*}/gi, '')
        .replace(/display:\s*[^;]*;/gi, '')
        .replace(/visibility:\s*[^;]*;/gi, '')
        .replace(/height:\s*[^;]*;/gi, '')
        .replace(/width:\s*[^;]*;/gi, '')
        .replace(/div-gpt-ad[^"'\s]*/gi, '')
        .replace(/adSlot_[^"'\s]*/gi, '')
        .replace(/billboard[^"'\s]*/gi, '')
        .replace(/firstChild[^"'\s]*/gi, '');

    // Step 7: Normalize whitespace and formatting
    content = content
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines
        .replace(/\s{2,}/g, ' ') // Replace multiple spaces
        .replace(/\t+/g, ' ') // Replace tabs with space
        .replace(/[^\S\n]{2,}/g, ' ') // Replace multiple non-newline whitespace
        .trim();

    // Step 8: Filter and clean paragraphs
    const paragraphs = content.split('\n\n')
        .map(p => p.trim())
        .filter(p => {
            // Remove very short paragraphs
            if (p.length < 20) return false;

            // Remove paragraphs that are mostly special characters or numbers
            if (p.match(/^[^a-zA-Z]{5,}$/)) return false;

            // Remove paragraphs that look like navigation or UI elements
            if (p.match(/^(Next|Previous|Share|Tweet|Like|Follow|Subscribe|Login|Register|Menu|Home|Search)/i)) return false;

            // Remove paragraphs with excessive punctuation
            if ((p.match(/[^\w\s]/g) || []).length > p.length * 0.4) return false;

            // Remove paragraphs that still contain JavaScript remnants
            if (p.match(/(function|var\s|let\s|const\s|if\s*\(|else|console\.|window\.|document\.)/)) return false;

            // Remove paragraphs that are mostly technical/code-like
            if (p.match(/[{}();=<>]/g) && (p.match(/[{}();=<>]/g) || []).length > 3) return false;

            return true;
        });

    // Step 9: Rejoin and final cleanup
    content = paragraphs.join('\n\n');

    // Step 10: Smart truncation if content limit is specified
    if (contentLimit && content.length > contentLimit) {
        // Try to cut at paragraph boundary first
        const truncated = content.substring(0, contentLimit);
        const lastParagraph = truncated.lastIndexOf('\n\n');
        const lastSentence = truncated.lastIndexOf('.');

        if (lastParagraph > contentLimit * 0.7) {
            content = content.substring(0, lastParagraph);
        } else if (lastSentence > contentLimit * 0.8) {
            content = truncated.substring(0, lastSentence + 1);
        } else {
            // Find the last complete word
            const lastSpace = truncated.lastIndexOf(' ');
            content = truncated.substring(0, lastSpace) + '...';
        }
    }

    return content.trim();
}

async function scrapeDetik(tag, options = {}) {
    const { includeContent = false, contentLimit = 500, contentFormat = 'string' } = options;
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
            let title = $(el).find('.media__title, .title, h2, h3, a').first().text().trim();
            let link = $(el).find('a').attr('href');
            let time = $(el).find('.media__date, .date, time').first().text().trim();

            // Clean up title - remove source prefix and date
            if (title) {
                // Remove source prefixes like "detikNews", "CNN Indonesia", etc
                title = title.replace(/^(detikNews|detikcom|CNN Indonesia|CNBC Indonesia|Liputan6|Kompas|Tempo|Tribun|Okezone)\s*/i, '');

                // Remove date patterns at the beginning
                title = title.replace(/^(Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu),?\s*\d{1,2}\s+(Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des)\s+\d{4}\s+\d{1,2}:\d{2}\s+(WIB|WITA|WIT)\s*/i, '');

                // Remove extra whitespace and newlines
                title = title.replace(/\s+/g, ' ').trim();
            }

            // Clean up time - extract only time info
            if (time) {
                // Extract time pattern like "2 jam lalu", "Kemarin 15:30", etc
                const timeMatch = time.match(/(\d+\s+(detik|menit|jam|hari)\s+lalu|Kemarin\s+\d{1,2}:\d{2}|\d{1,2}\s+(Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des)\s+\d{4}|\d{1,2}:\d{2})/i);
                if (timeMatch) {
                    time = timeMatch[0];
                } else {
                    // Clean up time by removing source and extra text
                    time = time.replace(/^(detikNews|detikcom|CNN Indonesia|CNBC Indonesia|Liputan6|Kompas|Tempo|Tribun|Okezone)\s*/i, '');
                    time = time.replace(/\s+/g, ' ').trim();
                }
            }

            // Extract excerpt/summary from the listing page
            let excerpt = $(el).find('.media__desc, .desc, .excerpt, p').first().text().trim();

            // Clean up excerpt
            if (excerpt && excerpt.length > 200) {
                excerpt = excerpt.substring(0, 200) + '...';
            }            // Try to extract the best image from any <img> inside the element.
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
                results.push(normalize({ title, link, time, image, excerpt, contentFormat }));
            }
        });


        // Optionally fetch article pages to extract og:image if image is missing
        // AND/OR fetch full content if requested
        if ((process.env.USE_OG_IMAGE === '1' || includeContent) && results.length > 0) {
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
                const needsImage = !results[i].image || looksLikeBadImage(results[i].image);
                const needsContent = includeContent && !results[i].content;

                if (needsImage || needsContent) {
                    try {
                        const { data: articleHtml } = await axios.get(results[i].link, {
                            headers: { 'User-Agent': 'Mozilla/5.0' },
                            timeout: 8000,
                        });
                        const $$ = cheerio.load(articleHtml);

                        // Extract og:image if needed
                        if (needsImage) {
                            const ogImage = $$('meta[property="og:image"]').attr('content') || $$('meta[name="og:image"]').attr('content');
                            if (ogImage) results[i].image = ogImage;
                        }

                        // Extract full content if requested
                        if (needsContent) {
                            let content = '';

                            // Try multiple selectors for content (prioritized for Detik.com)
                            const contentSelectors = [
                                '.detail__body-text',
                                '.itp_bodycontent',
                                '.read__content',
                                '.detikRichTextArticle',
                                '.detail-content',
                                '[data-module="detikContent"]',
                                'article .content',
                                '.post-content',
                                '.entry-content',
                                '.article-content',
                                '.content-body'
                            ];

                            for (const selector of contentSelectors) {
                                const contentContainer = $$(selector);
                                if (contentContainer.length > 0) {
                                    // First, remove script and style tags from container
                                    contentContainer.find('script, style, noscript, iframe, .advertisement, .ads, .social-share, .related-articles').remove();

                                    // Extract paragraphs
                                    const paragraphs = [];
                                    contentContainer.find('p').each((i, el) => {
                                        const text = $$(el).text().trim();
                                        // Filter out unwanted content
                                        if (text.length > 15 &&
                                            !text.match(/^(ADVERTISEMENT|Baca juga|Lihat juga|Simak|Tonton|Loading|googletag|function|var\s|window\.|document\.)/i) &&
                                            !text.match(/detik\.com|@detikcom|detikNews/i) &&
                                            !text.match(/^[^a-zA-Z]*$/)) {
                                            paragraphs.push(text);
                                        }
                                    });

                                    if (paragraphs.length > 0) {
                                        content = paragraphs.join('\n\n');
                                        break;
                                    }

                                    // Fallback: get main content div text but clean it aggressively
                                    const rawText = contentContainer.clone();
                                    rawText.find('script, style, noscript, iframe, .advertisement, .ads, .social-share, .related-articles, .author-info, .tags, .share').remove();
                                    const allText = rawText.text().trim();

                                    if (allText.length > 200) {
                                        content = allText;
                                        break;
                                    }
                                }
                            }

                            // If no content found with specific selectors, try broader approach
                            if (!content) {
                                // Remove scripts and unwanted elements from body
                                const bodyClone = $$('body').clone();
                                bodyClone.find('script, style, noscript, iframe, header, footer, nav, .sidebar, .menu, .navigation, .advertisement, .ads').remove();

                                // Extract meaningful sentences
                                const bodyText = bodyClone.text();
                                const sentences = bodyText.split(/[.!?]+/).filter(s => {
                                    const clean = s.trim();
                                    return clean.length > 30 &&
                                        !clean.match(/googletag|function|var\s|window\.|document\./i) &&
                                        clean.match(/[a-zA-Z]/);
                                });

                                if (sentences.length >= 2) {
                                    content = sentences.slice(0, 8).join('. ').trim() + '.';
                                }
                            }

                            // Clean up content
                            // Determine best available content: try to clean article content, else fall back to excerpt or title
                            let finalContent = null;
                            if (content) {
                                const cleanedContent = cleanContent(content);
                                if (cleanedContent && cleanedContent.length > 50) {
                                    finalContent = contentLimit && cleanedContent.length > contentLimit ?
                                        cleanedContent.substring(0, contentLimit) + '...' : cleanedContent;
                                }
                            }

                            // Fallbacks if no cleaned article content was found
                            if (!finalContent) {
                                const existingData = results[i];
                                if (existingData && existingData.excerpt && existingData.excerpt.length > 20) {
                                    finalContent = existingData.excerpt;
                                } else if (existingData && existingData.title) {
                                    finalContent = existingData.title;
                                } else {
                                    finalContent = '';
                                }
                                // Respect contentLimit on fallback text too
                                if (contentLimit && finalContent.length > contentLimit) {
                                    finalContent = finalContent.substring(0, contentLimit) + '...';
                                }
                            }

                            // Re-normalize the result with content (ensures every item has a content field when requested)
                            const existingData = results[i];
                            results[i] = normalize({
                                title: existingData.title,
                                link: existingData.link,
                                time: existingData.publishedAt,
                                image: existingData.image,
                                excerpt: existingData.excerpt,
                                content: finalContent,
                                contentFormat
                            });
                        }
                    } catch (e) {
                        // ignore fetch errors for article pages
                        console.warn(`Failed to fetch content for ${results[i].link}:`, e.message);
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
