import { neo4jService } from './neo4j';
import path from 'path';

export class DatabaseInitializer {
  private dataPath: string;

  constructor() {
    this.dataPath = path.join(process.cwd(), 'data');
  }

  private parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  async initializeDatabase(): Promise<void> {
    console.log('🚀 Starting database initialization...');
    
    try {
      // Test connection
      const isConnected = await neo4jService.testConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to Neo4j database');
      }
      console.log('✅ Neo4j connection established');

      // Clear existing data
      await this.clearDatabase();
      
      // Create constraints and indexes
      await this.createConstraintsAndIndexes();
      
      // Import data
      await this.importMovies();
      await this.importUsers();
      await this.importRatings();
      await this.importTags();
      
      // Create additional relationships
      await this.createGenreRelationships();
      
      console.log('🎉 Database initialization completed successfully!');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  private async clearDatabase(): Promise<void> {
    console.log('🧹 Clearing existing data...');
    await neo4jService.runQuery('MATCH (n) DETACH DELETE n');
  }

  private async createConstraintsAndIndexes(): Promise<void> {
    console.log('📋 Creating constraints and indexes...');
    
    const queries = [
      // Constraints
      'CREATE CONSTRAINT movie_id IF NOT EXISTS FOR (m:Movie) REQUIRE m.movieId IS UNIQUE',
      'CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.userId IS UNIQUE',
      'CREATE CONSTRAINT genre_name IF NOT EXISTS FOR (g:Genre) REQUIRE g.name IS UNIQUE',
      
      // Indexes for better performance
      'CREATE INDEX movie_title IF NOT EXISTS FOR (m:Movie) ON (m.title)',
      'CREATE INDEX rating_value IF NOT EXISTS FOR ()-[r:RATED]-() ON (r.rating)',
      'CREATE INDEX rating_timestamp IF NOT EXISTS FOR ()-[r:RATED]-() ON (r.timestamp)',
    ];

    for (const query of queries) {
      try {
        await neo4jService.runQuery(query);
      } catch (error) {
        // Ignore constraint/index already exists errors
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }
  }

  private async importMovies(): Promise<void> {
    console.log('🎬 Importing movies...');

    // For Neo4j AuraDB, we need to use a different approach since file:// URLs don't work
    // We'll read the CSV file and import data in batches
    const fs = require('fs');
    const csvPath = path.join(this.dataPath, 'movies.csv');
    const linksPath = path.join(this.dataPath, 'links.csv');

    if (!fs.existsSync(csvPath)) {
      throw new Error(`Movies CSV file not found at ${csvPath}`);
    }

    // Read movies CSV
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').slice(1); // Skip header

    // Read links CSV for TMDB IDs
    let tmdbLinks = new Map<string, string>();
    if (fs.existsSync(linksPath)) {
      const linksContent = fs.readFileSync(linksPath, 'utf-8');
      const linkLines = linksContent.split('\n').slice(1);

      linkLines.forEach(line => {
        if (line.trim()) {
          const parts = line.split(',');
          if (parts.length >= 3 && parts[2]) {
            tmdbLinks.set(parts[0], parts[2]); // movieId -> tmdbId
          }
        }
      });
      console.log(`Found ${tmdbLinks.size} TMDB links`);
    }

    console.log(`Found ${lines.length} movies to import`);

    // Import in batches of 50 (smaller batches for TMDB integration)
    const batchSize = 50;
    for (let i = 0; i < lines.length; i += batchSize) {
      const batch = lines.slice(i, i + batchSize).filter(line => line.trim());

      if (batch.length === 0) continue;

      const query = `
        UNWIND $movies AS movie
        CREATE (m:Movie {
          movieId: toInteger(movie.movieId),
          title: movie.title,
          genres: split(movie.genres, '|'),
          year: CASE
            WHEN movie.title =~ '.*\\((\\d{4})\\)$'
            THEN toInteger(substring(movie.title, size(movie.title)-5, 4))
            ELSE null
          END,
          tmdbId: CASE WHEN movie.tmdbId IS NOT NULL THEN toInteger(movie.tmdbId) ELSE null END,
          posterUrl: movie.posterUrl
        })
      `;

      const movies = batch.map(line => {
        const parts = this.parseCSVLine(line);
        if (parts.length >= 3) {
          const movieId = parts[0];
          const tmdbId = tmdbLinks.get(movieId);
          const posterUrl = tmdbId ? `https://image.tmdb.org/t/p/w500/placeholder${movieId % 10}.jpg` : null;

          return {
            movieId: movieId,
            title: parts[1],
            genres: parts[2],
            tmdbId: tmdbId || null,
            posterUrl: posterUrl
          };
        }
        return null;
      }).filter(movie => movie && movie.movieId && movie.title);

      if (movies.length > 0) {
        await neo4jService.runQuery(query, { movies });
        console.log(`✅ Imported batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(lines.length/batchSize)}`);
      }
    }

    console.log('✅ Movies imported successfully');
  }

  private async importUsers(): Promise<void> {
    console.log('👥 Creating users from ratings...');

    const fs = require('fs');
    const csvPath = path.join(this.dataPath, 'ratings.csv');

    if (!fs.existsSync(csvPath)) {
      throw new Error(`Ratings CSV file not found at ${csvPath}`);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').slice(1); // Skip header

    // Get unique user IDs
    const userIds = new Set<number>();
    lines.forEach(line => {
      if (line.trim()) {
        const [userId] = line.split(',');
        if (userId) {
          userIds.add(parseInt(userId));
        }
      }
    });

    console.log(`Found ${userIds.size} unique users to create`);

    // Create users in batches
    const userIdArray = Array.from(userIds);
    const batchSize = 100;

    for (let i = 0; i < userIdArray.length; i += batchSize) {
      const batch = userIdArray.slice(i, i + batchSize);

      const query = `
        UNWIND $userIds AS userId
        MERGE (u:User {userId: userId})
      `;

      await neo4jService.runQuery(query, { userIds: batch });
      console.log(`✅ Created user batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(userIdArray.length/batchSize)}`);
    }

    console.log('✅ Users created successfully');
  }

  private async importRatings(): Promise<void> {
    console.log('⭐ Importing ratings...');

    const fs = require('fs');
    const csvPath = path.join(this.dataPath, 'ratings.csv');

    if (!fs.existsSync(csvPath)) {
      throw new Error(`Ratings CSV file not found at ${csvPath}`);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').slice(1); // Skip header

    console.log(`Found ${lines.length} ratings to import`);

    // Import in batches
    const batchSize = 100;
    for (let i = 0; i < lines.length; i += batchSize) {
      const batch = lines.slice(i, i + batchSize).filter(line => line.trim());

      if (batch.length === 0) continue;

      const query = `
        UNWIND $ratings AS rating
        MATCH (u:User {userId: rating.userId})
        MATCH (m:Movie {movieId: rating.movieId})
        CREATE (u)-[r:RATED {
          rating: rating.rating,
          timestamp: rating.timestamp
        }]->(m)
      `;

      const ratings = batch.map(line => {
        const [userId, movieId, rating, timestamp] = line.split(',');
        return {
          userId: parseInt(userId),
          movieId: parseInt(movieId),
          rating: parseFloat(rating),
          timestamp: parseInt(timestamp)
        };
      }).filter(rating => !isNaN(rating.userId) && !isNaN(rating.movieId) && !isNaN(rating.rating));

      if (ratings.length > 0) {
        await neo4jService.runQuery(query, { ratings });
        console.log(`✅ Imported rating batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(lines.length/batchSize)}`);
      }
    }

    console.log('✅ Ratings imported successfully');
  }

  private async importTags(): Promise<void> {
    console.log('🏷️ Importing tags...');

    const fs = require('fs');
    const csvPath = path.join(this.dataPath, 'tags.csv');

    if (!fs.existsSync(csvPath)) {
      console.log('⚠️ Tags CSV file not found, skipping tags import');
      return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').slice(1); // Skip header

    console.log(`Found ${lines.length} tags to import`);

    // Import in batches
    const batchSize = 100;
    for (let i = 0; i < lines.length; i += batchSize) {
      const batch = lines.slice(i, i + batchSize).filter(line => line.trim());

      if (batch.length === 0) continue;

      const query = `
        UNWIND $tags AS tag
        MATCH (u:User {userId: tag.userId})
        MATCH (m:Movie {movieId: tag.movieId})
        CREATE (u)-[t:TAGGED {
          tag: tag.tag,
          timestamp: tag.timestamp
        }]->(m)
      `;

      const tags = batch.map(line => {
        const parts = line.split(',');
        if (parts.length >= 4) {
          return {
            userId: parseInt(parts[0]),
            movieId: parseInt(parts[1]),
            tag: parts[2].replace(/"/g, ''),
            timestamp: parseInt(parts[3])
          };
        }
        return null;
      }).filter(tag => tag && !isNaN(tag.userId) && !isNaN(tag.movieId) && tag.tag);

      if (tags.length > 0) {
        await neo4jService.runQuery(query, { tags });
        console.log(`✅ Imported tag batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(lines.length/batchSize)}`);
      }
    }

    console.log('✅ Tags imported successfully');
  }

  private async createGenreRelationships(): Promise<void> {
    console.log('🎭 Creating genre relationships...');
    
    const queries = [
      // Create Genre nodes
      `
        MATCH (m:Movie)
        UNWIND m.genres as genre
        WITH DISTINCT genre
        WHERE genre <> '(no genres listed)'
        CREATE (g:Genre {name: genre})
      `,
      
      // Create Movie-Genre relationships
      `
        MATCH (m:Movie)
        UNWIND m.genres as genreName
        MATCH (g:Genre {name: genreName})
        CREATE (m)-[:HAS_GENRE]->(g)
      `
    ];

    for (const query of queries) {
      await neo4jService.runQuery(query);
    }
    
    console.log('✅ Genre relationships created successfully');
  }

  async getDatabaseStats(): Promise<any> {
    const queries = [
      'MATCH (m:Movie) RETURN count(m) as movieCount',
      'MATCH (u:User) RETURN count(u) as userCount',
      'MATCH (g:Genre) RETURN count(g) as genreCount',
      'MATCH ()-[r:RATED]-() RETURN count(r) as ratingCount',
      'MATCH ()-[t:TAGGED]-() RETURN count(t) as tagCount'
    ];

    const results = await Promise.all(
      queries.map(query => neo4jService.runQuery(query))
    );

    return {
      movies: results[0][0]?.movieCount || 0,
      users: results[1][0]?.userCount || 0,
      genres: results[2][0]?.genreCount || 0,
      ratings: results[3][0]?.ratingCount || 0,
      tags: results[4][0]?.tagCount || 0
    };
  }
}

export const databaseInitializer = new DatabaseInitializer();
