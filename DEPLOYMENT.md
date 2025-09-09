# CineAI Movie Recommendation System - Deployment Guide

## 🚀 Vercel Deployment Instructions

### Prerequisites
- GitHub repository with all code committed
- Vercel account (free tier available)
- Environment variables ready

### Step 1: Environment Variables Setup

Before deploying, ensure you have these environment variables:

```bash
# Neo4j AuraDB Configuration
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password
NEO4J_DATABASE=neo4j

# Google Gemini AI API
GEMINI_API_KEY=your-gemini-api-key

# TMDB API (for movie posters)
TMDB_API_KEY=your-tmdb-api-key

# Optional: Google Cloud (for TTS/STT)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_PRIVATE_KEY=your-private-key
```

### Step 2: Deploy to Vercel

#### Option A: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: cineai-movie-recommendation
# - Directory: ./
# - Override settings? No

# Set environment variables
vercel env add NEO4J_URI
vercel env add NEO4J_USERNAME
vercel env add NEO4J_PASSWORD
vercel env add NEO4J_DATABASE
vercel env add GEMINI_API_KEY
vercel env add TMDB_API_KEY

# Deploy to production
vercel --prod
```

#### Option B: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import from GitHub: `DevHoji/Recommendation_system`
4. Configure:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Add Environment Variables in dashboard
6. Click "Deploy"

### Step 3: Post-Deployment Setup

#### Initialize Database (if using Neo4j)
```bash
# After deployment, initialize the database
curl -X POST https://your-app.vercel.app/api/init-database
```

#### Test API Endpoints
```bash
# Test movies API
curl https://your-app.vercel.app/api/movies?limit=5

# Test recommendations
curl https://your-app.vercel.app/api/recommendations/1

# Test voice search
curl -X POST https://your-app.vercel.app/api/voice-search \
  -H "Content-Type: application/json" \
  -d '{"transcript":"show me action movies"}'
```

## 🔧 Configuration Details

### Vercel.json Configuration
The project includes a `vercel.json` file with:
- Next.js build configuration
- API route handling
- CORS headers for API endpoints
- Function timeout settings (30s)

### Environment Variables
- **Required**: NEO4J_* variables for database
- **Required**: GEMINI_API_KEY for AI features
- **Optional**: TMDB_API_KEY for movie posters
- **Optional**: Google Cloud credentials for TTS/STT

### Database Fallback
The application includes comprehensive mock data fallback:
- If Neo4j is unavailable, uses mock MovieLens data
- All features work without database connection
- Graceful degradation for all API endpoints

## 🎯 Features Deployed

### ✅ Core Features
- **Netflix-style Homepage** with hero section and carousels
- **Movie Browsing** with search, filtering, and pagination
- **AI-Powered Recommendations** using Neo4j graph algorithms
- **Voice Search** with natural language processing
- **Personal Watchlist** with localStorage persistence
- **Responsive Design** optimized for all devices

### ✅ API Endpoints
- `/api/movies` - Movie browsing and filtering
- `/api/movies/[id]` - Individual movie details
- `/api/recommendations/[userId]` - Personalized recommendations
- `/api/search` - Advanced search with voice support
- `/api/voice-search` - Voice command processing
- `/api/tts` - Text-to-speech (placeholder)
- `/api/stt` - Speech-to-text (placeholder)
- `/api/init-database` - Database initialization

### ✅ Pages
- **Homepage** (`/`) - Featured content and recommendations
- **Movies** (`/movies`) - Browse all movies with filters
- **Watchlist** (`/watchlist`) - Personal movie collection
- **Profile** (`/profile`) - User statistics and recommendations
- **TV Shows** (`/tv-shows`) - Placeholder for future expansion

## 🔍 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (18+ required)
   - Verify all dependencies in package.json
   - Check TypeScript errors

2. **API Errors**
   - Verify environment variables are set
   - Check Neo4j connection credentials
   - Test API endpoints individually

3. **Database Connection**
   - Neo4j AuraDB requires whitelisted IPs
   - Check connection string format
   - Verify credentials and database name

4. **Performance Issues**
   - API functions have 30s timeout
   - Large datasets may need pagination
   - Consider caching for frequently accessed data

### Monitoring
- Use Vercel Analytics for performance monitoring
- Check function logs in Vercel dashboard
- Monitor API response times and error rates

## 📊 Production Checklist

- [ ] All environment variables configured
- [ ] Database connection tested
- [ ] API endpoints responding correctly
- [ ] Frontend loading without errors
- [ ] Voice search functionality working
- [ ] Responsive design verified on mobile
- [ ] Performance optimized (images, caching)
- [ ] Error handling implemented
- [ ] Monitoring and logging set up

## 🎉 Success!

Your CineAI Movie Recommendation System is now deployed and ready for demonstration!

**Live URL**: `https://your-app.vercel.app`

The application includes:
- ✅ Full Neo4j integration with Cypher queries
- ✅ AI-powered recommendations using graph algorithms
- ✅ Voice search with natural language processing
- ✅ Professional Netflix-style UI with glassmorphism
- ✅ Comprehensive API with fallback systems
- ✅ Mobile-responsive design
- ✅ Ready for trainer demonstration

---

**Note**: The application gracefully handles Neo4j connection issues by falling back to comprehensive mock data, ensuring all features work even without database connectivity.
