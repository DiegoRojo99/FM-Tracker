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
    // First, get existing team IDs from PostgreSQL
    console.log('📊 Checking existing teams in PostgreSQL...');
    const existingTeamsResult = await pool.query('SELECT id FROM "Team"');
    const existingTeamIds = new Set(existingTeamsResult.rows.map((row: any) => row.id));
    console.log(`   Found ${existingTeamIds.size} existing teams in PostgreSQL`);
    
    const teamsSnapshot = await firestore.collection('teams').get();
    console.log(`📦 Found ${teamsSnapshot.size} teams in Firebase`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let alreadyExistsCount = 0;
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
        // Skip if team already exists in PostgreSQL
        if (existingTeamIds.has(team.id)) {
          alreadyExistsCount++;
          continue;
        }

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

        // Insert new team (no need for upsert since we already checked)
        await pool.query(`
          INSERT INTO "Team" (id, name, logo, national, "countryCode", lat, lng, "isFemale")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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

        migratedCount++;
        if (migratedCount % 100 === 0 || team.national) {
          console.log(`✅ Created: ${team.name} (${team.countryCode})`);
        }

      } catch (error: any) {
        console.error(`❌ Failed to migrate team ${team.id}: ${error.message}`);
      }
    }

    console.log(`   ✅ ${migratedCount} teams created`);
    console.log(`   ⏭️  ${alreadyExistsCount} teams already exist (skipped)`);
    if (mappedCount > 0) {
      console.log(`   🗺️  ${mappedCount} teams had country names mapped to codes`);
    }
    console.log(`   ⚠️  ${skippedCount} teams skipped (missing/invalid country)`);

    // Log missing countries for analysis
    if (missingCountries.size > 0) {
      console.log(`\n📊 Still missing country codes (${missingCountries.size}):`);
      Array.from(missingCountries).sort().forEach(code => {
        console.log(`   - ${code}`);
      });
    }

    if (nullCountryTeams.length > 0 && nullCountryTeams.length < 20) {
      console.log(`\n🚫 Teams with no country code (${nullCountryTeams.length}):`);
      nullCountryTeams.forEach(name => {
        console.log(`   - ${name}`);
      });
    } else if (nullCountryTeams.length > 0) {
      console.log(`\n🚫 ${nullCountryTeams.length} teams with no country code`);
    }

    return { migratedCount, updatedCount: 0, errorCount: 0, skippedCount, alreadyExistsCount };

  } catch (error) {
    console.error('💥 Teams migration failed:', error);
    throw error;
  }
}