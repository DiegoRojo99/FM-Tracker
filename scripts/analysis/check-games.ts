import { config } from 'dotenv';
import pkg from 'pg';

config();
const { Pool } = pkg;

async function checkGames() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const result = await pool.query('SELECT id, name FROM "Game" ORDER BY id');
    console.log('🎮 Games in database:');
    result.rows.forEach(game => {
      console.log(`   ${game.id}: ${game.name}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

checkGames();