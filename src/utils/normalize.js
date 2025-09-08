function normalize({ title, link, time, image }) {
    return {
        title,
        link,
        publishedAt: time, // bisa diubah ke ISO format
        image: image || null,
        source: 'Detik',
    };
}

module.exports = normalize;
