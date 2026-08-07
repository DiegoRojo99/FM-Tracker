import { prisma } from '../src/lib/db/prisma';

async function main() {
  const names = ['cardiff', 'swansea', 'wrexham', 'andorra', 'ceuta', 'vaduz'];
  for (const n of names) {
    const rows = await prisma.team.findMany({
      where: { name: { contains: n, mode: 'insensitive' } },
      select: { id: true, name: true, countryCode: true },
      take: 20,
      orderBy: { id: 'asc' },
    });
    console.log(`\n## ${n} ${rows.length}`);
    for (const r of rows) console.log(r.id, r.name, r.countryCode);
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
