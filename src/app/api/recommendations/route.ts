import { NextRequest, NextResponse } from 'next/server';
import { neo4jService } from '@/lib/neo4j';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') ? parseInt(searchParams.get('userId')!) : 1;
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type') || 'collaborative'; // collaborative, content, hybrid, popular

    let recommendations = [];

    switch (type) {
      case 'collaborative':
        recommendations = await getCollaborativeRecommendations(userId, limit);
        break;
      case 'content':
        recommendations = await getContentBasedRecommendations(userId, limit);
        break;
      case 'hybrid':
        recommendations = await getHybridRecommendations(userId, limit);
        break;
      case 'popular':
        recommendations = await getPopularRecommendations(limit);
        break;
      default:
        recommendations = await getHybridRecommendations(userId, limit);
    }

    return NextResponse.json({
      success: true,
      data: recommendations,
      metadata: {
        userId,
        type,
        count: recommendations.length
      }
    });

  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to get recommendations',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Collaborative Filtering - Find users with similar tastes
async function getCollaborativeRecommendations(userId: number, limit: number) {
  const query = `
    // Find users who rated movies similarly to the target user
    MATCH (u:User {userId: $userId})-[r1:RATED]->(m:Movie)
    MATCH (m)<-[r2:RATED]-(other:User)
    WHERE other.userId <> $userId
    WITH other, 
         count(m) as commonMovies,
         sum(abs(r1.rating - r2.rating)) as ratingDifference
    WHERE commonMovies >= 3
    WITH other, commonMovies, ratingDifference,
         (commonMovies * 5.0 - ratingDifference) / (commonMovies * 5.0) as similarity
    ORDER BY similarity DESC
    LIMIT 10
    
    // Get recommendations from similar users
    MATCH (other)-[r:RATED]->(rec:Movie)
    WHERE NOT EXISTS((u:User {userId: $userId})-[:RATED]->(rec))
      AND r.rating >= 4.0
    WITH rec, 
         avg(r.rating) as avgRating,
         count(r) as ratingCount,
         collect(DISTINCT other.userId) as similarUsers
    ORDER BY avgRating DESC, ratingCount DESC
    LIMIT $limit
    
    RETURN rec.movieId as movieId,
           rec.title as title,
           rec.genres as genres,
           rec.year as year,
           rec.averageRating as averageRating,
           rec.overview as overview,
           avgRating as predictedRating,
           ratingCount as supportingRatings,
           similarUsers
  `;

  return await neo4jService.runQuery(query, { userId, limit });
}

// Content-Based Filtering - Find movies similar to user's preferences
async function getContentBasedRecommendations(userId: number, limit: number) {
  const query = `
    // Find user's preferred genres based on highly rated movies
    MATCH (u:User {userId: $userId})-[r:RATED]->(m:Movie)
    WHERE r.rating >= 4.0
    UNWIND m.genres as genre
    WITH genre, count(*) as genreCount, avg(r.rating) as avgRating
    ORDER BY genreCount DESC, avgRating DESC
    LIMIT 5
    WITH collect(genre) as preferredGenres
    
    // Find highly rated movies in preferred genres that user hasn't seen
    MATCH (rec:Movie)
    WHERE NOT EXISTS((u:User {userId: $userId})-[:RATED]->(rec))
      AND any(g IN rec.genres WHERE g IN preferredGenres)
      AND rec.averageRating >= 7.0
    WITH rec, 
         size([g IN rec.genres WHERE g IN preferredGenres]) as genreMatches
    ORDER BY genreMatches DESC, rec.averageRating DESC, rec.ratingCount DESC
    LIMIT $limit
    
    RETURN rec.movieId as movieId,
           rec.title as title,
           rec.genres as genres,
           rec.year as year,
           rec.averageRating as averageRating,
           rec.overview as overview,
           genreMatches as relevanceScore
  `;

  return await neo4jService.runQuery(query, { userId, limit });
}

// Hybrid Recommendations - Combine collaborative and content-based
async function getHybridRecommendations(userId: number, limit: number) {
  const query = `
    // Get user's rating history for preference analysis
    MATCH (u:User {userId: $userId})-[r:RATED]->(m:Movie)
    WITH u, 
         collect(DISTINCT m.genres) as userGenres,
         avg(r.rating) as userAvgRating,
         count(r) as userRatingCount
    UNWIND userGenres as genreList
    UNWIND genreList as genre
    WITH u, genre, count(*) as genreFreq, userAvgRating, userRatingCount
    ORDER BY genreFreq DESC
    WITH u, collect(genre)[0..3] as topGenres, userAvgRating, userRatingCount
    
    // Find candidate movies
    MATCH (rec:Movie)
    WHERE NOT EXISTS((u)-[:RATED]->(rec))
      AND rec.averageRating >= (userAvgRating - 1.0)
    
    // Calculate content similarity score
    WITH rec, topGenres, userAvgRating,
         size([g IN rec.genres WHERE g IN topGenres]) as genreMatches,
         size(topGenres) as totalPreferredGenres
    
    // Calculate collaborative score
    OPTIONAL MATCH (rec)<-[r:RATED]-(other:User)
    WHERE EXISTS((other)-[:RATED]->(:Movie)<-[:RATED]-(u))
    WITH rec, genreMatches, totalPreferredGenres, userAvgRating,
         avg(r.rating) as collaborativeScore,
         count(r) as collaborativeSupport
    
    // Combine scores
    WITH rec,
         (toFloat(genreMatches) / totalPreferredGenres) * 0.4 as contentScore,
         CASE WHEN collaborativeScore IS NOT NULL 
              THEN (collaborativeScore / 5.0) * 0.4 
              ELSE 0 END as collabScore,
         (rec.averageRating / 10.0) * 0.2 as popularityScore,
         collaborativeSupport
    
    WITH rec, 
         contentScore + collabScore + popularityScore as hybridScore,
         collaborativeSupport
    ORDER BY hybridScore DESC, rec.averageRating DESC
    LIMIT $limit
    
    RETURN rec.movieId as movieId,
           rec.title as title,
           rec.genres as genres,
           rec.year as year,
           rec.averageRating as averageRating,
           rec.overview as overview,
           round(hybridScore * 100) / 100 as recommendationScore,
           collaborativeSupport
  `;

  return await neo4jService.runQuery(query, { userId, limit });
}

// Popular Recommendations - Trending and highly rated movies
async function getPopularRecommendations(limit: number) {
  const query = `
    MATCH (m:Movie)
    WHERE m.averageRating >= 7.5 AND m.ratingCount >= 100
    WITH m,
         (m.averageRating * log(m.ratingCount)) as popularityScore
    ORDER BY popularityScore DESC
    LIMIT $limit
    
    RETURN m.movieId as movieId,
           m.title as title,
           m.genres as genres,
           m.year as year,
           m.averageRating as averageRating,
           m.overview as overview,
           m.ratingCount as ratingCount,
           round(popularityScore * 100) / 100 as popularityScore
  `;

  return await neo4jService.runQuery(query, { limit });
}

// POST endpoint for getting personalized recommendations with filters
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId = 1, 
      genres = [], 
      minYear, 
      maxYear, 
      minRating = 6.0,
      limit = 10,
      excludeWatched = true 
    } = body;

    const query = `
      MATCH (m:Movie)
      WHERE m.averageRating >= $minRating
        ${minYear ? 'AND m.year >= $minYear' : ''}
        ${maxYear ? 'AND m.year <= $maxYear' : ''}
        ${genres.length > 0 ? 'AND any(g IN m.genres WHERE g IN $genres)' : ''}
        ${excludeWatched ? 'AND NOT EXISTS((:User {userId: $userId})-[:RATED]->(m))' : ''}
      
      // Get user's genre preferences for scoring
      OPTIONAL MATCH (u:User {userId: $userId})-[r:RATED]->(userMovie:Movie)
      WHERE r.rating >= 4.0
      WITH m, collect(DISTINCT userMovie.genres) as userGenreLists
      UNWIND userGenreLists as userGenres
      UNWIND userGenres as userGenre
      WITH m, userGenre, count(*) as genreFreq
      WITH m, collect({genre: userGenre, freq: genreFreq}) as userPrefs
      
      // Calculate recommendation score
      WITH m,
           size([g IN m.genres WHERE g IN [pref IN userPrefs | pref.genre]]) as genreMatches,
           m.averageRating as rating,
           m.ratingCount as popularity
      
      WITH m, 
           (genreMatches * 2.0 + rating + log(popularity)) as score
      ORDER BY score DESC
      LIMIT $limit
      
      RETURN m.movieId as movieId,
             m.title as title,
             m.genres as genres,
             m.year as year,
             m.averageRating as averageRating,
             m.overview as overview,
             round(score * 100) / 100 as recommendationScore
    `;

    const parameters = {
      userId,
      genres,
      minYear,
      maxYear,
      minRating,
      limit
    };

    const recommendations = await neo4jService.runQuery(query, parameters);

    return NextResponse.json({
      success: true,
      data: recommendations,
      filters: {
        userId,
        genres,
        minYear,
        maxYear,
        minRating,
        excludeWatched
      }
    });

  } catch (error) {
    console.error('Personalized recommendations error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to get personalized recommendations',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
