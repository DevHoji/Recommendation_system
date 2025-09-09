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
    console.error('Movie details API error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch movie details',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
