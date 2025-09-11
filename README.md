# 🎬 HojiAI - AI-Powered Movie Recommendation System

A modern, Netflix-style movie recommendation system built with Next.js, featuring AI-powered voice search, personalized recommendations, and a sleek responsive UI.


##  Features

###  AI-Powered Features
- **Voice Search**: Natural language voice commands powered by speech recognition
- **Smart Recommendations**: AI-driven movie suggestions using Google Gemini
- **Intelligent Filtering**: Voice commands like "show me action movies from 2020"
- **Text-to-Speech**: AI reads movie recommendations aloud

###  Core Functionality
- **Netflix-Style UI**: Dark theme with smooth animations and hover effects
- **Advanced Search**: Filter by genre, year, rating, and more
- **Watchlist**: Save movies with heart icons and persistent storage
- **Movie Details**: Rich movie information with posters, ratings, and genres
- **Responsive Design**: Mobile-first design that works on all devices

###  Technical Features
- **Next.js Fullstack**: API routes for backend functionality
- **Neo4j Database**: Graph database for complex movie relationships
- **TMDB Integration**: Real movie posters and metadata
- **Mock Data Fallback**: Demonstration mode when database unavailable
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Modern styling with custom animations


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

   # TMDB API (optional)
   TMDB_API_KEY=tmdb_api_key

   # Google Gemini AI (optional)
   GEMINI_API_KEY=gemini_api_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open  browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Setup

The application includes MovieLens dataset and supports  real Neo4j database:

### Option : Neo4j Database Setup
1. Create a Neo4j AuraDB instance
2. Add  credentials to `.env.local`
3. Click "Initialize Database" in the app
4. The system will import MovieLens data automatically

##  Usage

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
- Access  saved movies from the header
- Persistent storage across sessions


##  UI Components

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


### Manual Deployment
```bash
npm run build
npm start
```

##  Testing

The application includes comprehensive error handling and fallbacks:

- **Database Unavailable**: Automatically switches to mock data
- **API Failures**: Graceful degradation with user feedback
- **Voice Recognition**: Fallback to text input
- **Image Loading**: Placeholder images for missing posters


##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


**Built with ❤️ by DevHoji**
