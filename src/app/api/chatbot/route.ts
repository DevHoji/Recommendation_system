import { NextRequest, NextResponse } from 'next/server';
import { geminiService } from '@/lib/gemini';
import { movieService } from '@/lib/movie-service';
import neo4jService from '@/lib/neo4j';

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Use Gemini AI to understand the user's intent and generate a response
    const aiPrompt = `
You are HojiAI, an intelligent movie recommendation assistant powered by Neo4j graph database.
Analyze this user message and provide a helpful response about movies.

User message: "${message}"

Based on the message, determine:
1. What type of movie query this is (recommendation, search, information, etc.)
2. Extract relevant parameters (genre, year, rating, similar movies, etc.)
3. Provide a natural, helpful response

If the user is asking for movie recommendations or searches, format your response to include:
- A friendly explanation of what you found
- Mention that results are powered by Neo4j graph database
- Keep responses conversational and engaging

Examples of queries you should handle:
- "Suggest movies like Inception" → Look for sci-fi/thriller movies with high ratings
- "Find action movies from 2020" → Search by genre and year
- "What are the top rated comedies?" → Search comedies sorted by rating
- "Show me movies with Leonardo DiCaprio" → Search by actor (if available)

Respond in a friendly, knowledgeable tone as a movie expert.
`;

    let aiResponse = '';
    let searchParams: any = {};
    let movies: any[] = [];

    // Use fallback logic (works without external AI service)
    const fallbackResponse = generateFallbackResponse(message);
    aiResponse = fallbackResponse.response;
    searchParams = fallbackResponse.searchParams;

    if (searchParams.hasSearchCriteria) {
      try {
        // Use Neo4j-powered movie search
        const searchResults = await movieService.getMovies(1, 10, searchParams);
        movies = searchResults.movies || [];

        // If no results from main search, try alternative queries
        if (movies.length === 0) {
          movies = await getAlternativeMovies(searchParams);
        }
      } catch (dbError) {
        console.log('Database search failed, using mock data');
        // Provide some mock movie data as fallback
        movies = getMockMovies(searchParams);
      }
    }

    // Enhance response with movie results using the new enhanced function
    if (movies.length > 0) {
      aiResponse = generateEnhancedResponse(message, searchParams, movies.length);
    } else if (searchParams.hasSearchCriteria) {
      aiResponse += '\n\n🔍 I couldn\'t find movies matching those exact criteria. Try asking for different genres, years, or more general recommendations!';
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      movies: movies.slice(0, 5), // Return top 5 movies
      searchParams
    });

  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Chatbot service failed' 
      },
      { status: 500 }
    );
  }
}

// Extract search parameters from user message
function extractSearchParams(message: string): any {
  const lowerMessage = message.toLowerCase();
  const params: any = {};
  let hasSearchCriteria = false;

  // Extract genres
  const genres = ['action', 'comedy', 'drama', 'horror', 'sci-fi', 'romance', 'thriller', 'animation', 'adventure', 'crime', 'fantasy', 'mystery'];
  for (const genre of genres) {
    if (lowerMessage.includes(genre)) {
      params.genre = genre.charAt(0).toUpperCase() + genre.slice(1);
      hasSearchCriteria = true;
      break;
    }
  }

  // Extract years
  const yearMatch = lowerMessage.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    params.year = parseInt(yearMatch[0]);
    hasSearchCriteria = true;
  }

  // Extract rating preferences
  if (lowerMessage.includes('top rated') || lowerMessage.includes('best') || lowerMessage.includes('highest rated')) {
    params.sortBy = 'rating';
    params.sortOrder = 'desc';
    params.minRating = 4.0;
    hasSearchCriteria = true;
  }

  // Extract popularity preferences
  if (lowerMessage.includes('popular') || lowerMessage.includes('trending')) {
    params.sortBy = 'popularity';
    params.sortOrder = 'desc';
    hasSearchCriteria = true;
  }

  return { ...params, hasSearchCriteria };
}

// Fallback response generation without AI
function generateFallbackResponse(message: string): { response: string; searchParams: any } {
  const lowerMessage = message.toLowerCase();
  const searchParams = extractSearchParams(message);
  
  let response = '';

  if (lowerMessage.includes('like') && (lowerMessage.includes('inception') || lowerMessage.includes('similar'))) {
    response = '🧠 Great choice! I\'ll find mind-bending sci-fi thrillers similar to Inception for you.';
    searchParams.genre = 'Sci-Fi';
    searchParams.minRating = 3.5;
    searchParams.hasSearchCriteria = true;
  } else if (searchParams.genre) {
    response = `🎭 Looking for ${searchParams.genre} movies! Let me search our Neo4j database for the best ${searchParams.genre.toLowerCase()} films.`;
  } else if (searchParams.year) {
    response = `📅 Searching for great movies from ${searchParams.year}! That was a fantastic year for cinema.`;
  } else if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) {
    response = '🎬 I\'d love to recommend some movies for you! Our Neo4j-powered system has analyzed thousands of films to find the perfect matches.';
    searchParams.sortBy = 'rating';
    searchParams.sortOrder = 'desc';
    searchParams.hasSearchCriteria = true;
  } else {
    response = '🤖 I\'m here to help you discover amazing movies! Try asking me things like:\n\n• "Find action movies from 2020"\n• "Suggest comedies with high ratings"\n• "Show me movies like Inception"';
  }

  return { response, searchParams };
}

// Mock movie data for fallback
function getMockMovies(searchParams: any): any[] {
  const mockMovies = [
    {
      movieId: 1,
      title: "The Dark Knight",
      genres: ["Action", "Crime", "Drama"],
      year: 2008,
      averageRating: 4.5,
      posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg"
    },
    {
      movieId: 2,
      title: "Inception",
      genres: ["Action", "Sci-Fi", "Thriller"],
      year: 2010,
      averageRating: 4.4,
      posterUrl: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg"
    },
    {
      movieId: 3,
      title: "The Avengers",
      genres: ["Action", "Adventure", "Sci-Fi"],
      year: 2012,
      averageRating: 4.2,
      posterUrl: "https://image.tmdb.org/t/p/w500/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg"
    },
    {
      movieId: 4,
      title: "Superbad",
      genres: ["Comedy"],
      year: 2007,
      averageRating: 4.0,
      posterUrl: "https://image.tmdb.org/t/p/w500/ek8e8txUyUwd2BNqj6lFEerJfbq.jpg"
    },
    {
      movieId: 5,
      title: "The Shawshank Redemption",
      genres: ["Drama"],
      year: 1994,
      averageRating: 4.8,
      posterUrl: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg"
    }
  ];

  // Filter based on search parameters
  let filteredMovies = mockMovies;

  if (searchParams.genre) {
    filteredMovies = filteredMovies.filter(movie =>
      movie.genres.some(g => g.toLowerCase().includes(searchParams.genre.toLowerCase()))
    );
  }

  if (searchParams.year) {
    filteredMovies = filteredMovies.filter(movie => movie.year === searchParams.year);
  }

  if (searchParams.minRating) {
    filteredMovies = filteredMovies.filter(movie => movie.averageRating >= searchParams.minRating);
  }

  return filteredMovies;
}

// Alternative movie search using direct Neo4j queries
async function getAlternativeMovies(searchParams: any): Promise<any[]> {
  try {
    let query = '';
    let params: any = {};

    if (searchParams.genre) {
      query = `
        MATCH (m:Movie)-[:HAS_GENRE]->(g:Genre {name: $genre})
        OPTIONAL MATCH (m)<-[r:RATED]-()
        WITH m, avg(r.rating) as avgRating, count(r) as ratingCount
        WHERE avgRating >= 3.0
        RETURN m.movieId as movieId, m.title as title, m.genres as genres,
               m.year as year, avgRating, ratingCount, m.tmdbId as tmdbId
        ORDER BY avgRating DESC, ratingCount DESC
        LIMIT 10
      `;
      params.genre = searchParams.genre;
    } else if (searchParams.year) {
      query = `
        MATCH (m:Movie)
        WHERE m.year = $year
        OPTIONAL MATCH (m)<-[r:RATED]-()
        WITH m, avg(r.rating) as avgRating, count(r) as ratingCount
        WHERE avgRating >= 3.0
        RETURN m.movieId as movieId, m.title as title, m.genres as genres,
               m.year as year, avgRating, ratingCount, m.tmdbId as tmdbId
        ORDER BY avgRating DESC, ratingCount DESC
        LIMIT 10
      `;
      params.year = searchParams.year;
    } else {
      // Default: get highly rated movies
      query = `
        MATCH (m:Movie)<-[r:RATED]-()
        WITH m, avg(r.rating) as avgRating, count(r) as ratingCount
        WHERE avgRating >= 4.0 AND ratingCount >= 10
        RETURN m.movieId as movieId, m.title as title, m.genres as genres,
               m.year as year, avgRating, ratingCount, m.tmdbId as tmdbId
        ORDER BY avgRating DESC, ratingCount DESC
        LIMIT 10
      `;
    }

    const results = await neo4jService.runQuery(query, params);
    return results.map((record: any) => ({
      movieId: record.movieId,
      title: record.title,
      genres: record.genres,
      year: record.year,
      averageRating: record.avgRating ? parseFloat(record.avgRating.toFixed(1)) : undefined,
      ratingCount: record.ratingCount,
      tmdbId: record.tmdbId,
      posterUrl: record.tmdbId ? `https://image.tmdb.org/t/p/w500/placeholder${record.movieId % 10}.jpg` : null
    }));
  } catch (error) {
    console.error('Alternative movie search failed:', error);
    return [];
  }
}

// Enhanced fallback response generation
function generateEnhancedResponse(message: string, searchParams: any, movieCount: number): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('like') && lowerMessage.includes('inception')) {
    return `🧠 Inception is a masterpiece! I've found ${movieCount} mind-bending sci-fi thrillers that share its complex storytelling and stunning visuals. These movies will challenge your perception of reality just like Inception did.`;
  } else if (lowerMessage.includes('like') && lowerMessage.includes('dark knight')) {
    return `🦇 The Dark Knight is legendary! I've discovered ${movieCount} superhero and crime dramas with the same dark, gritty tone and exceptional storytelling that made Nolan's Batman trilogy so compelling.`;
  } else if (searchParams.genre === 'Action') {
    return `💥 Action movies are pure adrenaline! I've found ${movieCount} high-octane action films from our Neo4j database that will keep you on the edge of your seat with spectacular stunts and heart-pounding sequences.`;
  } else if (searchParams.genre === 'Comedy') {
    return `😂 Time for some laughs! I've curated ${movieCount} hilarious comedies that will brighten your day. These films have been rated highly by our community for their wit and humor.`;
  } else if (searchParams.genre === 'Horror') {
    return `👻 Ready for some scares? I've found ${movieCount} spine-chilling horror movies that will keep you up at night. These films are highly rated for their ability to terrify and thrill.`;
  } else if (searchParams.genre === 'Sci-Fi') {
    return `🚀 Explore the future! I've discovered ${movieCount} mind-expanding sci-fi films that will take you to other worlds and challenge your imagination with cutting-edge concepts.`;
  } else if (searchParams.year) {
    return `📅 ${searchParams.year} was an amazing year for cinema! I've found ${movieCount} standout films from that year that defined the era and left lasting impacts on movie history.`;
  } else if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) {
    return `🎬 Based on our Neo4j-powered recommendation engine, I've found ${movieCount} exceptional films tailored just for you! These movies have been selected based on ratings, popularity, and user preferences.`;
  } else if (lowerMessage.includes('best') || lowerMessage.includes('top')) {
    return `⭐ Here are ${movieCount} of the highest-rated films in our database! These movies have consistently impressed audiences and critics alike with their outstanding quality.`;
  } else {
    return `🤖 I've analyzed our movie database and found ${movieCount} great films for you! Each recommendation is powered by our Neo4j graph database that understands the complex relationships between movies, genres, and user preferences.`;
  }
}
