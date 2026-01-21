import { Team } from '../../../src/lib/types/Team.d';

export async function migrateTeams(firestore: any, pool: any) {
  console.log('⚽ Fetching teams from Firebase...');
  
  // Country name to code mapping for teams with full country names
  const countryNameMapping: { [key: string]: string } = {
    'Argentina': 'AR',
    'Belarus': 'BY',
    'Bulgaria': 'BG',
    'Cape-Verde-Islands': 'CV',
    'Central-African-Republic': 'CF',
    'Chad': 'TD',
    'China': 'CN',
    'Comoros': 'KM',
    'Croatia': 'HR',
    'Czech-Republic': 'CZ',
    'Djibouti': 'DJ',
    'Egypt': 'EG',
    'Equatorial-Guinea': 'GQ',
    'Eritrea': 'ER',
    'Guinea-Bissau': 'GW',
    'Ireland': 'IE',
    'Korea': 'KR',
    'Latvia': 'LV',
    'Liechtenstein': 'LI',
    'Madagascar': 'MG',
    'Martinique': 'MQ',
    'Mexico': 'MX',
    'Mozambique': 'MZ',
    'Netherlands': 'NL',
    'Niger': 'NE',
    'Northern-Ireland': 'GB-NIR',
    'Norway': 'NO',
    'Poland': 'PL',
    'Portugal': 'PT',
    'Saint-Kitts-and-Nevis': 'KN',
    'Seychelles': 'SC',
    'Sierra-Leone': 'SL',
    'Slovenia': 'SI',
    'South-Africa': 'ZA',
    'South-Korea': 'KR',
    'Spain': 'ES',
    'Switzerland': 'CH',
    'São-Tomé-e-Príncipe': 'ST',
    'UAE': 'AE',
    'United-Arab-Emirates': 'AE',
    'Wales': 'GB-WLS'
  };
  
  try {
    const teamsSnapshot = await firestore.collection('teams').get();
    console.log(`📦 Found ${teamsSnapshot.size} teams to migrate`);
    
    let migratedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    let mappedCount = 0;
    const missingCountries = new Set<string>();
    const nullCountryTeams: string[] = [];

    for (const doc of teamsSnapshot.docs) {
      const data = doc.data();
      
      // Extract team data from Firebase format
      let countryCode = data.countryCode;
      
      // Try to map country name to code if needed
      if (countryCode && countryNameMapping[countryCode]) {
        countryCode = countryNameMapping[countryCode];
        mappedCount++;
      }
      
      const team = {
        id: data.id,
        name: data.name,
        logo: data.logo,
        national: data.national,
        countryCode: countryCode,
        coordinates: data.coordinates,
        isFemale: data.isFemale || null
      };

      try {
        // Handle null countryCode - skip teams without country
        if (!team.countryCode) {
          skippedCount++;
          nullCountryTeams.push(team.name);
          continue;
        }

        // Check if country exists
        const countryExists = await pool.query(`
          SELECT code FROM "Country" WHERE code = $1
        `, [team.countryCode]);
        
        if (countryExists.rows.length === 0) {
          skippedCount++;
          missingCountries.add(team.countryCode);
          continue;
        }

        // Upsert team using raw SQL
        const result = await pool.query(`
          INSERT INTO "Team" (id, name, logo, national, "countryCode", lat, lng, "isFemale")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            logo = EXCLUDED.logo,
            national = EXCLUDED.national,
            "countryCode" = EXCLUDED."countryCode",
            lat = EXCLUDED.lat,
            lng = EXCLUDED.lng,
            "isFemale" = EXCLUDED."isFemale"
          RETURNING (xmax = 0) as is_insert;
        `, [
          team.id,
          team.name,
          team.logo || '/default-team-logo.png',
          team.national,
          team.countryCode,
          team.coordinates?.lat || null,
          team.coordinates?.lng || null,
          team.isFemale
        ]);

        const isInsert = result.rows[0]?.is_insert;
        if (isInsert) {
          migratedCount++;
          if (migratedCount % 100 === 0 || team.national) {
            console.log(`✅ Created: ${team.name} (${team.countryCode})`);
          }
        } else {
          updatedCount++;
          if (updatedCount % 100 === 0 || team.national) {
            console.log(`🔄 Updated: ${team.name} (${team.countryCode})`);
          }
        }

      } catch (error: any) {
        errorCount++;
        console.error(`❌ Failed to migrate team ${team.id}: ${error.message}`);
      }
    }

    console.log(`   ✅ ${migratedCount} teams created`);
    console.log(`   🔄 ${updatedCount} teams updated`);
    console.log(`   🗺️  ${mappedCount} teams had country names mapped to codes`);
    console.log(`   ⚠️  ${skippedCount} teams skipped (missing/invalid country)`);
    if (errorCount > 0) {
      console.log(`   ❌ ${errorCount} errors`);
    }

    // Log missing countries for analysis
    if (missingCountries.size > 0) {
      console.log(`\n📊 Still missing country codes (${missingCountries.size}):`);
      Array.from(missingCountries).sort().forEach(code => {
        console.log(`   - ${code}`);
      });
    }

    if (nullCountryTeams.length > 0) {
      console.log(`\n🚫 Teams with no country code (${nullCountryTeams.length}):`);
      nullCountryTeams.slice(0, 10).forEach(name => {
        console.log(`   - ${name}`);
      });
      if (nullCountryTeams.length > 10) {
        console.log(`   ... and ${nullCountryTeams.length - 10} more`);
      }
    }

    return { migratedCount, updatedCount, errorCount, skippedCount };

  } catch (error) {
    console.error('💥 Teams migration failed:', error);
    throw error;
  }
}