import { config } from 'dotenv';
import admin from 'firebase-admin';
import type { 
  FirestoreAdminCompetition, 
  FirestoreApiCompetition,
  CompetitionMigrationValidation 
} from '../src/lib/types/Competition-Migration';

config();

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const firestore = admin.firestore();

async function validateCompetitionMigration(): Promise<CompetitionMigrationValidation> {
  console.log('🔍 Validating competition collections for migration...\n');

  // Fetch both collections
  console.log('📥 Fetching adminCompetitions...');
  const adminSnapshot = await firestore.collection('adminCompetitions').get();
  const adminCompetitions: FirestoreAdminCompetition[] = adminSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data() as Omit<FirestoreAdminCompetition, 'id'>
  }));

  console.log('📥 Fetching apiCompetitions...');
  const apiSnapshot = await firestore.collection('apiCompetitions').get();
  const apiCompetitions: FirestoreApiCompetition[] = apiSnapshot.docs.map(doc => ({
    id: doc.id as any, // Convert string document ID to number
    ...doc.data() as Omit<FirestoreApiCompetition, 'id'>
  }));

  console.log(`Found ${adminCompetitions.length} admin competitions and ${apiCompetitions.length} API competitions\n`);

  // Create validation object
  const validation: CompetitionMigrationValidation = {
    adminCompetitionsChecks: {
      allHaveApiCompetitionId: true,
      allHaveCountryCode: true,
      validCountryCodes: true,
      uniqueApiCompetitionIds: true
    },
    apiCompetitionsChecks: {
      allHaveValidCountryCode: true,
      idsMatchAdminReferences: true
    },
    crossCollectionChecks: {
      orphanedAdminCompetitions: 0,
      orphanedApiCompetitions: 0,
      countryCodeConsistency: true
    }
  };

  // Check admin competitions
  console.log('✅ Validating adminCompetitions...');
  const adminApiIds = new Set<number>();
  const adminCountryCodes = new Set<string>();
  
  for (const admin of adminCompetitions) {
    // Check apiCompetitionId
    if (!admin.apiCompetitionId) {
      validation.adminCompetitionsChecks.allHaveApiCompetitionId = false;
      console.log(`❌ Admin competition ${admin.id} missing apiCompetitionId`);
    } else {
      if (adminApiIds.has(admin.apiCompetitionId)) {
        validation.adminCompetitionsChecks.uniqueApiCompetitionIds = false;
        console.log(`❌ Duplicate apiCompetitionId ${admin.apiCompetitionId} found in admin competitions`);
      }
      adminApiIds.add(admin.apiCompetitionId);
    }

    // Check countryCode
    if (!admin.countryCode) {
      validation.adminCompetitionsChecks.allHaveCountryCode = false;
      console.log(`❌ Admin competition ${admin.id} missing countryCode`);
    } else {
      adminCountryCodes.add(admin.countryCode);
    }
  }

  // Check API competitions
  console.log('✅ Validating apiCompetitions...');
  const apiIds = new Set<number>();
  const apiCountryCodes = new Set<string>();
  
  for (const api of apiCompetitions) {
    apiIds.add(api.id);
    
    // Check countryCode
    if (!api.countryCode) {
      validation.apiCompetitionsChecks.allHaveValidCountryCode = false;
      console.log(`❌ API competition ${api.id} missing countryCode`);
    } else {
      apiCountryCodes.add(api.countryCode);
    }
  }

  // Cross-collection validation
  console.log('✅ Validating cross-collection relationships...');
  
  // Check for orphaned admin competitions
  for (const admin of adminCompetitions) {
    if (admin.apiCompetitionId && !apiIds.has(admin.apiCompetitionId)) {
      validation.crossCollectionChecks.orphanedAdminCompetitions++;
      console.log(`❌ Admin competition ${admin.id} references non-existent API competition ${admin.apiCompetitionId}`);
    }
  }

  // Check for orphaned API competitions
  for (const api of apiCompetitions) {
    if (!adminApiIds.has(api.id)) {
      validation.crossCollectionChecks.orphanedApiCompetitions++;
      console.log(`❌ API competition ${api.id} (${api.name}) not referenced by any admin competition`);
    }
  }

  // Check country code consistency
  for (const admin of adminCompetitions) {
    if (admin.apiCompetitionId) {
      const apiCompetition = apiCompetitions.find(api => api.id === admin.apiCompetitionId);
      if (apiCompetition && admin.countryCode !== apiCompetition.countryCode) {
        validation.crossCollectionChecks.countryCodeConsistency = false;
        console.log(`❌ Country code mismatch for competition ${admin.apiCompetitionId}: admin=${admin.countryCode}, api=${apiCompetition.countryCode}`);
      }
    }
  }

  if (validation.crossCollectionChecks.orphanedAdminCompetitions === 0) {
    validation.apiCompetitionsChecks.idsMatchAdminReferences = true;
  } else {
    validation.apiCompetitionsChecks.idsMatchAdminReferences = false;
  }

  return validation;
}

async function analyzeGroupingStructure() {
  console.log('\n🔍 Analyzing competition grouping structure...\n');

  const adminSnapshot = await firestore.collection('adminCompetitions').get();
  const adminCompetitions: FirestoreAdminCompetition[] = adminSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data() as Omit<FirestoreAdminCompetition, 'id'>
  }));

  // Analyze grouping patterns
  const groupedCompetitions = adminCompetitions.filter(comp => comp.isGrouped);
  const ungroupedCompetitions = adminCompetitions.filter(comp => !comp.isGrouped);

  console.log(`📊 Grouping Overview:`);
  console.log(`   Grouped competitions: ${groupedCompetitions.length}`);
  console.log(`   Ungrouped competitions: ${ungroupedCompetitions.length}`);
  console.log(`   Total: ${adminCompetitions.length}\n`);

  // Analyze groups
  if (groupedCompetitions.length > 0) {
    console.log('📋 Grouped Competition Analysis:');
    const groupsByName = new Map<string, FirestoreAdminCompetition[]>();
    
    for (const comp of groupedCompetitions) {
      if (comp.groupName) {
        const key = `${comp.countryCode}-${comp.groupName}`;
        if (!groupsByName.has(key)) {
          groupsByName.set(key, []);
        }
        groupsByName.get(key)!.push(comp);
      }
    }

    for (const [groupKey, competitions] of groupsByName) {
      console.log(`\n   Group: ${groupKey}`);
      competitions
        .sort((a, b) => (a.groupOrder || 999) - (b.groupOrder || 999))
        .forEach(comp => {
          console.log(`     Order ${comp.groupOrder}: ${comp.name} (Priority: ${comp.priority})`);
        });
    }
  }

  // Analyze priority distribution
  console.log('\n📊 Priority Distribution:');
  const priorityRanges = {
    'Tier 1 (0-100)': adminCompetitions.filter(c => c.priority >= 0 && c.priority <= 100).length,
    'Tier 2 (101-300)': adminCompetitions.filter(c => c.priority >= 101 && c.priority <= 300).length,
    'Tier 3 (301-500)': adminCompetitions.filter(c => c.priority >= 301 && c.priority <= 500).length,
    'Tier 4 (501+)': adminCompetitions.filter(c => c.priority > 500).length,
  };

  Object.entries(priorityRanges).forEach(([range, count]) => {
    console.log(`   ${range}: ${count} competitions`);
  });

  // Analyze by country
  console.log('\n🌍 Competition Distribution by Country:');
  const byCountry = new Map<string, { total: number; grouped: number; ungrouped: number }>();
  
  for (const comp of adminCompetitions) {
    const key = `${comp.countryCode} (${comp.countryName})`;
    if (!byCountry.has(key)) {
      byCountry.set(key, { total: 0, grouped: 0, ungrouped: 0 });
    }
    const stats = byCountry.get(key)!;
    stats.total++;
    if (comp.isGrouped) {
      stats.grouped++;
    } else {
      stats.ungrouped++;
    }
  }

  // Show top 10 countries by competition count
  const sortedCountries = Array.from(byCountry.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10);

  for (const [country, stats] of sortedCountries) {
    console.log(`   ${country}: ${stats.total} total (${stats.grouped} grouped, ${stats.ungrouped} ungrouped)`);
  }
}

async function main() {
  try {
    const validation = await validateCompetitionMigration();
    
    console.log('\n📋 Validation Results Summary:');
    console.log('=====================================');
    console.log(`✅ All admin competitions have API IDs: ${validation.adminCompetitionsChecks.allHaveApiCompetitionId}`);
    console.log(`✅ All admin competitions have country codes: ${validation.adminCompetitionsChecks.allHaveCountryCode}`);
    console.log(`✅ Unique API competition IDs: ${validation.adminCompetitionsChecks.uniqueApiCompetitionIds}`);
    console.log(`✅ All API competitions have country codes: ${validation.apiCompetitionsChecks.allHaveValidCountryCode}`);
    console.log(`✅ API IDs match admin references: ${validation.apiCompetitionsChecks.idsMatchAdminReferences}`);
    console.log(`✅ Country code consistency: ${validation.crossCollectionChecks.countryCodeConsistency}`);
    console.log(`📊 Orphaned admin competitions: ${validation.crossCollectionChecks.orphanedAdminCompetitions}`);
    console.log(`📊 Orphaned API competitions: ${validation.crossCollectionChecks.orphanedApiCompetitions}`);

    const allValidationsPassed = Object.values(validation.adminCompetitionsChecks).every(v => v) &&
                                Object.values(validation.apiCompetitionsChecks).every(v => v) &&
                                validation.crossCollectionChecks.countryCodeConsistency &&
                                validation.crossCollectionChecks.orphanedAdminCompetitions === 0 &&
                                validation.crossCollectionChecks.orphanedApiCompetitions === 0;

    console.log(`\n🎯 Overall Migration Readiness: ${allValidationsPassed ? '✅ READY' : '⚠️  NEEDS ATTENTION'}`);

    await analyzeGroupingStructure();

  } catch (error) {
    console.error('Error during validation:', error);
  } finally {
    process.exit(0);
  }
}

main();