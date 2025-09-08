function normalize({ title, link, time, image, excerpt, content, contentFormat = 'string' }) {
    const result = {
        title,
        link,
        publishedAt: time, // bisa diubah ke ISO format
        image: image || null,
        source: 'Detik',
    };

    // Add excerpt if available
    if (excerpt) {
        result.excerpt = excerpt;
    }

    // Add content if available
    if (content) {
        if (contentFormat === 'paragraphs' && typeof content === 'string') {
            // Convert content to structured paragraphs
            const paragraphs = content.split('\n\n')
                .map(p => p.trim())
                .filter(p => p.length > 20)
                .map((p, index) => ({
                    id: index + 1,
                    text: p,
                    wordCount: p.split(/\s+/).length
                }));

            result.content = {
                format: 'paragraphs',
                totalParagraphs: paragraphs.length,
                totalWords: paragraphs.reduce((sum, p) => sum + p.wordCount, 0),
                paragraphs: paragraphs
            };
        } else {
            result.content = content;
        }
    }

    return result;
}

module.exports = normalize;
