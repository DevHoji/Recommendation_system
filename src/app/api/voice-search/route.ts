import { NextRequest, NextResponse } from 'next/server';
import { geminiService } from '@/lib/gemini';
import { movieService } from '@/lib/movie-service';

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json();

    if (!transcript) {
      return NextResponse.json({
        success: false,
        message: 'Transcript is required'
      }, { status: 400 });
    }

    // Process the voice search with simple pattern matching as fallback
    let voiceSearchResult;
    let movies: any[] = [];
    let searchPerformed = false;

    try {
      // Try Gemini AI first
      voiceSearchResult = await geminiService.processVoiceSearch(transcript);
    } catch (error) {
      console.warn('Gemini AI not available, using simple pattern matching:', error instanceof Error ? error.message : String(error));

      // Simple pattern matching fallback
      const lowerTranscript = transcript.toLowerCase();
      voiceSearchResult = {
        query: transcript,
        intent: 'search' as any,
        parameters: {} as any
      };

      // Extract genre
      const genres = ['action', 'comedy', 'drama', 'horror', 'romance', 'thriller', 'sci-fi', 'animation'];
      for (const genre of genres) {
        if (lowerTranscript.includes(genre)) {
          voiceSearchResult.parameters.genre = genre;
          voiceSearchResult.intent = 'filter';
          break;
        }
      }

      // Extract year
      const yearMatch = lowerTranscript.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) {
        voiceSearchResult.parameters.year = parseInt(yearMatch[0]);
        voiceSearchResult.intent = 'filter';
      }

      // Check for recommendation intent
      if (lowerTranscript.includes('recommend') || lowerTranscript.includes('suggest')) {
        voiceSearchResult.intent = 'recommend';
      }
    }

    // Execute search based on the processed intent and parameters
    try {
      if (voiceSearchResult.intent === 'search' || voiceSearchResult.intent === 'filter') {
        const filters: any = {};

        if (voiceSearchResult.parameters.genre) {
          filters.genre = voiceSearchResult.parameters.genre;
        }
        if (voiceSearchResult.parameters.year) {
          filters.year = voiceSearchResult.parameters.year;
        }
        if (voiceSearchResult.parameters.rating) {
          filters.minRating = voiceSearchResult.parameters.rating;
        }

        if (voiceSearchResult.query && !voiceSearchResult.parameters.genre && !voiceSearchResult.parameters.year) {
          // Text search
          const result = await movieService.searchMovies(voiceSearchResult.query, 1, 10);
          movies = result.movies;
        } else {
          // Filter search
          const result = await movieService.getMovies(1, 10, filters);
          movies = result.movies;
        }

        searchPerformed = true;
      } else if (voiceSearchResult.intent === 'recommend') {
        // Get popular movies as recommendations
        const result = await movieService.getMovies(1, 10, {
          sortBy: 'popularity',
          sortOrder: 'desc'
        });
        movies = result.movies;
        searchPerformed = true;
      }
    } catch (dbError) {
      console.error('Neo4j database connection failed for voice search:', dbError instanceof Error ? dbError.message : String(dbError));

      // Return error instead of using mock data
      return NextResponse.json({
        success: false,
        message: 'Database connection failed. Please ensure Neo4j is properly configured.',
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
        hint: 'Voice search requires a working Neo4j connection.'
      }, { status: 500 });
    }

    // Generate TTS response
    let responseText = '';
    if (searchPerformed && movies.length > 0) {
      const topMovies = movies.slice(0, 3);
      responseText = `I found ${movies.length} movies for you. Here are the top recommendations: ${topMovies.map(m => m.title).join(', ')}.`;
    } else if (searchPerformed && movies.length === 0) {
      responseText = `I couldn't find any movies matching your search. Try a different query.`;
    } else {
      responseText = `I'm not sure what you're looking for. Could you try rephrasing your request?`;
    }

    return NextResponse.json({
      success: true,
      data: {
        voiceSearchResult,
        movies,
        responseText,
        searchPerformed
      }
    });
  } catch (error) {
    console.error('Voice search API error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Voice search failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
