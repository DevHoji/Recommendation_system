import { NextRequest, NextResponse } from 'next/server';
import { neo4jService } from '@/lib/neo4j';
import { toNumber } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { userId } = resolvedParams;

    console.log(`Getting recommendations for user ${userId}`);

    // Test Neo4j connection first
    let isConnected = false;
    try {
      isConnected = await neo4jService.testConnection();
      console.log(`Neo4j connection status: ${isConnected}`);
    } catch (error) {
      console.error('Error testing Neo4j connection:', error);
      isConnected = false;
    }

    if (!isConnected) {
      console.log('Neo4j not available, using mock recommendations');
      return getMockRecommendations(userId);
    }

    // Get user's rating history using Cypher
    const userRatingsQuery = `
      MATCH (u:User {userId: $userId})-[r:RATED]->(m:Movie)
      RETURN m.movieId as movieId, m.title as title, r.rating as rating, m.genres as genres
      ORDER BY r.rating DESC
      LIMIT 10
    `;

    const userRatings = await neo4jService.runQuery(userRatingsQuery, { userId: parseInt(userId) });

    if (userRatings.length === 0) {
      // New user - use onboarding preferences for recommendations
      console.log('New user detected, using onboarding preferences');

      // First, try to get recommendations based on liked genres from onboarding
      const genreBasedQuery = `
        MATCH (u:User {id: $userId})-[:LIKES_GENRE]->(g:Genre)
        MATCH (m:Movie)
        WHERE any(genre IN m.genres WHERE genre = g.name)
          AND m.averageRating >= 3.5
          AND m.ratingCount > 10
        WITH m, collect(g.name) as matchedGenres
        RETURN m.movieId as movieId, m.title as title, m.averageRating as score,
               m.genres as genres, m.year as year, m.posterUrl as posterUrl,
               matchedGenres
        ORDER BY m.averageRating DESC, m.ratingCount DESC
        LIMIT 15
      `;

      const genreRecommendations = await neo4jService.runQuery(genreBasedQuery, { userId: parseInt(userId) });

      // Second, get recommendations based on favorite movies from onboarding
      const movieBasedQuery = `
        MATCH (u:User {id: $userId})-[:LIKES_MOVIE]->(liked:Movie)
        MATCH (similar:Movie)
        WHERE any(likedGenre IN liked.genres WHERE likedGenre IN similar.genres)
          AND similar.movieId <> liked.movieId
          AND similar.averageRating >= 3.5
          AND similar.ratingCount > 10
        WITH similar, count(liked) as similarity
        RETURN similar.movieId as movieId, similar.title as title, similar.averageRating as score,
               similar.genres as genres, similar.year as year, similar.posterUrl as posterUrl,
               similarity
        ORDER BY similarity DESC, similar.averageRating DESC
        LIMIT 10
      `;

      const movieRecommendations = await neo4jService.runQuery(movieBasedQuery, { userId: parseInt(userId) });

      // Combine and deduplicate recommendations
      const allRecommendations = [...genreRecommendations, ...movieRecommendations];
      const uniqueRecommendations = allRecommendations.filter((movie, index, self) =>
        index === self.findIndex(m => m.movieId === movie.movieId)
      ).slice(0, 20);

      // If no preference-based recommendations, fall back to popular movies
      if (uniqueRecommendations.length === 0) {
        const popularMoviesQuery = `
          MATCH (m:Movie)
          WHERE m.averageRating IS NOT NULL AND m.ratingCount > 50
          RETURN m.movieId as movieId, m.title as title, m.averageRating as score,
                 m.genres as genres, m.year as year, m.posterUrl as posterUrl
          ORDER BY m.averageRating DESC, m.ratingCount DESC
          LIMIT 20
        `;

        const popularMovies = await neo4jService.runQuery(popularMoviesQuery);

        return NextResponse.json({
          success: true,
          data: popularMovies.map(movie => ({
            movieId: movie.movieId,
            title: movie.title,
            score: movie.score || 0,
            genres: movie.genres || [],
            year: movie.year,
            posterUrl: movie.posterUrl,
            reason: "Popular movies (no preferences found)"
          })),
          userId: parseInt(userId),
          totalRecommendations: popularMovies.length,
          note: "Using popular movies - no user preferences found"
        });
      }

      return NextResponse.json({
        success: true,
        data: uniqueRecommendations.map(movie => ({
          movieId: movie.movieId,
          title: movie.title,
          score: movie.score || 0,
          genres: movie.genres || [],
          year: movie.year,
          posterUrl: movie.posterUrl,
          reason: movie.matchedGenres ?
            `Matches your favorite genres: ${movie.matchedGenres.join(', ')}` :
            `Similar to movies you liked`
        })),
        userId: parseInt(userId),
        totalRecommendations: uniqueRecommendations.length,
        note: "Using onboarding preferences for new user recommendations"
      });
    }

    // Get user's favorite genres
    const favoriteGenres = getUserFavoriteGenres(userRatings);

    // Collaborative filtering - find similar users
    const similarUsersQuery = `
      MATCH (u1:User {userId: $userId})-[r1:RATED]->(m:Movie)<-[r2:RATED]-(u2:User)
      WHERE u1 <> u2 AND abs(r1.rating - r2.rating) <= 1
      WITH u2, count(m) as commonMovies, 
           sum(abs(r1.rating - r2.rating)) as ratingDiff
      WHERE commonMovies >= 3
      RETURN u2.userId as userId, commonMovies, ratingDiff
      ORDER BY commonMovies DESC, ratingDiff ASC
      LIMIT 10
    `;

    const similarUsers = await neo4jService.runQuery(similarUsersQuery, { userId: parseInt(userId) });

    // Get recommendations from similar users
    let recommendations = [];
    
    if (similarUsers.length > 0) {
      const similarUserIds = similarUsers.map(u => u.userId);
      
      const collaborativeQuery = `
        MATCH (u:User)-[r:RATED]->(m:Movie)
        WHERE u.userId IN $similarUserIds 
          AND r.rating >= 4
          AND NOT EXISTS {
            MATCH (target:User {userId: $userId})-[:RATED]->(m)
          }
        WITH m, avg(r.rating) as avgRating, count(r) as ratingCount
        WHERE ratingCount >= 2
        RETURN m.movieId as movieId, m.title as title, avgRating as score,
               m.genres as genres, m.year as year, m.posterUrl as posterUrl
        ORDER BY avgRating DESC, ratingCount DESC
        LIMIT 10
      `;

      recommendations = await neo4jService.runQuery(collaborativeQuery, {
        similarUserIds,
        userId: parseInt(userId)
      });
    }

    // Content-based filtering - use both rating history and onboarding preferences
    if (recommendations.length < 10) {
      // Get user's onboarding genre preferences
      const onboardingGenresQuery = `
        MATCH (u:User {id: $userId})-[:LIKES_GENRE]->(g:Genre)
        RETURN collect(g.name) as likedGenres
      `;

      const onboardingResult = await neo4jService.runQuery(onboardingGenresQuery, { userId: parseInt(userId) });
      const onboardingGenres = onboardingResult.length > 0 ? onboardingResult[0].likedGenres : [];

      // Combine genres from ratings and onboarding
      const allFavoriteGenres = [...new Set([...favoriteGenres, ...onboardingGenres])];

      if (allFavoriteGenres.length > 0) {
        const contentBasedQuery = `
          MATCH (m:Movie)
          WHERE any(genre IN m.genres WHERE genre IN $favoriteGenres)
            AND m.averageRating >= 3.5
            AND NOT EXISTS {
              MATCH (u:User {id: $userId})-[:RATED]->(m)
            }
          RETURN m.movieId as movieId, m.title as title, m.averageRating as score,
                 m.genres as genres, m.year as year, m.posterUrl as posterUrl
          ORDER BY m.averageRating DESC, m.ratingCount DESC
          LIMIT ${10 - recommendations.length}
        `;

        const contentRecommendations = await neo4jService.runQuery(contentBasedQuery, {
          favoriteGenres: allFavoriteGenres,
          userId: parseInt(userId)
        });

        recommendations = [...recommendations, ...contentRecommendations];
      }
    }

    // Sanitize and add recommendation reasons
    const finalRecommendations = recommendations.map(movie => ({
      movieId: toNumber(movie.movieId),
      title: movie.title,
      genres: movie.genres || [],
      year: toNumber(movie.year),
      averageRating: movie.averageRating ? parseFloat(movie.averageRating) : undefined,
      posterUrl: movie.posterUrl,
      score: movie.score ? parseFloat(movie.score) : undefined,
      similarity: movie.similarity ? toNumber(movie.similarity) : undefined,
      reason: getRecommendationReason(movie, favoriteGenres, userRatings)
    }));

    return NextResponse.json({
      success: true,
      data: finalRecommendations,
      userId: parseInt(userId),
      totalRecommendations: finalRecommendations.length
    });

  } catch (error) {
    console.error('Recommendations API error:', error);
    const resolvedParams = await params;
    return getMockRecommendations(resolvedParams.userId);
  }
}

function getUserFavoriteGenres(userRatings: any[]): string[] {
  const genreRatings: { [key: string]: { total: number; count: number } } = {};
  
  userRatings.forEach(rating => {
    if (rating.rating >= 4 && rating.genres) {
      rating.genres.forEach((genre: string) => {
        if (!genreRatings[genre]) {
          genreRatings[genre] = { total: 0, count: 0 };
        }
        genreRatings[genre].total += rating.rating;
        genreRatings[genre].count += 1;
      });
    }
  });

  return Object.entries(genreRatings)
    .map(([genre, data]) => ({ genre, avgRating: data.total / data.count }))
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 5)
    .map(item => item.genre);
}

function getRecommendationReason(movie: any, favoriteGenres: string[], userRatings: any[]): string {
  const movieGenres = movie.genres || [];
  const matchingGenres = movieGenres.filter((genre: string) => favoriteGenres.includes(genre));
  
  if (matchingGenres.length > 0) {
    return `Because you like ${matchingGenres[0]} movies`;
  }
  
  if (movie.score >= 4.5) {
    return "Highly rated movie";
  }
  
  return "Recommended for you";
}

function getMockRecommendations(userId: string) {
  // In a real Neo4j implementation, this would query user preferences
  // For mock data, we simulate preference-based recommendations

  const mockRecommendations = [
    {
      movieId: 1,
      title: "The Shawshank Redemption",
      score: 4.8,
      genres: ["Drama"],
      year: 1994,
      posterUrl: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
      reason: "Based on your preference for Drama movies"
    },
    {
      movieId: 6,
      title: "Heat",
      score: 4.0,
      genres: ["Action", "Crime", "Thriller"],
      year: 1995,
      posterUrl: "https://image.tmdb.org/t/p/w500/zMyfPUelumio3tiDKPffaUpsQTD.jpg",
      reason: "Based on your preference for Action movies"
    },
    {
      movieId: 10,
      title: "GoldenEye",
      score: 3.8,
      genres: ["Action", "Adventure", "Thriller"],
      year: 1995,
      posterUrl: "https://image.tmdb.org/t/p/w500/5c0ovjT41KnYIHYuF4AWsTe3sKh.jpg",
      reason: "Similar to movies you liked during onboarding"
    }
  ];

  return NextResponse.json({
    success: true,
    data: mockRecommendations,
    userId: parseInt(userId),
    totalRecommendations: mockRecommendations.length,
    note: "Using mock data - Neo4j not available"
  });
}
