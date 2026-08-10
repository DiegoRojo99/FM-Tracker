import { loadNodeEnv } from '../../src/lib/env/loadNodeEnv';
loadNodeEnv();

async function run() {
  const { prisma } = await import('../../src/lib/db/prisma');

  const totalRelations = await prisma.promotionRelegation.count();
  console.log(`PromotionRelegation rows: ${totalRelations}`);

  if (totalRelations === 0) {
    console.log('No promotion/relegation chain data — cannot infer tiers automatically.');
    await prisma.$disconnect();
    return;
  }

  // Build adjacency: fromGroupId -> toGroupId (lower -> higher tier)
  const relations = await prisma.promotionRelegation.findMany({
    select: { fromGroupId: true, toGroupId: true },
  });

  const toGroupIds = new Set(relations.map(r => r.toGroupId));
  const fromGroupIds = new Set(relations.map(r => r.fromGroupId));

  // Tier 1: appears as toGroup (receives promotions) but never as fromGroup (nothing above it)
  const tier1Ids = [...toGroupIds].filter(id => !fromGroupIds.has(id));
  console.log(`Tier-1 candidates: ${tier1Ids.length}`);

  // BFS downward to assign tiers 2, 3, ...
  const tierMap = new Map<number, number>(tier1Ids.map(id => [id, 1]));
  const queue = [...tier1Ids];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentTier = tierMap.get(current)!;
    const below = relations.filter(r => r.toGroupId === current);
    for (const rel of below) {
      if (!tierMap.has(rel.fromGroupId)) {
        tierMap.set(rel.fromGroupId, currentTier + 1);
        queue.push(rel.fromGroupId);
      }
    }
  }

  console.log(`\nTier assignments computed: ${tierMap.size}`);
  for (const [tier, count] of [...new Map([...tierMap.values()].reduce((m, t) => { m.set(t, (m.get(t) ?? 0) + 1); return m; }, new Map<number, number>())).entries()].sort())
    console.log(`  Tier ${tier}: ${count} competition(s)`);

  // Update in batches
  let updated = 0;
  for (const [id, tier] of tierMap.entries()) {
    await prisma.competitionGroup.update({ where: { id }, data: { tier } });
    updated++;
  }

  console.log(`\nUpdated ${updated} competitions with tier data.`);
  await prisma.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
