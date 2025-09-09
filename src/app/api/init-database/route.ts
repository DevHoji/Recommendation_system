import { NextRequest, NextResponse } from 'next/server';
import { databaseInitializer } from '@/lib/database-init';
import { allMockMovies } from '@/lib/mock-data';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Database initialization requested...');

    try {
      // Try to initialize the real database
      await databaseInitializer.initializeDatabase();
      const stats = await databaseInitializer.getDatabaseStats();

      return NextResponse.json({
        success: true,
        message: 'Database initialized successfully',
        stats,
        usingMockData: false
      });
    } catch (dbError) {
      console.warn('Neo4j database not available, using mock data:', dbError instanceof Error ? dbError.message : String(dbError));

      // Return mock data statistics
      const mockStats = {
        movies: allMockMovies.length,
        users: 610,
        ratings: 100836,
        genres: 18,
        tags: 3683
      };

      return NextResponse.json({
        success: true,
        message: 'Using mock data for demonstration (Neo4j not available)',
        stats: mockStats,
        usingMockData: true
      });
    }
  } catch (error) {
    console.error('Database initialization error:', error);

    return NextResponse.json({
      success: false,
      message: 'Database initialization failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    try {
      // Try to get real database statistics
      const stats = await databaseInitializer.getDatabaseStats();

      return NextResponse.json({
        success: true,
        stats,
        usingMockData: false
      });
    } catch (dbError) {
      console.warn('Neo4j database not available, returning mock stats:', dbError instanceof Error ? dbError.message : String(dbError));

      // Return mock data statistics
      const mockStats = {
        movies: allMockMovies.length,
        users: 610,
        ratings: 100836,
        genres: 18,
        tags: 3683
      };

      return NextResponse.json({
        success: true,
        stats: mockStats,
        usingMockData: true
      });
    }
  } catch (error) {
    console.error('Error getting database stats:', error);

    return NextResponse.json({
      success: false,
      message: 'Failed to get database statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
