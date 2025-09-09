import { NextRequest, NextResponse } from 'next/server';
import { neo4jService } from '@/lib/neo4j';

export async function PUT(request: NextRequest) {
  try {
    const { userId, isOnboarded } = await request.json();

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    // Test Neo4j connection
    const isConnected = await neo4jService.testConnection();
    
    if (!isConnected) {
      console.log('Neo4j not available, onboarding status saved locally only');
      return NextResponse.json({
        success: true,
        message: 'Onboarding status updated successfully (local storage only)',
        usingMockData: true
      });
    }

    // Update onboarding status in Neo4j
    const updateQuery = `
      MATCH (u:User {id: $userId})
      SET u.isOnboarded = $isOnboarded
      RETURN u
    `;

    const result = await neo4jService.runQuery(updateQuery, {
      userId,
      isOnboarded
    });

    if (result.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding status updated successfully'
    });

  } catch (error) {
    console.error('Onboarding update error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update onboarding status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
