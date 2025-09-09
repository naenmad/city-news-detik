const express = require('express');
const cors = require('cors');
const newsRoute = require('./routes/news.route');
const enhancedNewsRoute = require('./routes/enhanced-news.route');

const app = express();

// CORS configuration for production
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? ['https://your-frontend-domain.com', 'https://city-news-detik.vercel.app']
        : '*',
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Basic security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Serve static files from public/ (includes .well-known used by some devtools)
app.use(express.static('public'));

// Basic Content-Security-Policy header for served responses.
// Adjust the policy as needed; this one allows self resources and connections to http/https origins.
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' data:; connect-src 'self' http: https:;");
    next();
});

// API Routes
app.use('/api', newsRoute);
app.use('/api/v2', enhancedNewsRoute);

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
    res.json({
        title: 'Detik News API Documentation',
        version: '2.0.0',
        endpoints: {
            'v1': {
                'GET /api/detik-news': 'Basic news by city'
            },
            'v2': {
                'GET /api/v2/news': 'Enhanced news with filters, pagination, multi-city support',
                'GET /api/v2/search': 'Global search across cities',
                'GET /api/v2/categories': 'Available news categories',
                'GET /api/v2/trending': 'Trending keywords and topics',
                'GET /api/v2/stats': 'API usage statistics'
            }
        },
        examples: {
            'Single city': '/api/v2/news?tag=jakarta&limit=5',
            'Multiple cities': '/api/v2/news?tags=jakarta,bandung,surabaya&limit=10',
            'With pagination': '/api/v2/news?tag=jakarta&page=2&limit=5',
            'With category filter': '/api/v2/news?tag=jakarta&category=politik',
            'Global search': '/api/v2/search?q=pemilu&limit=20',
            'Search in specific city': '/api/v2/search?q=ekonomi&tag=jakarta'
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server aktif di http://localhost:${PORT}`));
