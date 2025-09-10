#!/usr/bin/env node

/**
 * Test script to verify all API endpoints properly sanitize Neo4j Integer objects
 * This helps ensure React error #31 is completely resolved
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3001';

// Function to check if a value is a Neo4j Integer object
function isNeo4jInteger(value) {
  return value && typeof value === 'object' && 
         'low' in value && 'high' in value && 
         typeof value.low === 'number' && typeof value.high === 'number';
}

// Function to recursively check an object for Neo4j Integer objects
function findNeo4jIntegers(obj, path = '') {
  const issues = [];
  
  if (obj === null || obj === undefined) {
    return issues;
  }
  
  if (isNeo4jInteger(obj)) {
    issues.push(`Neo4j Integer found at: ${path}`);
    return issues;
  }
  
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      issues.push(...findNeo4jIntegers(item, `${path}[${index}]`));
    });
  } else if (typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      issues.push(...findNeo4jIntegers(obj[key], path ? `${path}.${key}` : key));
    });
  }
  
  return issues;
}

// Test endpoints
const endpoints = [
  '/api/movies?limit=3',
  '/api/movies/search?q=test&limit=2',
  '/api/recommendations/1',
  '/api/users?userId=1',
  '/api/debug-movies',
  '/api/setup-database'
];

async function testEndpoint(endpoint) {
  try {
    console.log(`\n🧪 Testing: ${endpoint}`);
    
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const data = await response.json();
    
    if (!response.ok) {
      console.log(`⚠️  HTTP ${response.status}: ${data.message || 'Unknown error'}`);
      return;
    }
    
    const issues = findNeo4jIntegers(data);
    
    if (issues.length === 0) {
      console.log(`✅ Clean - No Neo4j Integer objects found`);
    } else {
      console.log(`❌ Issues found:`);
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🔍 Testing API endpoints for Neo4j Integer objects...');
  console.log(`Base URL: ${BASE_URL}`);
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log('\n✨ Test completed!');
}

// Run the tests
runTests().catch(console.error);
