export type FirebaseCountry = {
  code: string;              // e.g., "DE"
  name: string;              // e.g., "Germany"
  flag: string;              // URL to flag image
  inFootballManager: boolean;
};

export async function migrateCountries(firestore: any, pool: any) {
  console.log('🌍 Fetching countries from Firebase...');
  
  try {
    const countriesSnapshot = await firestore.collection('countries').get();
    console.log(`📦 Found ${countriesSnapshot.size} countries to migrate`);
    
    // Get existing countries from database
    console.log('📋 Checking existing countries in PostgreSQL...');
    const existingCountriesResult = await pool.query('SELECT code FROM "Country"');
    const existingCodes = new Set(existingCountriesResult.rows.map((row: any) => row.code));
    console.log(`   Found ${existingCodes.size} existing countries in PostgreSQL`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const doc of countriesSnapshot.docs) {
      const data = doc.data() as Omit<FirebaseCountry, 'code'>;
      const country: FirebaseCountry = {
        code: doc.id, // Use Firebase document ID as country code
        ...data,
      };

      try {
        // Skip if country already exists
        if (existingCodes.has(country.code)) {
          skippedCount++;
          continue;
        }

        // Insert new country
        await pool.query(`
          INSERT INTO "Country" (code, name, flag, "inFootballManager", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          country.code,
          country.name,
          country.flag,
          country.inFootballManager,
          new Date(),
          new Date()
        ]);

        migratedCount++;
        console.log(`✅ Created country: ${country.name} (${country.code})`);

      } catch (error: any) {
        errorCount++;
        console.error(`❌ Failed to migrate country ${country.code}:`, error.message);
      }
    }

    console.log(`   ✅ ${migratedCount} countries created`);
    console.log(`   ⏭️  ${skippedCount} countries already exist (skipped)`);
    if (errorCount > 0) {
      console.log(`   ❌ ${errorCount} errors`);
    }

    return { migratedCount, skippedCount, errorCount };

  } catch (error) {
    console.error('💥 Countries migration failed:', error);
    throw error;
  }
}