// Quick check of environment variables
console.log('Environment check:');
console.log('API_FOOTBALL_KEY exists:', !!process.env.API_FOOTBALL_KEY);
console.log('API_FOOTBALL_KEY length:', process.env.API_FOOTBALL_KEY?.length || 0);
console.log('API_FOOTBALL_KEY first 8 chars:', process.env.API_FOOTBALL_KEY?.slice(0, 8) || 'undefined');

// List all environment variables that contain 'API' or 'FOOTBALL'
const apiVars = Object.keys(process.env).filter(key => 
  key.includes('API') || key.includes('FOOTBALL')
);
console.log('API-related environment variables:', apiVars);