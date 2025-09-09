import { NextRequest, NextResponse } from 'next/server';
import { geminiService } from '@/lib/gemini';
import { movieService } from '@/lib/movie-service';

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
You are CineAI, an intelligent movie recommendation assistant powered by Neo4j graph database. 
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
        const searchResults = await movieService.getMovies(1, 10, searchParams);
        movies = searchResults.movies || [];
      } catch (dbError) {
        console.log('Database search failed, using mock data');
        // Provide some mock movie data as fallback
        movies = getMockMovies(searchParams);
      }
    }

    // Enhance response with movie results
    if (movies.length > 0) {
      aiResponse += `\n\n🎬 I found ${movies.length} great movies for you! Here are the top recommendations:`;
    } else if (searchParams.hasSearchCriteria) {
      aiResponse += '\n\n🔍 I couldn\'t find movies matching those exact criteria. Try asking for different genres or years!';
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
