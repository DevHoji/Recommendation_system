import { NextRequest, NextResponse } from 'next/server';
import { neo4jService } from '@/lib/neo4j';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Search query is required'
      }, { status: 400 });
    }

    // Test Neo4j connection
    const isConnected = await neo4jService.testConnection();
    
    if (!isConnected) {
      console.log('Neo4j not available, using mock search results');
      return getMockSearchResults(query, limit);
    }

    // Search movies in Neo4j
    const searchQuery = `
      MATCH (m:Movie)
      WHERE toLower(m.title) CONTAINS toLower($query)
      RETURN m.movieId as movieId, 
             m.title as title, 
             m.genres as genres, 
             m.year as year,
             m.posterUrl as posterUrl,
             m.averageRating as averageRating
      ORDER BY 
        CASE WHEN toLower(m.title) STARTS WITH toLower($query) THEN 1 ELSE 2 END,
        m.averageRating DESC
      LIMIT $limit
    `;

    const results = await neo4jService.runQuery(searchQuery, {
      query,
      limit
    });

    const movies = results.map(result => ({
      movieId: result.movieId,
      title: result.title,
      genres: result.genres || [],
      year: result.year,
      posterUrl: result.posterUrl || `https://image.tmdb.org/t/p/w500/placeholder${result.movieId % 10}.jpg`,
      averageRating: result.averageRating || 0
    }));

    return NextResponse.json({
      success: true,
      data: movies,
      query,
      total: movies.length
    });

  } catch (error) {
    console.error('Movie search error:', error);
    return getMockSearchResults(searchParams.get('q') || '', parseInt(searchParams.get('limit') || '10'));
  }
}

function getMockSearchResults(query: string, limit: number) {
  const mockMovies = [
    {
      movieId: 1,
      title: "The Matrix",
      genres: ["Action", "Sci-Fi"],
      year: 1999,
      posterUrl: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
      averageRating: 4.7
    },
    {
      movieId: 2,
      title: "Inception",
      genres: ["Action", "Sci-Fi", "Thriller"],
      year: 2010,
      posterUrl: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
      averageRating: 4.8
    },
    {
      movieId: 3,
      title: "Interstellar",
      genres: ["Drama", "Sci-Fi"],
      year: 2014,
      posterUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
      averageRating: 4.6
    },
    {
      movieId: 4,
      title: "The Dark Knight",
      genres: ["Action", "Crime", "Drama"],
      year: 2008,
      posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
      averageRating: 4.9
    },
    {
      movieId: 5,
      title: "Pulp Fiction",
      genres: ["Crime", "Drama"],
      year: 1994,
      posterUrl: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
      averageRating: 4.6
    },
    {
      movieId: 6,
      title: "The Shawshank Redemption",
      genres: ["Drama"],
      year: 1994,
      posterUrl: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
      averageRating: 4.8
    },
    {
      movieId: 7,
      title: "Forrest Gump",
      genres: ["Drama", "Romance"],
      year: 1994,
      posterUrl: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
      averageRating: 4.5
    },
    {
      movieId: 8,
      title: "The Godfather",
      genres: ["Crime", "Drama"],
      year: 1972,
      posterUrl: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
      averageRating: 4.7
    },
    {
      movieId: 9,
      title: "Titanic",
      genres: ["Drama", "Romance"],
      year: 1997,
      posterUrl: "https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg",
      averageRating: 4.4
    },
    {
      movieId: 10,
      title: "Avatar",
      genres: ["Action", "Adventure", "Fantasy"],
      year: 2009,
      posterUrl: "https://image.tmdb.org/t/p/w500/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg",
      averageRating: 4.3
    }
  ];

  // Filter movies based on query
  const filteredMovies = mockMovies.filter(movie =>
    movie.title.toLowerCase().includes(query.toLowerCase())
  ).slice(0, limit);

  return NextResponse.json({
    success: true,
    data: filteredMovies,
    query,
    total: filteredMovies.length,
    note: "Using mock data - Neo4j not available"
  });
}
