import { NextRequest, NextResponse } from 'next/server';
import { neo4jService } from '@/lib/neo4j';
import { allMockMovies, searchMockMovies, filterMockMovies, paginateMockMovies } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const genre = searchParams.get('genre') || '';
    const year = searchParams.get('year') || '';
    const minRating = searchParams.get('minRating') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'relevance';

    if (!query && !genre && !year && !minRating) {
      return NextResponse.json({
        success: false,
        error: 'At least one search parameter is required'
      }, { status: 400 });
    }

    // Test Neo4j connection
    const isConnected = await neo4jService.testConnection();
    
    if (!isConnected) {
      console.log('Neo4j not available, using mock search results');
      return getMockSearchResults(query, genre, page, limit);
    }

    // Build Cypher query based on search parameters
    let cypherQuery = 'MATCH (m:Movie) WHERE 1=1';
    const parameters: any = {};

    // Enhanced text search - search in title, genres, and overview
    if (query) {
      cypherQuery += ` AND (
        toLower(m.title) CONTAINS toLower($query) OR
        any(g IN m.genres WHERE toLower(g) CONTAINS toLower($query)) OR
        (m.overview IS NOT NULL AND toLower(m.overview) CONTAINS toLower($query)) OR
        any(word IN split(toLower(m.title), ' ') WHERE word STARTS WITH toLower($query))
      )`;
      parameters.query = query;
    }

    // Genre filter
    if (genre) {
      cypherQuery += ' AND any(g IN m.genres WHERE toLower(g) = toLower($genre))';
      parameters.genre = genre;
    }

    // Year filter
    if (year) {
      cypherQuery += ' AND m.year = $year';
      parameters.year = parseInt(year);
    }

    // Rating filter
    if (minRating) {
      cypherQuery += ' AND m.averageRating >= $minRating';
      parameters.minRating = parseFloat(minRating);
    }

    // Add return clause and sorting
    cypherQuery += `
      RETURN m.movieId as movieId, m.title as title, m.genres as genres, 
             m.year as year, m.averageRating as averageRating, 
             m.ratingCount as ratingCount, m.posterUrl as posterUrl,
             m.tmdbId as tmdbId
    `;

    // Add sorting
    switch (sortBy) {
      case 'rating':
        cypherQuery += ' ORDER BY m.averageRating DESC, m.ratingCount DESC';
        break;
      case 'year':
        cypherQuery += ' ORDER BY m.year DESC';
        break;
      case 'title':
        cypherQuery += ' ORDER BY m.title ASC';
        break;
      case 'popularity':
        cypherQuery += ' ORDER BY m.ratingCount DESC, m.averageRating DESC';
        break;
      default: // relevance
        if (query) {
          cypherQuery += ' ORDER BY CASE WHEN toLower(m.title) STARTS WITH toLower($query) THEN 1 ELSE 2 END, m.averageRating DESC';
        } else {
          cypherQuery += ' ORDER BY m.averageRating DESC, m.ratingCount DESC';
        }
    }

    // Add pagination
    const offset = (page - 1) * limit;
    cypherQuery += ` SKIP $offset LIMIT $limit`;
    parameters.offset = offset;
    parameters.limit = limit;

    // Execute search query
    const searchResults = await neo4jService.runQuery(cypherQuery, parameters);

    // Get total count for pagination
    let countQuery = 'MATCH (m:Movie) WHERE 1=1';
    const countParams: any = {};

    if (query) {
      countQuery += ` AND (
        toLower(m.title) CONTAINS toLower($query) OR
        any(g IN m.genres WHERE toLower(g) CONTAINS toLower($query)) OR
        (m.overview IS NOT NULL AND toLower(m.overview) CONTAINS toLower($query)) OR
        any(word IN split(toLower(m.title), ' ') WHERE word STARTS WITH toLower($query))
      )`;
      countParams.query = query;
    }
    if (genre) {
      countQuery += ' AND any(g IN m.genres WHERE toLower(g) = toLower($genre))';
      countParams.genre = genre;
    }
    if (year) {
      countQuery += ' AND m.year = $year';
      countParams.year = parseInt(year);
    }
    if (minRating) {
      countQuery += ' AND m.averageRating >= $minRating';
      countParams.minRating = parseFloat(minRating);
    }

    countQuery += ' RETURN count(m) as total';
    const countResult = await neo4jService.runQuery(countQuery, countParams);
    const total = countResult[0]?.total || 0;

    return NextResponse.json({
      success: true,
      data: searchResults,
      pagination: {
        page,
        limit,
        total,
        hasMore: offset + searchResults.length < total,
        totalPages: Math.ceil(total / limit)
      },
      searchParams: {
        query,
        genre,
        year,
        minRating,
        sortBy
      }
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { voiceQuery, filters = {} } = body;

    if (!voiceQuery) {
      return NextResponse.json({
        success: false,
        error: 'Voice query is required'
      }, { status: 400 });
    }

    // Process voice query to extract search parameters
    const searchParams = processVoiceQuery(voiceQuery);
    
    // Merge with provided filters
    const finalParams = { ...searchParams, ...filters };

    // Build search URL
    const searchUrl = new URL('/api/search', request.url);
    Object.entries(finalParams).forEach(([key, value]) => {
      if (value) {
        searchUrl.searchParams.set(key, value.toString());
      }
    });

    // Forward to GET endpoint
    const searchRequest = new NextRequest(searchUrl.toString());
    return GET(searchRequest);

  } catch (error) {
    console.error('Voice search API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Voice search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function processVoiceQuery(voiceQuery: string): any {
  const query = voiceQuery.toLowerCase();
  const params: any = {};

  // Extract genre
  const genrePatterns = [
    { pattern: /action|adventure/i, genre: 'Action' },
    { pattern: /comedy|funny|humor/i, genre: 'Comedy' },
    { pattern: /drama|dramatic/i, genre: 'Drama' },
    { pattern: /horror|scary/i, genre: 'Horror' },
    { pattern: /romance|romantic|love/i, genre: 'Romance' },
    { pattern: /sci-?fi|science fiction|futuristic/i, genre: 'Sci-Fi' },
    { pattern: /thriller|suspense/i, genre: 'Thriller' },
    { pattern: /animation|animated|cartoon/i, genre: 'Animation' },
    { pattern: /documentary/i, genre: 'Documentary' },
    { pattern: /fantasy|magical/i, genre: 'Fantasy' }
  ];

  for (const { pattern, genre } of genrePatterns) {
    if (pattern.test(query)) {
      params.genre = genre;
      break;
    }
  }

  // Extract year
  const yearMatch = query.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    params.year = yearMatch[0];
  }

  // Extract rating requirements
  if (query.includes('highly rated') || query.includes('top rated') || query.includes('best')) {
    params.minRating = '4.0';
    params.sortBy = 'rating';
  } else if (query.includes('popular') || query.includes('trending')) {
    params.sortBy = 'popularity';
  }

  // Extract specific movie title search
  const titlePatterns = [
    /movies? (?:with|starring|featuring) (.+)/i,
    /find (.+) movies?/i,
    /search (?:for )?(.+)/i,
    /show me (.+)/i
  ];

  for (const pattern of titlePatterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      const searchTerm = match[1].replace(/movies?/gi, '').trim();
      if (searchTerm && !genrePatterns.some(g => g.pattern.test(searchTerm))) {
        params.q = searchTerm;
        break;
      }
    }
  }

  return params;
}

function getMockSearchResults(query: string, genre: string, page: number, limit: number) {
  // Use the imported mock data functions
  let mockResults = allMockMovies;

  // Use the same filtering logic as movies API
  if (query) {
    mockResults = searchMockMovies(query, mockResults);
  }

  // Apply genre filter
  const filters: any = {};
  if (genre) {
    filters.genre = genre;
  }

  if (Object.keys(filters).length > 0) {
    mockResults = filterMockMovies(mockResults, filters);
  }

  // Apply pagination
  const paginatedResult = paginateMockMovies(mockResults, page, limit);

  return NextResponse.json({
    success: true,
    data: paginatedResult.movies,
    pagination: {
      page: paginatedResult.page,
      limit: paginatedResult.limit,
      total: paginatedResult.total,
      hasMore: paginatedResult.hasMore,
      totalPages: paginatedResult.totalPages
    },
    searchParams: { query, genre },
    note: "Using mock data - Neo4j not available"
  });
}
