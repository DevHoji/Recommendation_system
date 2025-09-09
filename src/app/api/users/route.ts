import { NextRequest, NextResponse } from 'next/server';
import { neo4jService } from '@/lib/neo4j';

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    const { id, username, email, preferences, joinDate, isOnboarded } = userData;

    // Test Neo4j connection
    const isConnected = await neo4jService.testConnection();
    
    if (!isConnected) {
      console.log('Neo4j not available, user data saved locally only');
      return NextResponse.json({
        success: true,
        message: 'User created successfully (local storage only)',
        user: userData,
        usingMockData: true
      });
    }

    // Create user in Neo4j
    const createUserQuery = `
      MERGE (u:User {id: $id})
      SET u.username = $username,
          u.email = $email,
          u.joinDate = $joinDate,
          u.isOnboarded = $isOnboarded
      RETURN u
    `;

    await neo4jService.runQuery(createUserQuery, {
      id,
      username,
      email: email || '',
      joinDate,
      isOnboarded
    });

    // Create preference relationships
    if (preferences.genres && preferences.genres.length > 0) {
      const genreQuery = `
        MATCH (u:User {id: $userId})
        UNWIND $genres AS genreName
        MERGE (g:Genre {name: genreName})
        MERGE (u)-[:LIKES_GENRE]->(g)
      `;
      
      await neo4jService.runQuery(genreQuery, {
        userId: id,
        genres: preferences.genres
      });
    }

    if (preferences.moods && preferences.moods.length > 0) {
      const moodQuery = `
        MATCH (u:User {id: $userId})
        UNWIND $moods AS moodName
        MERGE (m:Mood {name: moodName})
        MERGE (u)-[:PREFERS_MOOD]->(m)
      `;
      
      await neo4jService.runQuery(moodQuery, {
        userId: id,
        moods: preferences.moods
      });
    }

    if (preferences.favoriteMovies && preferences.favoriteMovies.length > 0) {
      const movieQuery = `
        MATCH (u:User {id: $userId})
        UNWIND $movieIds AS movieId
        MATCH (m:Movie {movieId: movieId})
        MERGE (u)-[:LIKES_MOVIE]->(m)
      `;
      
      await neo4jService.runQuery(movieQuery, {
        userId: id,
        movieIds: preferences.favoriteMovies
      });
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: userData
    });

  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    // Test Neo4j connection
    const isConnected = await neo4jService.testConnection();
    
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        error: 'Database not available',
        usingMockData: true
      });
    }

    // Get user from Neo4j
    const userQuery = `
      MATCH (u:User {id: $userId})
      OPTIONAL MATCH (u)-[:LIKES_GENRE]->(g:Genre)
      OPTIONAL MATCH (u)-[:PREFERS_MOOD]->(m:Mood)
      OPTIONAL MATCH (u)-[:LIKES_MOVIE]->(movie:Movie)
      RETURN u,
             collect(DISTINCT g.name) as genres,
             collect(DISTINCT m.name) as moods,
             collect(DISTINCT movie.movieId) as favoriteMovies
    `;

    const result = await neo4jService.runQuery(userQuery, { userId });

    if (result.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const userData = result[0];
    const user = {
      id: userData.u.id,
      username: userData.u.username,
      email: userData.u.email,
      joinDate: userData.u.joinDate,
      isOnboarded: userData.u.isOnboarded,
      preferences: {
        genres: userData.genres.filter((g: any) => g),
        moods: userData.moods.filter((m: any) => m),
        favoriteMovies: userData.favoriteMovies.filter((id: any) => id)
      }
    };

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
