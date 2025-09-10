import { NextRequest, NextResponse } from 'next/server';
import neo4j from 'neo4j-driver';

export async function GET(request: NextRequest) {
  let driver = null;
  
  try {
    console.log('Testing Neo4j connection...');
    console.log('URI:', process.env.NEO4J_URI);
    console.log('Username:', process.env.NEO4J_USERNAME);
    console.log('Database:', process.env.NEO4J_DATABASE);
    
    // Create driver
    driver = neo4j.driver(
      process.env.NEO4J_URI!,
      neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!)
    );

    // Test connection
    const session = driver.session({ database: process.env.NEO4J_DATABASE });
    
    try {
      console.log('Running test query...');
      const result = await session.run('RETURN 1 as test, datetime() as currentTime');
      const record = result.records[0];
      
      console.log('Connection successful!');
      
      return NextResponse.json({
        success: true,
        message: 'Neo4j connection successful',
        data: {
          test: record.get('test'),
          currentTime: record.get('currentTime').toString(),
          uri: process.env.NEO4J_URI,
          database: process.env.NEO4J_DATABASE
        }
      });
      
    } finally {
      await session.close();
    }
    
  } catch (error) {
    console.error('Neo4j connection error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Neo4j connection failed',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code || 'UNKNOWN',
        classification: (error as any)?.classification || 'UNKNOWN'
      },
      config: {
        uri: process.env.NEO4J_URI,
        username: process.env.NEO4J_USERNAME,
        database: process.env.NEO4J_DATABASE
      }
    }, { status: 500 });
    
  } finally {
    if (driver) {
      await driver.close();
    }
  }
}
