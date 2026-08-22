import { getPrisma } from "../src/prisma.js";

async function main() {
  const prisma = getPrisma();
  const categories = [
    "Account and Access",
    "Hardware",
    "Software",
    "Network",
  ];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  for (const name of ["High", "Medium", "Low"]) {
    await prisma.priority.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  for (const name of ["Open", "In Progress", "Pending", "Resolved"]) {
    await prisma.status.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const employees = [
    ["EMP-001", "Sarah Connor"],
    ["EMP-002", "John Doe"],
    ["EMP-003", "Jane Smith"],
    ["EMP-004", "Alice Johnson"],
    ["EMP-005", "Robert Chen"],
    ["EMP-006", "Emily Davis"],
    ["EMP-007", "Michael Brown"],
    ["EMP-008", "David Wilson"],
    ["EMP-009", "Sophia Martinez"],
    ["EMP-010", "James Taylor"],
  ] as const;

  for (const [code, name] of employees) {
    await prisma.employee.upsert({
      where: { code },
      update: { name },
      create: { code, name },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
