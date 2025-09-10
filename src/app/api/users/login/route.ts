import { NextRequest, NextResponse } from 'next/server';
import neo4jService from '@/lib/neo4j';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Find user in Neo4j
    const userQuery = `
      MATCH (u:User {username: $username})
      OPTIONAL MATCH (u)-[pg:PREFERS_GENRE]->(g:Genre)
      OPTIONAL MATCH (u)-[pm:PREFERS_MOOD]->(m:Mood)
      OPTIONAL MATCH (u)-[l:LIKES]->(movie:Movie)
      WITH u, 
           collect(DISTINCT g.name) as genres,
           collect(DISTINCT m.name) as moods,
           collect(DISTINCT movie.movieId) as favoriteMovies
      RETURN u, genres, moods, favoriteMovies
    `;

    const results = await neo4jService.runQuery(userQuery, { username });

    if (results.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const result = results[0];
    const user = result.u;

    // Update last active timestamp
    const updateQuery = `
      MATCH (u:User {username: $username})
      SET u.lastActive = datetime()
    `;
    
    await neo4jService.runQuery(updateQuery, { username });

    // Return user data
    const userData = {
      id: user.userId,
      username: user.username,
      email: user.email,
      preferences: {
        genres: result.genres || [],
        moods: result.moods || [],
        favoriteMovies: result.favoriteMovies || []
      },
      joinDate: user.joinDate,
      isOnboarded: user.isOnboarded || false
    };

    return NextResponse.json({
      success: true,
      user: userData,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('User login error:', error);
    return NextResponse.json(
      { error: 'Failed to login user' },
      { status: 500 }
    );
  }
}
