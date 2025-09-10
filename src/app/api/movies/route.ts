import { NextRequest, NextResponse } from 'next/server';
import { movieService } from '@/lib/movie-service';
import { neo4jService } from '@/lib/neo4j';

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

    // Use Neo4j database only - no mock data fallback
    let result;

    if (query) {
      result = await movieService.searchMovies(query, page, limit);
    } else {
      result = await movieService.getMovies(page, limit, filters);
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
    console.error('Neo4j database error:', error);

    return NextResponse.json({
      success: false,
      message: 'Database connection failed. Please ensure Neo4j is properly configured.',
      error: error instanceof Error ? error.message : 'Unknown error',
      hint: 'Check your Neo4j AuraDB credentials and ensure the database is running. Visit /api/test-neo4j to test connection.'
    }, { status: 500 });
  }
}
