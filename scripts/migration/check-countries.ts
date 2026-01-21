import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function checkCountries() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const result = await pool.query('SELECT code, name FROM "Country" ORDER BY name');
    console.log('Available countries in database:');
    result.rows.forEach(row => {
      console.log(`  ${row.code}: ${row.name}`);
    });
    
    console.log(`\nTotal countries: ${result.rows.length}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkCountries();