import { NextRequest, NextResponse } from 'next/server';
import { movieService } from '@/lib/movie-service';
import { allMockMovies, searchMockMovies, filterMockMovies, paginateMockMovies } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const query = searchParams.get('q');

    // Search filters
    const genre = searchParams.get('genre') || undefined;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined;
    const maxRating = searchParams.get('maxRating') ? parseFloat(searchParams.get('maxRating')!) : undefined;
    const sortBy = searchParams.get('sortBy') as 'popularity' | 'rating' | 'year' | 'title' | undefined;
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | undefined;

    const filters = {
      genre,
      year,
      minRating,
      maxRating,
      sortBy,
      sortOrder
    };

    let result;

    try {
      // Try to use real database first
      if (query) {
        result = await movieService.searchMovies(query, page, limit);
      } else {
        result = await movieService.getMovies(page, limit, filters);
      }
    } catch (dbError) {
      console.warn('Database not available, using mock data:', dbError instanceof Error ? dbError.message : String(dbError));

      // Use mock data
      let movies = allMockMovies;

      if (query) {
        movies = searchMockMovies(query, movies);
      }

      movies = filterMockMovies(movies, filters);
      const paginatedResult = paginateMockMovies(movies, page, limit);

      result = {
        movies: paginatedResult.movies,
        total: paginatedResult.total,
        hasMore: paginatedResult.hasMore
      };
    }

    return NextResponse.json({
      success: true,
      data: result.movies,
      pagination: {
        page,
        limit,
        total: result.total,
        hasMore: result.hasMore,
        totalPages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    console.error('Movies API error:', error);

    return NextResponse.json({
      success: false,
      message: 'Failed to fetch movies',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
