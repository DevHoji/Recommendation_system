import { NextRequest, NextResponse } from 'next/server';
import { databaseInitializer } from '@/lib/database-init';

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
      console.error('Neo4j database connection failed:', dbError instanceof Error ? dbError.message : String(dbError));

      return NextResponse.json({
        success: false,
        message: 'Database connection failed. Please ensure Neo4j is properly configured.',
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
        hint: 'Check your Neo4j AuraDB credentials and ensure the database is running.'
      }, { status: 500 });
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
      console.error('Neo4j database connection failed:', dbError instanceof Error ? dbError.message : String(dbError));

      return NextResponse.json({
        success: false,
        message: 'Database connection failed. Please ensure Neo4j is properly configured.',
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
        hint: 'Check your Neo4j AuraDB credentials and ensure the database is running.'
      }, { status: 500 });
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
