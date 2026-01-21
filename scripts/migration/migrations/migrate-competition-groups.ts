import { Pool } from 'pg';
import admin from 'firebase-admin';
import type { FirestoreAdminCompetition } from '../../src/lib/types/Competition-Migration';

interface CompetitionGroupData {
  name: string;
  displayName: string;
  countryCode: string;
  type: string;
  tier: number | null;
  logoUrl: string | null;
  isActive: boolean;
  adminCompetitions: FirestoreAdminCompetition[];
}

export async function migrateCompetitionGroups(firestore: any, pool: Pool): Promise<void> {
  console.log('\n🏆 Starting CompetitionGroup migration...');
  
  try {
    // Fetch all adminCompetitions from Firestore
    console.log('📥 Fetching adminCompetitions from Firestore...');
    const snapshot = await firestore.collection('adminCompetitions').get();
    const adminCompetitions: FirestoreAdminCompetition[] = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Found ${adminCompetitions.length} admin competitions to process`);

    if (adminCompetitions.length === 0) {
      console.log('⏭️  No admin competitions found, skipping migration');
      return;
    }

    // Process competitions into groups
    console.log('🔄 Processing competition grouping logic...');
    const competitionGroups = processCompetitionGrouping(adminCompetitions);

    console.log(`📊 Processed ${adminCompetitions.length} competitions into ${competitionGroups.length} groups:`);
    console.log(`   🔗 Grouped competitions: ${adminCompetitions.filter(c => c.isGrouped).length}`);
    console.log(`   🔸 Individual competitions: ${adminCompetitions.filter(c => !c.isGrouped).length}`);

    // Check how many groups already exist
    const existingCheck = await pool.query(
      'SELECT id, name, "countryCode", type FROM "CompetitionGroup" ORDER BY id'
    );
    const existingGroupKeys = new Set(
      existingCheck.rows.map(row => `${row.countryCode}-${row.name}-${row.type}`)
    );

    const newGroups = competitionGroups.filter(group => 
      !existingGroupKeys.has(`${group.countryCode}-${group.name}-${group.type}`)
    );

    if (newGroups.length === 0) {
      console.log(`✅ All ${competitionGroups.length} competition groups already migrated`);
      return;
    }

    console.log(`📝 Migrating ${newGroups.length} new competition groups (${existingGroupKeys.size} already exist)`);

    let successful = 0;
    let failed = 0;

    for (const group of newGroups) {
      try {
        // Check if country exists
        const countryCheck = await pool.query(
          'SELECT code FROM "Country" WHERE code = $1',
          [group.countryCode]
        );

        if (countryCheck.rows.length === 0) {
          console.log(`⚠️  Skipping group ${group.name}: country ${group.countryCode} not found`);
          failed++;
          continue;
        }

        // Get timestamp from first admin competition in the group
        const firstCompetition = group.adminCompetitions[0];
        let createdAt = new Date();
        let updatedAt = new Date();

        if (firstCompetition.createdAt) {
          if (firstCompetition.createdAt instanceof admin.firestore.Timestamp) {
            createdAt = firstCompetition.createdAt.toDate();
          } else if (typeof firstCompetition.createdAt === 'object' && '_seconds' in firstCompetition.createdAt) {
            createdAt = new Date(firstCompetition.createdAt._seconds * 1000);
          }
        }

        if (firstCompetition.lastUpdated) {
          if (firstCompetition.lastUpdated instanceof admin.firestore.Timestamp) {
            updatedAt = firstCompetition.lastUpdated.toDate();
          } else if (typeof firstCompetition.lastUpdated === 'object' && '_seconds' in firstCompetition.lastUpdated) {
            updatedAt = new Date(firstCompetition.lastUpdated._seconds * 1000);
          }
        }

        // Insert the competition group
        const result = await pool.query(`
          INSERT INTO "CompetitionGroup" (
            name, "displayName", "countryCode", type, tier, "logoUrl", "isActive", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id
        `, [
          group.name,
          group.displayName,
          group.countryCode,
          group.type,
          group.tier,
          group.logoUrl,
          group.isActive,
          createdAt,
          updatedAt
        ]);

        const groupId = result.rows[0].id;
        console.log(`✅ Created CompetitionGroup ${groupId}: ${group.displayName} (${group.adminCompetitions.length} competitions)`);
        successful++;

      } catch (error) {
        console.error(`❌ Error migrating competition group ${group.name}:`, error);
        failed++;
      }
    }

    // Final summary
    console.log(`\n✅ CompetitionGroup migration completed!`);
    console.log(`   📊 Successfully migrated: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📈 Total in database: ${existingGroupKeys.size + successful}`);

    if (failed > 0) {
      console.log(`⚠️  ${failed} groups failed to migrate - check logs above`);
    }

  } catch (error) {
    console.error('❌ Fatal error in CompetitionGroup migration:', error);
    throw error;
  }
}

function processCompetitionGrouping(adminCompetitions: FirestoreAdminCompetition[]): CompetitionGroupData[] {
  const groups = new Map<string, CompetitionGroupData>();

  for (const competition of adminCompetitions) {
    let groupKey: string;
    let groupName: string;
    let displayName: string;
    let tier: number | null = null;

    if (competition.isGrouped && competition.groupName) {
      // Grouped competition: create/find group by country + groupName + type
      groupKey = `${competition.countryCode}-${competition.groupName}-${competition.type}`;
      groupName = competition.groupName;
      displayName = competition.groupName;
      
      // For grouped competitions, tier comes from groupOrder (lower order = higher tier)
      if (competition.groupOrder !== null && competition.groupOrder !== undefined) {
        tier = Math.max(1, competition.groupOrder); // Ensure minimum tier 1
      } else {
        // Fallback to priority-based tier for grouped competitions without groupOrder
        tier = calculateTierFromPriority(competition.priority);
      }
    } else {
      // Individual competition: create unique group
      groupKey = `${competition.countryCode}-${competition.name}-${competition.type}`;
      groupName = competition.name;
      displayName = competition.displayName;
      
      // For individual competitions, tier comes from priority
      tier = calculateTierFromPriority(competition.priority);
    }

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        name: groupName,
        displayName: displayName,
        countryCode: competition.countryCode,
        type: competition.type,
        tier: tier,
        logoUrl: competition.logoUrl || null,
        isActive: competition.isVisible,
        adminCompetitions: []
      });
    }

    // Add this competition to the group
    const group = groups.get(groupKey)!;
    group.adminCompetitions.push(competition);

    // For grouped competitions, use the most representative data
    if (competition.isGrouped && group.adminCompetitions.length > 1) {
      // Update group display info if this competition has better data
      if (!group.logoUrl && competition.logoUrl) {
        group.logoUrl = competition.logoUrl;
      }
      // Keep the group active if any competition is visible
      if (competition.isVisible) {
        group.isActive = true;
      }
    }
  }

  return Array.from(groups.values());
}

function calculateTierFromPriority(priority: number): number {
  // Priority-based tier calculation as defined in the strategy
  if (priority >= 0 && priority <= 100) return 1;
  if (priority >= 101 && priority <= 300) return 2;
  if (priority >= 301 && priority <= 500) return 3;
  return 4; // 501+
}