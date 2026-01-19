import { Country } from '../../../src/lib/types/Country&Competition.d';

export async function migrateCountries(firestore: any, pool: any) {
  console.log('🌍 Fetching countries from Firebase...');
  
  try {
    const countriesSnapshot = await firestore.collection('countries').get();
    console.log(`📦 Found ${countriesSnapshot.size} countries to migrate`);
    
    let migratedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const doc of countriesSnapshot.docs) {
      const data = doc.data() as Omit<Country, 'code'>;
      const country: Country = {
        code: doc.id, // Use Firebase document ID as country code
        ...data,
      };

      try {
        // Upsert country using raw SQL
        const result = await pool.query(`
          INSERT INTO "Country" (code, name, flag, "inFootballManager", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            flag = EXCLUDED.flag,
            "inFootballManager" = EXCLUDED."inFootballManager",
            "updatedAt" = EXCLUDED."updatedAt"
          RETURNING (xmax = 0) as is_insert;
        `, [
          country.code,
          country.name,
          country.flag,
          country.inFootballManager,
          new Date(),
          new Date()
        ]);

        const isInsert = result.rows[0]?.is_insert;
        if (isInsert) {
          migratedCount++;
          console.log(`✅ Created country: ${country.name} (${country.code})`);
        } else {
          updatedCount++;
          console.log(`🔄 Updated country: ${country.name} (${country.code})`);
        }

      } catch (error: any) {
        errorCount++;
        console.error(`❌ Failed to migrate country ${country.code}:`, error.message);
      }
    }

    console.log(`   ✅ ${migratedCount} countries created`);
    console.log(`   🔄 ${updatedCount} countries updated`);
    if (errorCount > 0) {
      console.log(`   ❌ ${errorCount} errors`);
    }

    return { migratedCount, updatedCount, errorCount };

  } catch (error) {
    console.error('💥 Countries migration failed:', error);
    throw error;
  }
}