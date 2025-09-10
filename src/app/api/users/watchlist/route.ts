import { NextRequest, NextResponse } from 'next/server';
import { neo4jService } from '@/lib/neo4j';
import { toNumber } from '@/lib/utils';

// GET user's watchlist
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Test Neo4j connection first
    const isConnected = await neo4jService.testConnection();

    if (!isConnected) {
      console.log('Neo4j not available, returning empty watchlist');
      return NextResponse.json({
        success: true,
        watchlist: [],
        count: 0,
        note: "Neo4j not available - using mock data"
      });
    }

    const watchlistQuery = `
      MATCH (u:User {userId: $userId})-[w:WATCHLIST]->(m:Movie)
      OPTIONAL MATCH (m)<-[r:RATED]-()
      WITH m, w, avg(r.rating) as avgRating, count(r) as ratingCount
      RETURN m.movieId as movieId, m.title as title, m.genres as genres,
             m.year as year, m.tmdbId as tmdbId, avgRating, ratingCount,
             w.addedAt as addedAt
      ORDER BY w.addedAt DESC
    `;

    const results = await neo4jService.runQuery(watchlistQuery, { userId: parseInt(userId) });

    const watchlist = results.map((record: any) => ({
      movieId: toNumber(record.movieId),
      title: record.title,
      genres: record.genres,
      year: toNumber(record.year),
      tmdbId: toNumber(record.tmdbId),
      averageRating: record.avgRating ? parseFloat(record.avgRating.toFixed(1)) : undefined,
      ratingCount: toNumber(record.ratingCount),
      addedAt: record.addedAt
    }));

    return NextResponse.json({
      success: true,
      watchlist,
      count: watchlist.length
    });

  } catch (error) {
    console.error('Get watchlist error:', error);
    return NextResponse.json({
      success: true,
      watchlist: [],
      count: 0,
      note: "Error occurred - returning empty watchlist"
    });
  }
}

// POST - Add movie to watchlist
export async function POST(request: NextRequest) {
  try {
    const { userId, movieId } = await request.json();

    if (!userId || !movieId) {
      return NextResponse.json(
        { error: 'User ID and Movie ID are required' },
        { status: 400 }
      );
    }

    // Test Neo4j connection first
    const isConnected = await neo4jService.testConnection();

    if (!isConnected) {
      console.log('Neo4j not available, cannot add to watchlist');
      return NextResponse.json({
        success: false,
        message: "Database not available - cannot add to watchlist"
      });
    }

    // Check if movie is already in watchlist
    const checkQuery = `
      MATCH (u:User {userId: $userId})-[w:WATCHLIST]->(m:Movie {movieId: $movieId})
      RETURN w
    `;

    const existing = await neo4jService.runQuery(checkQuery, { userId: parseInt(userId), movieId: parseInt(movieId) });

    if (existing.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Movie already in watchlist'
      });
    }

    // Add to watchlist
    const addQuery = `
      MATCH (u:User {userId: $userId})
      MATCH (m:Movie {movieId: $movieId})
      CREATE (u)-[:WATCHLIST {addedAt: datetime()}]->(m)
      RETURN m.title as title
    `;

    const results = await neo4jService.runQuery(addQuery, { userId: parseInt(userId), movieId: parseInt(movieId) });

    if (results.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'User or movie not found'
      });
    }

    return NextResponse.json({
      success: true,
      message: `${results[0].title} added to watchlist`
    });

  } catch (error) {
    console.error('Add to watchlist error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to add to watchlist'
    });
  }
}

// DELETE - Remove movie from watchlist
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const movieId = searchParams.get('movieId');

    if (!userId || !movieId) {
      return NextResponse.json(
        { error: 'User ID and Movie ID are required' },
        { status: 400 }
      );
    }

    const removeQuery = `
      MATCH (u:User {userId: $userId})-[w:WATCHLIST]->(m:Movie {movieId: $movieId})
      DELETE w
      RETURN m.title as title
    `;

    const results = await neo4jService.runQuery(removeQuery, { 
      userId, 
      movieId: parseInt(movieId) 
    });

    if (results.length === 0) {
      return NextResponse.json(
        { error: 'Movie not found in watchlist' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${results[0].title} removed from watchlist`
    });

  } catch (error) {
    console.error('Remove from watchlist error:', error);
    return NextResponse.json(
      { error: 'Failed to remove from watchlist' },
      { status: 500 }
    );
  }
}
