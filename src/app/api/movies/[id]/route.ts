import { NextRequest, NextResponse } from 'next/server';
import { movieService } from '@/lib/movie-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const movieId = parseInt(resolvedParams.id);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') ? parseInt(searchParams.get('userId')!) : undefined;

    if (isNaN(movieId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid movie ID'
      }, { status: 400 });
    }

    // Use Neo4j database only - no mock data fallback
    const movie = await movieService.getMovieById(movieId, userId);

    if (!movie) {
      return NextResponse.json({
        success: false,
        message: 'Movie not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: movie
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
