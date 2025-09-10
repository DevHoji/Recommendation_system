import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tmdbId = searchParams.get('tmdbId');
    const movieTitle = searchParams.get('title');

    if (!tmdbId && !movieTitle) {
      return NextResponse.json(
        { error: 'TMDB ID or movie title is required' },
        { status: 400 }
      );
    }

    // Try to get trailer from TMDB API if we have an API key
    if (tmdbId && process.env.TMDB_API_KEY) {
      try {
        const tmdbResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${tmdbId}/videos?api_key=${process.env.TMDB_API_KEY}&language=en-US`
        );

        if (tmdbResponse.ok) {
          const tmdbData = await tmdbResponse.json();
          const trailer = tmdbData.results?.find(
            (video: any) => 
              video.type === 'Trailer' && 
              video.site === 'YouTube' &&
              video.official === true
          ) || tmdbData.results?.find(
            (video: any) => 
              video.type === 'Trailer' && 
              video.site === 'YouTube'
          );

          if (trailer) {
            return NextResponse.json({
              success: true,
              trailerUrl: `https://www.youtube.com/watch?v=${trailer.key}`,
              embedUrl: `https://www.youtube.com/embed/${trailer.key}`,
              title: trailer.name,
              type: trailer.type,
              site: trailer.site
            });
          }
        }
      } catch (tmdbError) {
        console.error('TMDB API error:', tmdbError);
      }
    }

    // Fallback: Generate YouTube search URL
    const searchTitle = movieTitle || `Movie ${tmdbId}`;
    const searchQuery = encodeURIComponent(`${searchTitle} official trailer`);
    const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;

    return NextResponse.json({
      success: false,
      message: 'Trailer not found in TMDB',
      searchUrl: youtubeSearchUrl,
      searchQuery: `${searchTitle} official trailer`
    });

  } catch (error) {
    console.error('Trailer API error:', error);
    return NextResponse.json(
      { error: 'Failed to get trailer' },
      { status: 500 }
    );
  }
}
