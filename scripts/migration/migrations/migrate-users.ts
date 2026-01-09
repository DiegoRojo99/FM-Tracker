import { User } from "@/lib/types/User";

export async function migrateUsers(firestore: any, pool: any) {
  console.log('🔥 Fetching users from Firebase...');
  
  try {
    const usersSnapshot = await firestore.collection('users').get();
    console.log(`📦 Found ${usersSnapshot.size} users to migrate`);
    
    let migratedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const doc of usersSnapshot.docs) {
      const data = doc.data() as Omit<User, 'uid'>;
      const user: User = {
        uid: doc.id,
        ...data,
      };

      try {
        const createdAt = user.createdAt?.toDate?.() || new Date();
        
        // Upsert user using raw SQL
        const result = await pool.query(`
          INSERT INTO "User" (uid, email, "displayName", "createdAt", "updatedAt", "avatarURL")
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (uid) DO UPDATE SET
            email = EXCLUDED.email,
            "displayName" = EXCLUDED."displayName",
            "avatarURL" = EXCLUDED."avatarURL",
            "updatedAt" = EXCLUDED."updatedAt"
          RETURNING (xmax = 0) as is_insert;
        `, [
          user.uid,
          user.email,
          user.displayName,
          createdAt,
          new Date(),
          user.avatarURL || null
        ]);

        const isInsert = result.rows[0]?.is_insert;
        if (isInsert) {
          migratedCount++;
          console.log(`✅ Created user: ${user.email}`);
        } else {
          updatedCount++;
          console.log(`🔄 Updated user: ${user.email}`);
        }

      } catch (error: any) {
        errorCount++;
        console.error(`❌ Failed to migrate user ${user.uid}:`, error.message);
      }
    }

    console.log(`   ✅ ${migratedCount} users created`);
    console.log(`   🔄 ${updatedCount} users updated`);
    if (errorCount > 0) {
      console.log(`   ❌ ${errorCount} errors`);
    }

    return { migratedCount, updatedCount, errorCount };

  } catch (error) {
    console.error('💥 User migration failed:', error);
    throw error;
  }
}