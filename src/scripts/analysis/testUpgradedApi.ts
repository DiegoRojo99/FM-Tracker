import { rateLimiter } from '../../lib/utils/rateLimiter';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.API_FOOTBALL_KEY!;
const BASE_URL = 'https://v3.football.api-sports.io';

// Test different API endpoints and subscription limits
export async function testUpgradedApiAccess() {
  console.log('🔍 Testing upgraded API subscription capabilities...');
  
  // Test 1: Check subscription status
  console.log('\n📋 Test 1: Checking subscription status...');
  await testSubscriptionStatus();
  
  // Test 2: Test different seasons on Premier League
  console.log('\n📋 Test 2: Testing seasons with detailed responses...');
  await testSeasonsDetailed();
  
  // Test 3: Test different endpoints
  console.log('\n📋 Test 3: Testing different endpoints...');
  await testDifferentEndpoints();
  
  // Test 4: Check rate limits
  console.log('\n📋 Test 4: Current rate limit status...');
  const remaining = rateLimiter.getRemainingCalls();
  console.log(`Rate limits: ${remaining.minute}/9 this minute, ${remaining.daily}/95 today`);
}

async function testSubscriptionStatus() {
  try {
    await rateLimiter.waitIfNeeded();
    
    const res = await fetch(`${BASE_URL}/status`, {
      headers: {
        'x-apisports-key': API_KEY,
      },
    });
    
    rateLimiter.recordCall();
    
    if (!res.ok) {
      console.error(`❌ Status API error: ${res.status}`);
      return;
    }
    
    const data = await res.json();
    console.log('✅ API Status Response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Error checking subscription status:', error);
  }
}

async function testSeasonsDetailed() {
  const testLeagueId = 39; // Premier League
  const seasonsToTest = [2025, 2024, 2023];
  
  for (const season of seasonsToTest) {
    try {
      console.log(`\n📡 Testing season ${season} with full response...`);
      
      await rateLimiter.waitIfNeeded();
      
      const res = await fetch(`${BASE_URL}/teams?league=${testLeagueId}&season=${season}`, {
        headers: {
          'x-apisports-key': API_KEY,
        },
      });
      
      rateLimiter.recordCall();
      
      console.log(`Response status: ${res.status}`);
      
      if (!res.ok) {
        console.error(`❌ API error for season ${season}: ${res.status}`);
        continue;
      }
      
      const data = await res.json();
      
      console.log(`Response structure:`, {
        errors: data.errors,
        results: data.results,
        paging: data.paging,
        responseLength: data.response?.length || 0
      });
      
      if (data.errors && data.errors.length > 0) {
        console.log(`❌ API Errors for season ${season}:`, data.errors);
      }
      
      if (data.response && data.response.length > 0) {
        console.log(`✅ Season ${season}: ${data.response.length} teams found`);
        console.log(`First team:`, data.response[0]);
      } else {
        console.log(`❌ Season ${season}: No teams in response`);
      }
      
    } catch (error) {
      console.error(`❌ Error testing season ${season}:`, error);
    }
  }
}

async function testDifferentEndpoints() {
  const endpoints = [
    '/leagues?season=2025',
    '/leagues?season=2024', 
    '/leagues?season=2023',
    '/teams?league=39&season=2025',
    '/fixtures?league=39&season=2025&last=1'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testing endpoint: ${endpoint}`);
      
      await rateLimiter.waitIfNeeded();
      
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          'x-apisports-key': API_KEY,
        },
      });
      
      rateLimiter.recordCall();
      
      if (!res.ok) {
        console.error(`❌ Error ${res.status} for: ${endpoint}`);
        continue;
      }
      
      const data = await res.json();
      
      console.log(`✅ ${endpoint}:`, {
        results: data.results,
        errors: data.errors?.length || 0,
        responseLength: data.response?.length || 0
      });
      
      if (data.errors && data.errors.length > 0) {
        console.log(`  Errors:`, data.errors);
      }
      
    } catch (error) {
      console.error(`❌ Error testing ${endpoint}:`, error);
    }
  }
}

if (require.main === module) {
  testUpgradedApiAccess()
    .then(() => {
      console.log('\n✅ API testing complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ API testing failed:', error);
      process.exit(1);
    });
}