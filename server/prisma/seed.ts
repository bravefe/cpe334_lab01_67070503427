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

  const requesters: [string, string, boolean][] = [
    ["Frodo Baggins", "frodo.b@shiremail.example.com", true],
    ["Samwise Gamgee", "sam.gamgee@shiremail.example.com", true],
    ["Aragorn, Son of Arathorn", "a.elessar@gondor.example.com", true],
    ["Legolas Greenleaf", "legolasg@woodland.example.com", true],
    ["Gimli, Son of Glóin", "gimli.o@erebor.example.com", true],
    ["Boromir, Son of Denethor", "boromir@gondor.example.com", true],
    ["Meriadoc Brandybuck", "merry.b@shiremail.example.com", true],
    ["Peregrin Took", "pippin.t@shiremail.example.com", true],
    ["Galadriel", "galadriel@lothlorien.example.com", true],
    ["Éowyn", "eowyn.r@rohan.example.com", true],
    ["Gandalf the Grey", "gandalf@istari.example.com", false],
    ["Gollum", "smeagol@goblinmail.example.com", true],
  ];

  for (const [name, email, isActive] of requesters) {
    await prisma.devRequester.upsert({
      where: { email },
      update: { name, isActive },
      create: { name, email, isActive },
    });
  }

  const [newStatus, lowPriority] = await Promise.all([
    prisma.status.findUniqueOrThrow({ where: { name: "New" } }),
    prisma.priority.findUniqueOrThrow({ where: { name: "Low" } }),
  ]);

  const requesterRows = await prisma.devRequester.findMany({
    where: {
      id: { gte: 1, lte: 10 },
      email: { in: requesters.map(([, email]) => email) },
    },
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
  const fixedTickets = [
    {
      ticketNumber: "TKT-2026-000001",
      requesterId: 1,
      categoryId: 1,
      relatedSystemId: 1,
      summary: "Test Test 123",
      description: "Requester is unable to access their email account.",
      requestedPriorityId: 1,
      currentStatusId: 1,
    },
    {
      ticketNumber: "TKT-2026-000002",
      requesterId: 2,
      categoryId: 2,
      relatedSystemId: 2,
      summary: "Campus Wi-Fi not working",
      description: "Requester cannot connect to the campus Wi-Fi network.",
      requestedPriorityId: 2,
      currentStatusId: 2,
    },
  ];

  // Create/update the two fixed tickets
  for (const ticket of fixedTickets) {
    await prisma.ticket.upsert({
      where: { ticketNumber: ticket.ticketNumber },
      update: {
        requesterId: ticket.requesterId,
        categoryId: ticket.categoryId,
        relatedSystemId: ticket.relatedSystemId,
        summary: ticket.summary,
        description: ticket.description,
        requestedPriorityId: ticket.requestedPriorityId,
        currentStatusId: ticket.currentStatusId,
        itPriorityId: null,
      },
      create: ticket,
    });
  }

  // Create the remaining 98 random tickets
  for (let index = 10; index < 50; index += 1) {
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
