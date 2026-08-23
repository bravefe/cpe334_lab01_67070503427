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
      create: { name, isActive: true },
    });
  }

  const systems = [
    "Email",
    "Campus Wi-Fi",
    "VPN",
    "LEB2 App",
    "Grade Submission App",
    "Printer",
    "Corporate Laptop",
  ];
  for (const name of systems) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: {},
      create: { name, isActive: true },
    });
  }

  const priorities = [
    { name: "High", sortOrder: 3 },
    { name: "Medium", sortOrder: 2 },
    { name: "Low", sortOrder: 1 },
  ];
  for (const priority of priorities) {
    await prisma.priority.upsert({
      where: { name: priority.name },
      update: { sortOrder: priority.sortOrder },
      create: priority,
    });
  }

  const statuses = [
    { name: "New", isDefault: true },
    { name: "Open", isDefault: false },
    { name: "In Progress", isDefault: false },
    { name: "Pending", isDefault: false },
  ];
  for (const status of statuses) {
    await prisma.status.upsert({
      where: { name: status.name },
      update: { isDefault: status.isDefault },
      create: status,
    });
  }

  const requesters = [
    ["Frodo Baggins", "frodo.b@shiremail.example.com"],
    ["Samwise Gamgee", "sam.gamgee@shiremail.example.com"],
    ["Aragorn Elessar", "a.elessar@gondor.example.com"],
    ["Legolas Greenleaf", "legolasg@woodland.example.com"],
    ["Gimli Oakenshield", "gimli.o@erebor.example.com"],
    ["Boromir Gondor", "boromir@gondor.example.com"],
    ["Meriadoc Brandybuck", "merry.b@shiremail.example.com"],
    ["Peregrin Took", "pippin.t@shiremail.example.com"],
    ["Galadriel Lothlórien", "galadriel@lothlorien.example.com"],
    ["Éowyn Rohan", "eowyn.r@rohan.example.com"],
    ["Gandalf the Grey", "gandalf@istari.example.com"],
    ["Gollum", "smeagol@goblinmail.example.com"],
  ];

  for (const [fullName, email] of requesters) {
    await prisma.devRequester.upsert({
      where: { email },
      update: { fullName, isActive: true },
      create: { fullName, email, isActive: true },
    });
  }

  const [newStatus, lowPriority] = await Promise.all([
    prisma.status.findUniqueOrThrow({ where: { name: "New" } }),
    prisma.priority.findUniqueOrThrow({ where: { name: "Low" } }),
  ]);

  const requesterRows = await prisma.devRequester.findMany({
    where: { email: { in: requesters.map(([, email]) => email) } },
    orderBy: { id: "asc" },
  });

  const categoryRows = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { id: "asc" },
  });

  const systemRows = await prisma.relatedSystem.findMany({
    where: { isActive: true },
    orderBy: { id: "asc" },
  });

  const statusRows = await prisma.status.findMany({
    orderBy: { id: "asc" },
  });

  const priorityRows = await prisma.priority.findMany({
    orderBy: { sortOrder: "desc" },
  });

  for (let index = 0; index < 10; index += 1) {
    const ticketNumberTemp = index + 1;
    const ticketNumber = `TKT-2026-${String(ticketNumberTemp).padStart(6, "0")}`;

    const requester =
      requesterRows[Math.floor(Math.random() * requesterRows.length)];
    const category =
      categoryRows[Math.floor(Math.random() * categoryRows.length)];
    const system =
      systemRows[Math.floor(Math.random() * systemRows.length)];
    const priority =
      priorityRows[Math.floor(Math.random() * priorityRows.length)];
    const status =
      statusRows[Math.floor(Math.random() * statusRows.length)];

    const ticketData = {
      requesterId: requester.id,
      categoryId: category.id,
      relatedSystemId: system.id,
      summary: `Issue with ${system.name}`,
      description: `Requester reported an issue related to ${category.name.toLowerCase()} for ${system.name}.`,
      requestedPriorityId: priority.id,
      currentStatusId: status.id,
      ownerId: null,
    };

    await prisma.ticket.upsert({
      where: { ticketNumber },
      update: { ...ticketData, itPriorityId: null },
      create: { ticketNumber, ...ticketData },
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
