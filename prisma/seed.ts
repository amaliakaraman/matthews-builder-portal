import { PrismaClient, AudienceType, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed: departments + sponsors + a starter set of users (PX admin, sponsors,
 * a couple of builders). All values are PRD-aligned but flagged as defaults
 * to be confirmed by Matthews per PRD §11.
 */
async function main() {
  console.log("Seeding Builder Portal…");

  // Departments — PRD §2.3 explicit names + reasonable extras (PRD §11 Q5)
  const deptSeeds = [
    { name: "Marketing", coreJobsDescription: "External brand and deal collateral." },
    { name: "Legal", coreJobsDescription: "Contracts, documents, legal agreements." },
    { name: "Finance", coreJobsDescription: "Performance data, reporting, metrics." },
    { name: "Sales Operations", coreJobsDescription: "Deal flow, sales process tooling." },
    { name: "Underwriting", coreJobsDescription: "Deal evaluation, financial modelling." },
    { name: "Operations", coreJobsDescription: "Internal operations, IT, facilities." },
    { name: "Platform Experience", coreJobsDescription: "PX, the Citizen Builder Program itself." },
  ];

  const depts: Record<string, string> = {};
  for (const d of deptSeeds) {
    const created = await prisma.department.upsert({
      where: { name: d.name },
      update: { coreJobsDescription: d.coreJobsDescription },
      create: d,
    });
    depts[d.name] = created.id;
  }

  // PX admin
  const pxAdmin = await prisma.user.upsert({
    where: { email: "px-admin@matthews.test" },
    update: {},
    create: {
      email: "px-admin@matthews.test",
      name: "Pat Lopez (PX Admin)",
      role: UserRole.px_admin,
      departmentId: depts["Platform Experience"],
    },
  });

  // Sponsor users — one per audience type (PRD §11 Q1 default placeholder)
  const sponsorSeeds: Array<{
    email: string;
    name: string;
    audience: AudienceType;
  }> = [
    { email: "sponsor-agents@matthews.test", name: "Avery Reyes", audience: AudienceType.agents },
    { email: "sponsor-market-leaders@matthews.test", name: "Morgan Chen", audience: AudienceType.market_leaders },
    { email: "sponsor-finance@matthews.test", name: "Rivka Patel", audience: AudienceType.financiers },
    { email: "sponsor-marketers@matthews.test", name: "Devon Brooks", audience: AudienceType.marketers },
    { email: "sponsor-sales-ops@matthews.test", name: "Sam Okafor", audience: AudienceType.sales_ops },
  ];

  for (const s of sponsorSeeds) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        name: s.name,
        role: UserRole.sponsor,
      },
    });
    await prisma.sponsor.upsert({
      where: { userId: user.id },
      update: { audienceType: s.audience, isActive: true },
      create: {
        userId: user.id,
        audienceType: s.audience,
        isActive: true,
      },
    });
  }

  // A couple of builders
  await prisma.user.upsert({
    where: { email: "builder-marketing@matthews.test" },
    update: {},
    create: {
      email: "builder-marketing@matthews.test",
      name: "Jamie Wells",
      role: UserRole.builder,
      departmentId: depts["Marketing"],
    },
  });

  await prisma.user.upsert({
    where: { email: "builder-finance@matthews.test" },
    update: {},
    create: {
      email: "builder-finance@matthews.test",
      name: "Casey Tran",
      role: UserRole.builder,
      departmentId: depts["Finance"],
    },
  });

  console.log(`PX admin: ${pxAdmin.email}`);
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
