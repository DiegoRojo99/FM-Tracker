import { rateLimiter } from '../../lib/utils/rateLimiter';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

// Quick API test after setting the key
async function testApiKey() {
  console.log('🔍 Testing API key connection...');
  console.log('Current API_FOOTBALL_KEY:', process.env.API_FOOTBALL_KEY ? process.env.API_FOOTBALL_KEY.slice(0, 8) + '...' : 'undefined');
  
  const API_KEY = process.env.API_FOOTBALL_KEY;
  console.log('🔍 Testing API key connection...')
  console.log('Current API_FOOTBALL_KEY:', API_KEY);
  
  if (!API_KEY) {
    console.error('❌ API_FOOTBALL_KEY is still not set!');
    console.log('Please set your API key in .env.local file');
    return;
  }
  
  console.log('✅ API key found:', API_KEY.slice(0, 8) + '...');
  
  try {
    await rateLimiter.waitIfNeeded();
    
    const res = await fetch('https://v3.football.api-sports.io/status', {
      headers: {
        'x-apisports-key': API_KEY,
      },
    });
    
    rateLimiter.recordCall();
    
    const data = await res.json();
    
    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error('❌ API Errors:', data.errors);
    } else {
      console.log('✅ API connection successful!');
      console.log('Account info:', data.response);
    }
    
    // Test a simple data call
    console.log('\n🔍 Testing data access...');
    await rateLimiter.waitIfNeeded();
    
    const testRes = await fetch('https://v3.football.api-sports.io/teams?league=39&season=2024', {
      headers: {
        'x-apisports-key': API_KEY,
      },
    });
    
    rateLimiter.recordCall();
    const testData = await testRes.json();
    
    if (testData.response && testData.response.length > 0) {
      console.log(`✅ Data access working: ${testData.response.length} teams found`);
    } else {
      console.log('❌ No data returned:', testData);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

if (require.main === module) {
  testApiKey()
    .then(() => {
      console.log('\n✅ API key test complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ API key test failed:', error);
      process.exit(1);
    });
}