import { NextRequest, NextResponse } from 'next/server';
import { tmdbService } from '@/lib/tmdb';

// Mock TMDB IDs for popular movies (fallback data)
const MOVIE_TMDB_MAP: Record<number, number> = {
  1: 862,    // Toy Story
  2: 8844,   // Jumanji
  3: 15602,  // Grumpier Old Men
  4: 31357,  // Waiting to Exhale
  5: 11862,  // Father of the Bride Part II
  6: 949,    // Heat
  7: 11860,  // Sabrina
  8: 45325,  // Tom and Huck
  9: 9091,   // Sudden Death
  10: 710,   // GoldenEye
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const movieId = parseInt(id);

    if (isNaN(movieId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid movie ID' },
        { status: 400 }
      );
    }

    // Try to get TMDB ID from our mapping or use movieId as fallback
    let tmdbId = MOVIE_TMDB_MAP[movieId] || movieId;

    try {
      // Try to get the movie from the database first
      const movieService = await import('@/lib/movie-service');
      const movie = await movieService.movieService.getMovieById(movieId, 1);
      if (movie && movie.tmdbId) {
        tmdbId = movie.tmdbId;
      }
    } catch (dbError) {
      console.log('Database not available, using fallback TMDB ID');
    }

    // Fetch videos from TMDB
    const videosData = await tmdbService.getMovieVideos(tmdbId);

    // Filter for trailers and teasers
    const trailers = videosData.results?.filter((video: any) =>
      (video.type === 'Trailer' || video.type === 'Teaser') &&
      video.site === 'YouTube'
    ) || [];

    return NextResponse.json({
      success: true,
      videos: trailers,
      movieId: movieId,
      tmdbId: tmdbId
    });

  } catch (error) {
    console.error('Error fetching movie videos:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch movie videos'
      },
      { status: 500 }
    );
  }
}
