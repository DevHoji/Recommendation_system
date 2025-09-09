import { NextRequest, NextResponse } from 'next/server';
import { neo4jService } from '@/lib/neo4j';

export async function PUT(request: NextRequest) {
  try {
    const { userId, preferences } = await request.json();

    if (!userId || !preferences) {
      return NextResponse.json({
        success: false,
        error: 'User ID and preferences are required'
      }, { status: 400 });
    }

    // Test Neo4j connection
    const isConnected = await neo4jService.testConnection();
    
    if (!isConnected) {
      console.log('Neo4j not available, preferences saved locally only');
      return NextResponse.json({
        success: true,
        message: 'Preferences updated successfully (local storage only)',
        usingMockData: true
      });
    }

    // Clear existing preferences
    const clearQuery = `
      MATCH (u:User {id: $userId})
      OPTIONAL MATCH (u)-[r:LIKES_GENRE|PREFERS_MOOD|LIKES_MOVIE]->()
      DELETE r
    `;
    
    await neo4jService.runQuery(clearQuery, { userId });

    // Add new genre preferences
    if (preferences.genres && preferences.genres.length > 0) {
      const genreQuery = `
        MATCH (u:User {id: $userId})
        UNWIND $genres AS genreName
        MERGE (g:Genre {name: genreName})
        MERGE (u)-[:LIKES_GENRE]->(g)
      `;
      
      await neo4jService.runQuery(genreQuery, {
        userId,
        genres: preferences.genres
      });
    }

    // Add new mood preferences
    if (preferences.moods && preferences.moods.length > 0) {
      const moodQuery = `
        MATCH (u:User {id: $userId})
        UNWIND $moods AS moodName
        MERGE (m:Mood {name: moodName})
        MERGE (u)-[:PREFERS_MOOD]->(m)
      `;
      
      await neo4jService.runQuery(moodQuery, {
        userId,
        moods: preferences.moods
      });
    }

    // Add new favorite movies
    if (preferences.favoriteMovies && preferences.favoriteMovies.length > 0) {
      const movieQuery = `
        MATCH (u:User {id: $userId})
        UNWIND $movieIds AS movieId
        MATCH (m:Movie {movieId: movieId})
        MERGE (u)-[:LIKES_MOVIE]->(m)
      `;
      
      await neo4jService.runQuery(movieQuery, {
        userId,
        movieIds: preferences.favoriteMovies
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully'
    });

  } catch (error) {
    console.error('Preferences update error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update preferences',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
