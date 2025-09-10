import { NextRequest, NextResponse } from 'next/server';
import neo4jService from '@/lib/neo4j';

export async function POST(request: NextRequest) {
  try {
    const { username, email, preferences } = await request.json();

    if (!username || !preferences) {
      return NextResponse.json(
        { error: 'Username and preferences are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUserQuery = `
      MATCH (u:User {username: $username})
      RETURN u
    `;
    
    const existingUsers = await neo4jService.runQuery(existingUserQuery, { username });
    
    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Create unique user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create user in Neo4j
    const createUserQuery = `
      CREATE (u:User {
        userId: $userId,
        username: $username,
        email: $email,
        joinDate: datetime(),
        isOnboarded: true,
        lastActive: datetime()
      })
      RETURN u
    `;

    await neo4jService.runQuery(createUserQuery, {
      userId,
      username,
      email: email || null
    });

    // Store user preferences
    if (preferences.genres && preferences.genres.length > 0) {
      const genreQuery = `
        MATCH (u:User {userId: $userId})
        UNWIND $genres as genreName
        MERGE (g:Genre {name: genreName})
        CREATE (u)-[:PREFERS_GENRE {strength: 1.0, createdAt: datetime()}]->(g)
      `;
      
      await neo4jService.runQuery(genreQuery, {
        userId,
        genres: preferences.genres
      });
    }

    // Store mood preferences
    if (preferences.moods && preferences.moods.length > 0) {
      const moodQuery = `
        MATCH (u:User {userId: $userId})
        UNWIND $moods as moodName
        MERGE (m:Mood {name: moodName})
        CREATE (u)-[:PREFERS_MOOD {strength: 1.0, createdAt: datetime()}]->(m)
      `;
      
      await neo4jService.runQuery(moodQuery, {
        userId,
        moods: preferences.moods
      });
    }

    // Store favorite movies if provided
    if (preferences.favoriteMovies && preferences.favoriteMovies.length > 0) {
      const favoritesQuery = `
        MATCH (u:User {userId: $userId})
        UNWIND $movieIds as movieId
        MATCH (m:Movie {movieId: movieId})
        CREATE (u)-[:LIKES {strength: 5.0, createdAt: datetime()}]->(m)
      `;
      
      await neo4jService.runQuery(favoritesQuery, {
        userId,
        movieIds: preferences.favoriteMovies
      });
    }

    // Return user data
    const userData = {
      id: userId,
      username,
      email,
      preferences,
      joinDate: new Date().toISOString(),
      isOnboarded: true
    };

    return NextResponse.json({
      success: true,
      user: userData,
      message: 'User registered successfully'
    });

  } catch (error) {
    console.error('User registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
