/**
 * Detik News App - Enhanced Version
 * Features: View Toggle, Error Handling, Social Integration
 */

class DetikNewsApp {
    constructor() {
        this.form = document.getElementById('searchForm');
        this.cityInput = document.getElementById('cityInput');
        this.submitBtn = document.getElementById('submitBtn');
        this.resultsSection = document.getElementById('results');
        this.newsGrid = document.getElementById('newsGrid');
        this.newsCount = document.getElementById('newsCount');
        this.jsonView = document.getElementById('jsonView');
        this.jsonContent = document.getElementById('jsonContent');

        // View toggle elements
        this.viewCardsBtn = document.getElementById('viewCards');
        this.viewJsonBtn = document.getElementById('viewJson');
        this.copyJsonBtn = document.getElementById('copyJson');

        this.currentData = null;
        this.currentView = 'cards';
        this.isLoading = false;

        this.initializeEventListeners();
        this.loadCitySuggestions();
    }

    initializeEventListeners() {
        this.form?.addEventListener('submit', (e) => this.handleSubmit(e));

        // View toggle event listeners
        this.viewCardsBtn?.addEventListener('click', () => this.switchView('cards'));
        this.viewJsonBtn?.addEventListener('click', () => this.switchView('json'));
        this.copyJsonBtn?.addEventListener('click', () => this.copyJsonToClipboard());

        // Input validation
        this.cityInput?.addEventListener('input', () => this.validateInput());
    }

    switchView(view) {
        this.currentView = view;

        if (view === 'cards') {
            this.newsGrid.style.display = 'grid';
            this.jsonView.style.display = 'none';
            this.viewCardsBtn.classList.add('active');
            this.viewCardsBtn.setAttribute('aria-pressed', 'true');
            this.viewJsonBtn.classList.remove('active');
            this.viewJsonBtn.setAttribute('aria-pressed', 'false');
        } else {
            this.newsGrid.style.display = 'none';
            this.jsonView.style.display = 'block';
            this.viewJsonBtn.classList.add('active');
            this.viewJsonBtn.setAttribute('aria-pressed', 'true');
            this.viewCardsBtn.classList.remove('active');
            this.viewCardsBtn.setAttribute('aria-pressed', 'false');

            // Update JSON content if data exists
            if (this.currentData) {
                this.updateJsonView();
            }
        }
    }

    updateJsonView() {
        if (this.currentData && this.jsonContent) {
            this.jsonContent.textContent = JSON.stringify(this.currentData, null, 2);
        }
    }

    async copyJsonToClipboard() {
        if (this.currentData && this.copyJsonBtn) {
            try {
                await navigator.clipboard.writeText(JSON.stringify(this.currentData, null, 2));

                // Visual feedback
                const originalText = this.copyJsonBtn.innerHTML;
                this.copyJsonBtn.innerHTML = '<span>✅</span> Copied!';
                this.copyJsonBtn.style.background = '#10b981';

                setTimeout(() => {
                    this.copyJsonBtn.innerHTML = originalText;
                    this.copyJsonBtn.style.background = '';
                }, 2000);

            } catch (err) {
                console.error('Failed to copy JSON:', err);

                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = JSON.stringify(this.currentData, null, 2);
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);

                this.copyJsonBtn.innerHTML = '<span>✅</span> Copied!';
                setTimeout(() => {
                    this.copyJsonBtn.innerHTML = '<span>📋</span> Copy';
                }, 2000);
            }
        }
    }

    validateInput() {
        if (!this.cityInput) return;

        const city = this.cityInput.value.trim();
        const isValid = city.length >= 2;

        if (this.submitBtn) {
            this.submitBtn.disabled = !isValid || this.isLoading;
        }

        // Remove invalid state styling if input becomes valid
        if (isValid) {
            this.cityInput.classList.remove('input-error');
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        if (this.isLoading) return;

        const city = this.cityInput?.value.trim();
        if (!city) {
            this.showError('Silakan masukkan nama kota.');
            return;
        }

        try {
            this.setLoadingState(true);
            this.clearResults();

            const data = await this.fetchNews(city);
            this.currentData = data;

            if (data && data.data && data.data.length > 0) {
                this.displayResults(data);
                this.showResultsSection();
            } else {
                this.showError('Tidak ada berita ditemukan untuk kota tersebut.');
            }

        } catch (error) {
            console.error('Error fetching news:', error);
            this.showError('Terjadi kesalahan saat mengambil berita. Silakan coba lagi.');
        } finally {
            this.setLoadingState(false);
        }
    }

    async fetchNews(city) {
        const response = await fetch(`/api/detik-news?tag=${encodeURIComponent(city)}`);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('API endpoint tidak ditemukan');
            } else if (response.status >= 500) {
                throw new Error('Server sedang mengalami masalah');
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        }

        const data = await response.json();

        if (!data || typeof data !== 'object') {
            throw new Error('Response API tidak valid');
        }

        return data;
    }

    displayResults(data) {
        if (!this.newsGrid || !data.data) return;

        this.newsGrid.innerHTML = '';

        data.data.forEach((article, index) => {
            const card = this.createNewsCard(article, index);
            this.newsGrid.appendChild(card);
        });

        // Update count
        if (this.newsCount) {
            this.newsCount.textContent = `${data.data.length} berita`;
        }

        // Update JSON view if currently active
        if (this.currentView === 'json') {
            this.updateJsonView();
        }
    }

    createNewsCard(article, index) {
        const card = document.createElement('article');
        card.className = 'news-card';
        card.setAttribute('role', 'article');
        card.style.animationDelay = `${index * 0.1}s`;

        const imageUrl = article.image || '/placeholder-news.jpg';
        const publishedAt = article.publishedAt || 'Waktu tidak diketahui';
        const title = article.title || 'Judul tidak tersedia';
        const link = article.link || '#';

        card.innerHTML = `
            <div class="news-image">
                <img src="${imageUrl}" 
                     alt="${title}" 
                     loading="lazy"
                     onerror="this.src='/placeholder-news.jpg'; this.onerror=null;">
                <div class="news-source">
                    <span class="source-badge">${article.source || 'Detik'}</span>
                </div>
            </div>
            <div class="news-content">
                <div class="news-meta">
                    <time datetime="${new Date().toISOString()}" class="news-time">
                        🕒 ${publishedAt}
                    </time>
                </div>
                <h3 class="news-title">
                    <a href="${link}" target="_blank" rel="noopener noreferrer" class="news-link">
                        ${title}
                    </a>
                </h3>
                <div class="news-actions">
                    <a href="${link}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline">
                        📖 Baca Selengkapnya
                    </a>
                    <button type="button" class="btn btn-sm btn-outline" onclick="navigator.share ? navigator.share({title: '${title.replace(/'/g, "\\'")}', url: '${link}'}) : console.log('Share not supported')" title="Bagikan artikel">
                        🔗
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    showResultsSection() {
        if (this.resultsSection) {
            this.resultsSection.style.display = 'block';
            this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    clearResults() {
        if (this.newsGrid) {
            this.newsGrid.innerHTML = '';
        }
        if (this.newsCount) {
            this.newsCount.textContent = '0 berita';
        }
        if (this.jsonContent) {
            this.jsonContent.textContent = '';
        }
        this.currentData = null;
    }

    setLoadingState(loading) {
        this.isLoading = loading;

        if (this.submitBtn) {
            this.submitBtn.disabled = loading;
            if (loading) {
                this.submitBtn.classList.add('btn-loading');
                this.submitBtn.textContent = 'Mencari...';
            } else {
                this.submitBtn.classList.remove('btn-loading');
                this.submitBtn.textContent = 'Cari Berita';
            }
        }

        this.validateInput();
    }

    showError(message) {
        // Remove existing error messages
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Create error element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div class="error-content">
                <span class="error-icon">⚠️</span>
                <span class="error-text">${message}</span>
                <button type="button" class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Insert after form
        const form = document.getElementById('searchForm');
        if (form && form.parentNode) {
            form.parentNode.insertBefore(errorDiv, form.nextSibling);
        }

        // Add styles if not exist
        if (!document.querySelector('#error-styles')) {
            const style = document.createElement('style');
            style.id = 'error-styles';
            style.textContent = `
                .error-message {
                    margin: 1rem 0;
                    padding: 1rem;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 0.75rem;
                    backdrop-filter: blur(10px);
                    animation: slideIn 0.3s ease-out;
                }
                .error-content {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .error-icon {
                    font-size: 1.25rem;
                    flex-shrink: 0;
                }
                .error-text {
                    flex: 1;
                    color: #fca5a5;
                    font-weight: 500;
                }
                .error-close {
                    background: none;
                    border: none;
                    color: #fca5a5;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background-color 0.2s;
                }
                .error-close:hover {
                    background: rgba(239, 68, 68, 0.2);
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    async loadCitySuggestions() {
        // Default city suggestions
        const cities = [
            'Jakarta', 'Bandung', 'Surabaya', 'Bogor', 'Karawang',
            'Yogyakarta', 'Semarang', 'Medan', 'Makassar', 'Palembang',
            'Malang', 'Denpasar', 'Pontianak', 'Balikpapan', 'Manado'
        ];

        const datalist = document.getElementById('citySuggestions');
        if (datalist) {
            datalist.innerHTML = '';
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                datalist.appendChild(option);
            });
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.detikNewsApp = new DetikNewsApp();
});

// Handle form submission from HTML
function handleFormSubmit(event) {
    if (window.detikNewsApp) {
        window.detikNewsApp.handleSubmit(event);
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DetikNewsApp;
}
