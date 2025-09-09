# 🚀 Deployment Guide

## Option 1: Vercel (Recommended)

### Quick Deploy
1. Push ke GitHub repository
2. Connect ke [vercel.com](https://vercel.com)
3. Import GitHub repo
4. Deploy automatically

### Manual Deploy
```bash
npm i -g vercel
vercel
```

**Environment Variables:**
- `NODE_ENV=production`

**URL:** `https://your-project.vercel.app`

---

## Option 2: Railway

### Quick Deploy
1. Go to [railway.app](https://railway.app)
2. "Deploy from GitHub repo"
3. Select repository
4. Auto-deploy

### Manual Deploy
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

---

## Option 3: Render

### Quick Deploy
1. Go to [render.com](https://render.com)
2. "New Web Service"
3. Connect GitHub
4. Build Command: `npm install`
5. Start Command: `npm start`

---

## Option 4: Heroku

### Deploy Steps
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create your-api-name

# Deploy
git push heroku main
```

---

## 🌐 **API Endpoints After Deploy**

```
GET /api/detik-news?tag=jakarta
GET /api/detik-news?tag=jakarta&content=true
GET /api/detik-news?tag=jakarta&content=true&format=paragraphs
GET /api/detik-news?tag=jakarta&limit=5&contentLimit=2000
```

## 🔧 **Environment Variables**

Create `.env` file or set in hosting platform:
```
NODE_ENV=production
PORT=3000
```

## 📊 **Performance Tips**

1. **Add caching** for better performance
2. **Rate limiting** to prevent abuse
3. **Error monitoring** with Sentry
4. **CDN** for static assets

## 🛡️ **Security**

1. Add helmet.js for security headers
2. Implement rate limiting
3. Add API key authentication if needed
4. Enable CORS properly

## 📈 **Monitoring**

After deployment, monitor:
- Response times
- Error rates
- Memory usage
- Request volume

---

## 🎯 **Recommended: Vercel**

**Why Vercel?**
- ✅ Zero config deployment
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Free tier generous
- ✅ Perfect for API hosting
- ✅ Auto-deploy from Git

**Deploy URL:** `https://city-news-detik.vercel.app`
