import { NextRequest, NextResponse } from 'next/server';
import { neo4jService } from '@/lib/neo4j';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting database setup...');
    
    // Test connection first
    const isConnected = await neo4jService.testConnection();
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        message: 'Failed to connect to Neo4j database',
        error: 'Connection test failed'
      }, { status: 500 });
    }

    console.log('Neo4j connection successful');

    // Clear existing data
    await neo4jService.runQuery('MATCH (n) DETACH DELETE n');
    console.log('Cleared existing data');

    // Create constraints and indexes
    const constraints = [
      'CREATE CONSTRAINT movie_id IF NOT EXISTS FOR (m:Movie) REQUIRE m.movieId IS UNIQUE',
      'CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.userId IS UNIQUE',
      'CREATE CONSTRAINT tag_id IF NOT EXISTS FOR (t:Tag) REQUIRE t.tagId IS UNIQUE',
      'CREATE INDEX movie_title IF NOT EXISTS FOR (m:Movie) ON (m.title)',
      'CREATE INDEX movie_year IF NOT EXISTS FOR (m:Movie) ON (m.year)',
      'CREATE INDEX movie_genres IF NOT EXISTS FOR (m:Movie) ON (m.genres)',
      'CREATE INDEX rating_timestamp IF NOT EXISTS FOR ()-[r:RATED]-() ON (r.timestamp)'
    ];

    for (const constraint of constraints) {
      try {
        await neo4jService.runQuery(constraint);
        console.log(`Created constraint/index: ${constraint.split(' ')[1]}`);
      } catch (error) {
        console.log(`Constraint/index already exists or failed: ${constraint}`);
      }
    }

    // Import comprehensive MovieLens-style dataset
    const sampleMoviesQuery = `
      UNWIND [
        {movieId: 1, title: "Toy Story (1995)", genres: ["Animation", "Children", "Comedy"], rating: 8.3, overview: "A cowboy doll is profoundly threatened and jealous when a new spaceman figure supplants him as top toy in a boy's room."},
        {movieId: 2, title: "Jumanji (1995)", genres: ["Adventure", "Children", "Fantasy"], rating: 7.0, overview: "When two kids find and play a magical board game, they release a man trapped in it for decades - and a host of dangers that can only be stopped by finishing the game."},
        {movieId: 3, title: "Grumpier Old Men (1995)", genres: ["Comedy", "Romance"], rating: 6.7, overview: "John and Max resolve to save their beloved bait shop from turning into an Italian restaurant, just as its new female owner catches Max's attention."},
        {movieId: 4, title: "Waiting to Exhale (1995)", genres: ["Comedy", "Drama", "Romance"], rating: 6.1, overview: "Based on Terry McMillan's novel, this film follows four African American women and their relationships with men."},
        {movieId: 5, title: "Father of the Bride Part II (1995)", genres: ["Comedy"], rating: 6.1, overview: "George Banks must deal not only with his daughter's pregnancy, but also with his wife's unexpected pregnancy."},
        {movieId: 21, title: "The Dark Knight (2008)", genres: ["Action", "Crime", "Drama"], rating: 9.0, overview: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests."},
        {movieId: 22, title: "Inception (2010)", genres: ["Action", "Sci-Fi", "Thriller"], rating: 8.8, overview: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O."},
        {movieId: 23, title: "The Avengers (2012)", genres: ["Action", "Adventure", "Sci-Fi"], rating: 8.0, overview: "Earth's mightiest heroes must come together and learn to fight as a team if they are going to stop the mischievous Loki and his alien army from enslaving humanity."},
        {movieId: 24, title: "Interstellar (2014)", genres: ["Drama", "Sci-Fi"], rating: 8.6, overview: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival."},
        {movieId: 25, title: "The Shawshank Redemption (1994)", genres: ["Drama"], rating: 9.3, overview: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency."},
        {movieId: 26, title: "Pulp Fiction (1994)", genres: ["Crime", "Drama"], rating: 8.9, overview: "The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption."},
        {movieId: 27, title: "The Godfather (1972)", genres: ["Crime", "Drama"], rating: 9.2, overview: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son."},
        {movieId: 28, title: "Forrest Gump (1994)", genres: ["Drama", "Romance"], rating: 8.8, overview: "The presidencies of Kennedy and Johnson, the events of Vietnam, Watergate and other historical events unfold from the perspective of an Alabama man."},
        {movieId: 29, title: "The Matrix (1999)", genres: ["Action", "Sci-Fi"], rating: 8.7, overview: "A computer programmer is led to fight an underground war against powerful computers who have constructed his entire reality with a system called the Matrix."},
        {movieId: 30, title: "Titanic (1997)", genres: ["Drama", "Romance"], rating: 7.8, overview: "A seventeen-year-old aristocrat falls in love with a kind but poor artist aboard the luxurious, ill-fated R.M.S. Titanic."},
        {movieId: 31, title: "Star Wars (1977)", genres: ["Action", "Adventure", "Sci-Fi"], rating: 8.6, overview: "Luke Skywalker joins forces with a Jedi Knight, a cocky pilot, a Wookiee and two droids to save the galaxy."},
        {movieId: 32, title: "The Lord of the Rings: The Fellowship of the Ring (2001)", genres: ["Adventure", "Drama", "Fantasy"], rating: 8.8, overview: "A meek Hobbit from the Shire and eight companions set out on a journey to destroy the powerful One Ring."},
        {movieId: 33, title: "Goodfellas (1990)", genres: ["Biography", "Crime", "Drama"], rating: 8.7, overview: "The story of Henry Hill and his life in the mob, covering his relationship with his wife Karen Hill and his mob partners."},
        {movieId: 34, title: "Casablanca (1942)", genres: ["Drama", "Romance", "War"], rating: 8.5, overview: "A cynical American expatriate struggles to decide whether or not he should help his former lover and her fugitive husband escape French Morocco."},
        {movieId: 35, title: "Schindler's List (1993)", genres: ["Biography", "Drama", "History"], rating: 8.9, overview: "In German-occupied Poland during World War II, industrialist Oskar Schindler gradually becomes concerned for his Jewish workforce."}
      ] AS movie
      MERGE (m:Movie {movieId: movie.movieId})
      SET m.title = movie.title,
          m.year = toInteger(substring(movie.title, size(movie.title)-5, 4)),
          m.genres = movie.genres,
          m.averageRating = movie.rating,
          m.overview = movie.overview,
          m.ratingCount = toInteger(rand() * 1000 + 100)
      RETURN count(m) as moviesCreated
    `;

    const movieResult = await neo4jService.runQuery(sampleMoviesQuery);
    console.log(`Created ${movieResult[0]?.moviesCreated || 0} movies`);

    // Create sample users
    const usersQuery = `
      UNWIND range(1, 50) AS userId
      MERGE (u:User {userId: userId})
      SET u.name = 'User ' + toString(userId)
      RETURN count(u) as usersCreated
    `;

    const userResult = await neo4jService.runQuery(usersQuery);
    console.log(`Created ${userResult[0]?.usersCreated || 0} users`);

    // Create sample ratings
    const ratingsQuery = `
      MATCH (u:User), (m:Movie)
      WITH u, m, rand() as r
      WHERE r < 0.3
      MERGE (u)-[rating:RATED]->(m)
      SET rating.rating = toFloat(round((rand() * 4 + 1) * 10) / 10),
          rating.timestamp = timestamp() - toInteger(rand() * 31536000000)
      RETURN count(rating) as ratingsCreated
    `;

    const ratingResult = await neo4jService.runQuery(ratingsQuery);
    console.log(`Created ${ratingResult[0]?.ratingsCreated || 0} ratings`);

    // Create sample tags
    const tagsQuery = `
      UNWIND [
        "action", "comedy", "drama", "thriller", "sci-fi", "romance", "horror", 
        "adventure", "animation", "crime", "fantasy", "mystery", "family", "war"
      ] AS tagName
      MERGE (t:Tag {name: tagName})
      WITH t
      MATCH (u:User), (m:Movie)
      WITH t, u, m, rand() as r
      WHERE r < 0.1
      MERGE (u)-[tagged:TAGGED {tag: t.name}]->(m)
      SET tagged.timestamp = timestamp() - toInteger(rand() * 31536000000)
      RETURN count(tagged) as tagsCreated
    `;

    const tagResult = await neo4jService.runQuery(tagsQuery);
    console.log(`Created ${tagResult[0]?.tagsCreated || 0} tags`);

    // Verify data
    const verificationQueries = [
      'MATCH (m:Movie) RETURN count(m) as movieCount',
      'MATCH (u:User) RETURN count(u) as userCount', 
      'MATCH ()-[r:RATED]->() RETURN count(r) as ratingCount',
      'MATCH ()-[t:TAGGED]->() RETURN count(t) as tagCount'
    ];

    const verification = {};
    for (const query of verificationQueries) {
      const result = await neo4jService.runQuery(query);
      const key = Object.keys(result[0])[0];
      verification[key] = result[0][key];
    }

    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully',
      data: {
        moviesCreated: movieResult[0]?.moviesCreated || 0,
        usersCreated: userResult[0]?.usersCreated || 0,
        ratingsCreated: ratingResult[0]?.ratingsCreated || 0,
        tagsCreated: tagResult[0]?.tagsCreated || 0,
        verification
      }
    });

  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json({
      success: false,
      message: 'Database setup failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Test connection and return database status
    const isConnected = await neo4jService.testConnection();
    
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        message: 'Database connection failed'
      }, { status: 500 });
    }

    // Get database statistics
    const stats = await neo4jService.runQuery(`
      CALL db.labels() YIELD label
      RETURN collect(label) as labels
    `);

    const counts = await neo4jService.runQuery(`
      MATCH (n) 
      RETURN labels(n)[0] as nodeType, count(n) as count
    `);

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        labels: stats[0]?.labels || [],
        nodeCounts: counts
      }
    });

  } catch (error) {
    console.error('Database status check error:', error);
    return NextResponse.json({
      success: false,
      message: 'Database status check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
