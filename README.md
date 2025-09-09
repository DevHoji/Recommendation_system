# 🎬 CineAI - AI-Powered Movie Recommendation System

A modern, Netflix-style movie recommendation system built with Next.js, featuring AI-powered voice search, personalized recommendations, and a sleek responsive UI.

![CineAI Demo](https://via.placeholder.com/800x400/000000/FFFFFF?text=CineAI+Movie+Recommendation+System)

## ✨ Features

### 🤖 AI-Powered Features
- **Voice Search**: Natural language voice commands powered by speech recognition
- **Smart Recommendations**: AI-driven movie suggestions using Google Gemini
- **Intelligent Filtering**: Voice commands like "show me action movies from 2020"
- **Text-to-Speech**: AI reads movie recommendations aloud

### 🎯 Core Functionality
- **Netflix-Style UI**: Dark theme with smooth animations and hover effects
- **Advanced Search**: Filter by genre, year, rating, and more
- **Watchlist**: Save movies with heart icons and persistent storage
- **Movie Details**: Rich movie information with posters, ratings, and genres
- **Responsive Design**: Mobile-first design that works on all devices

### 🔧 Technical Features
- **Next.js Fullstack**: API routes for backend functionality
- **Neo4j Database**: Graph database for complex movie relationships
- **TMDB Integration**: Real movie posters and metadata
- **Mock Data Fallback**: Demonstration mode when database unavailable
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Modern styling with custom animations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Neo4j AuraDB account (optional - mock data available)
- TMDB API key (optional - placeholder images available)
- Google Gemini API key (optional - fallback pattern matching available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DevHoji/Recommendation_system.git
   cd Recommendation_system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` with your API keys:
   ```env
   # Neo4j Database (optional)
   NEO4J_URI=your_neo4j_uri
   NEO4J_USERNAME=neo4j
   NEO4J_PASSWORD=your_password
   NEO4J_DATABASE=neo4j

   # TMDB API (optional)
   TMDB_API_KEY=your_tmdb_api_key

   # Google Gemini AI (optional)
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Database Setup

The application includes MovieLens dataset and supports both real Neo4j database and mock data:

### Option 1: Use Mock Data (Recommended for Demo)
- No setup required
- Includes 220+ sample movies with ratings and genres
- Perfect for demonstration and development

### Option 2: Neo4j Database Setup
1. Create a Neo4j AuraDB instance
2. Add your credentials to `.env.local`
3. Click "Initialize Database" in the app
4. The system will import MovieLens data automatically

## 🎮 Usage

### Voice Search
1. Click the microphone icon in the header
2. Say commands like:
   - "Show me action movies"
   - "Find comedies from 2020"
   - "Recommend something funny"
   - "I want to watch a thriller"

### Manual Search
- Use the search bar for text-based movie search
- Apply filters for genre, year, and rating
- Sort by popularity, rating, year, or title

### Watchlist
- Click the heart icon on any movie card
- Access your saved movies from the header
- Persistent storage across sessions

## 🏗️ Architecture

```
src/
├── app/
│   ├── api/                 # Next.js API routes
│   │   ├── movies/         # Movie data endpoints
│   │   ├── voice-search/   # AI voice processing
│   │   └── init-database/  # Database setup
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # App layout
│   └── page.tsx            # Home page
├── components/
│   ├── Header.tsx          # Navigation and search
│   ├── MovieCard.tsx       # Individual movie display
│   ├── MovieGrid.tsx       # Movie collection display
│   └── VoiceSearch.tsx     # Voice search modal
├── lib/
│   ├── neo4j.ts           # Database connection
│   ├── tmdb.ts            # Movie API integration
│   ├── gemini.ts          # AI services
│   ├── movie-service.ts   # Business logic
│   ├── mock-data.ts       # Demo data
│   └── utils.ts           # Helper functions
└── data/                  # MovieLens dataset
```

## 🔌 API Endpoints

- `GET /api/movies` - Get movies with filtering and pagination
- `GET /api/movies/[id]` - Get specific movie details
- `POST /api/voice-search` - Process voice search queries
- `GET /api/init-database` - Check database status
- `POST /api/init-database` - Initialize database with MovieLens data

## 🎨 UI Components

### MovieCard
- Hover effects with scale animation
- Rating badges and genre tags
- Watchlist toggle functionality
- Responsive poster images

### VoiceSearch
- Real-time speech recognition
- Visual feedback during listening
- Error handling and fallbacks
- Text-to-speech responses

### MovieGrid
- Infinite scroll pagination
- Advanced filtering options
- Responsive grid layout
- Loading states and skeletons

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on every push

### Manual Deployment
```bash
npm run build
npm start
```

## 🧪 Testing

The application includes comprehensive error handling and fallbacks:

- **Database Unavailable**: Automatically switches to mock data
- **API Failures**: Graceful degradation with user feedback
- **Voice Recognition**: Fallback to text input
- **Image Loading**: Placeholder images for missing posters

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **MovieLens Dataset**: University of Minnesota
- **TMDB**: The Movie Database for poster images
- **Google Gemini**: AI-powered natural language processing
- **Neo4j**: Graph database technology
- **Next.js**: React framework for production

## 📞 Support

For support, email [your-email@example.com] or create an issue on GitHub.

---

**Built with ❤️ by DevHoji**
