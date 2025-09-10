# Neo4j AuraDB Setup Guide

## 🚨 CRITICAL: Current Issue
The application is failing to connect to Neo4j AuraDB with the error:
```
Neo.ClientError.Security.Unauthorized: The client is unauthorized due to authentication failure.
```

**Your trainer requires the system to use ONLY Neo4j with Cypher queries - no mock data fallbacks.**

## ✅ IMMEDIATE ACTION REQUIRED: Fix Neo4j Connection

### 1. 🔍 Verify Neo4j AuraDB Instance Status
1. **Go to https://console.neo4j.io/**
2. **Log in to your Neo4j Aura account**
3. **CRITICAL**: Verify your database instance is **RUNNING** (not paused/stopped)
4. **Click on your database instance to see connection details**

### 2. 📋 Get EXACT Connection Details
From your Neo4j Aura console, copy the EXACT values:

1. **Connection URI**: Should look like `neo4j+s://xxxxxxxx.databases.neo4j.io`
2. **Username**: Usually `neo4j`
3. **Password**: The EXACT password you set when creating the database
4. **Database Name**: Usually `neo4j` (default)

⚠️ **IMPORTANT**: The password must be EXACTLY what you set - no typos, extra spaces, or case changes.

### 3. Update Environment Variables
Update your `.env.local` file with the correct credentials:

```env
# Neo4j AuraDB Configuration
NEO4J_URI=neo4j+s://your-instance-id.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-actual-password
NEO4J_DATABASE=neo4j

# Other existing variables...
TMDB_API_KEY=f6177b0249580a893e846cc2521bd090
GEMINI_API_KEY=AIzaSyCpxs6PXvRp0B3qyqmyL2asksgpURBlEJA
```

### 4. Test Connection
After updating the credentials, test the connection:
```bash
curl http://localhost:3000/api/test-neo4j
```

You should see a success response like:
```json
{
  "success": true,
  "message": "Neo4j connection successful",
  "data": {
    "test": 1,
    "currentTime": "2024-01-01T12:00:00Z",
    "uri": "neo4j+s://...",
    "database": "neo4j"
  }
}
```

### 5. Import MovieLens Data
Once the connection works, import the data:
```bash
curl -X POST http://localhost:3000/api/setup-database
```

This will:
- Clear existing data
- Create constraints and indexes
- Import sample movie data
- Create users and ratings
- Set up the graph schema

### 6. Verify Data Import
Check that data was imported successfully:
```bash
curl http://localhost:3000/api/setup-database
```

You should see node counts like:
```json
{
  "success": true,
  "data": {
    "moviesCreated": 15,
    "usersCreated": 50,
    "ratingsCreated": 200,
    "verification": {
      "movieCount": 15,
      "userCount": 50,
      "ratingCount": 200
    }
  }
}
```

## Common Issues and Solutions

### Issue 1: Database Paused
**Error**: Connection timeout or unauthorized
**Solution**: Resume your database in the Neo4j Aura console

### Issue 2: Wrong Password
**Error**: `Neo.ClientError.Security.Unauthorized`
**Solution**: Reset password in Neo4j Aura console and update `.env.local`

### Issue 3: Wrong URI Format
**Error**: Connection refused
**Solution**: Ensure URI starts with `neo4j+s://` for AuraDB

### Issue 4: Firewall/Network Issues
**Error**: Connection timeout
**Solution**: Check if your network allows connections to Neo4j Aura (port 7687)

## Database Schema
After successful import, your Neo4j database will have:

### Nodes:
- `Movie`: Contains movieId, title, year, genres
- `User`: Contains userId, name
- `Tag`: Contains name

### Relationships:
- `(User)-[:RATED]->(Movie)`: Contains rating, timestamp
- `(User)-[:TAGGED {tag: string}]->(Movie)`: Contains timestamp

### Indexes and Constraints:
- Unique constraint on Movie.movieId
- Unique constraint on User.userId
- Indexes on Movie.title, Movie.year, Movie.genres
- Index on rating timestamps

## Next Steps
Once the database is set up:
1. The app will automatically use Neo4j instead of mock data
2. All movie filtering, searching, and recommendations will be powered by Cypher queries
3. The recommendation system will use collaborative filtering based on user ratings
4. The AI chatbot will convert natural language to Cypher queries

## Testing Cypher Queries
You can test queries directly in Neo4j Browser:
```cypher
// Get all movies
MATCH (m:Movie) RETURN m LIMIT 10

// Get movies by genre
MATCH (m:Movie) 
WHERE 'Action' IN m.genres 
RETURN m.title, m.year

// Get user ratings
MATCH (u:User)-[r:RATED]->(m:Movie) 
RETURN u.name, m.title, r.rating 
LIMIT 10

// Get movie recommendations for a user
MATCH (u:User {userId: 1})-[r:RATED]->(m:Movie)
MATCH (m)<-[r2:RATED]-(u2:User)
MATCH (u2)-[r3:RATED]->(rec:Movie)
WHERE NOT EXISTS((u)-[:RATED]->(rec))
RETURN rec.title, avg(r3.rating) as avgRating
ORDER BY avgRating DESC
LIMIT 5
```
