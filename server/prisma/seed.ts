import { getPrisma } from "../src/prisma.js";
import { Role } from "@prisma/client";

// Standard development bcrypt hash for password "Password123!"
const DEV_PASSWORD_HASH = "$2b$12$1TtvDmSubNdB6a6rJ7A7COpXVk26a55cs6QoiQlymdg2yV.1pmnSC";

export async function seed() {
  const prisma = getPrisma();

  // 1. Categories
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

  // 2. Related Systems
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

  // 3. Priorities (preserved sortOrder and order from Lab 2)
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

  // 4. Statuses (includes Lab 2 & Lab 3 statuses)
  const statuses = [
    { name: "New", isDefault: true },
    { name: "Open", isDefault: false },
    { name: "In Progress", isDefault: false },
    { name: "Waiting for Requester", isDefault: false },
    { name: "Resolved", isDefault: false },
    { name: "Closed", isDefault: false },
    { name: "Reopened", isDefault: false },
    { name: "Cancelled", isDefault: false },
    { name: "Pending", isDefault: false },
  ];
  for (const status of statuses) {
    await prisma.status.upsert({
      where: { name: status.name },
      update: { isDefault: status.isDefault },
      create: status,
    });
  }

  // 5. DevRequester records (preserved for Lab 2 client & test compatibility)
  const devRequesters: [string, string, boolean][] = [
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
    ["Gollum", "smeagol@goblinmail.example.com", false],
  ];

  for (const [name, email, isActive] of devRequesters) {
    await prisma.devRequester.upsert({
      where: { email },
      update: { name, isActive },
      create: { name, email, isActive },
    });
  }

  // 6. Users (meets §5.3 handout requirements: >=4 active Requesters, >=1 inactive Requester,
  //    >=3 active IT Staff, >=1 inactive IT Staff, >=1 active Administrator).
  //    All original DevRequesters are mapped to Role.REQUESTER per §7.1.
  const seedUsers = [
    // Requesters (All 12 Lab 2 identities preserved as Requesters so all existing tickets resolve correctly)
    {
      name: "Frodo Baggins",
      email: "frodo.b@shiremail.example.com",
      role: Role.REQUESTER,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Samwise Gamgee",
      email: "sam.gamgee@shiremail.example.com",
      role: Role.REQUESTER,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Aragorn, Son of Arathorn",
      email: "a.elessar@gondor.example.com",
      role: Role.REQUESTER,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Legolas Greenleaf",
      email: "legolasg@woodland.example.com",
      role: Role.REQUESTER,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Gimli, Son of Glóin",
      email: "gimli.o@erebor.example.com",
      role: Role.REQUESTER,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Boromir, Son of Denethor",
      email: "boromir@gondor.example.com",
      role: Role.REQUESTER,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Meriadoc Brandybuck",
      email: "merry.b@shiremail.example.com",
      role: Role.REQUESTER,
      isActive: true,
      mustChangePassword: true, // For mandatory first-login change flow (BR-02)
    },
    {
      name: "Peregrin Took",
      email: "pippin.t@shiremail.example.com",
      role: Role.REQUESTER,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Galadriel",
      email: "galadriel@lothlorien.example.com",
      role: Role.REQUESTER,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Éowyn",
      email: "eowyn.r@rohan.example.com",
      role: Role.REQUESTER,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Gandalf the Grey",
      email: "gandalf@istari.example.com",
      role: Role.REQUESTER,
      isActive: false, // Inactive requester
      mustChangePassword: false,
    },
    {
      name: "Gollum",
      email: "smeagol@goblinmail.example.com",
      role: Role.REQUESTER,
      isActive: false, // Inactive requester
      mustChangePassword: false,
    },

    // IT Staff (3 active, 2 inactive)
    {
      name: "Arwen Undómiel",
      email: "arwen@rivendell.example.com",
      role: Role.IT_STAFF,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Faramir, Captain of Gondor",
      email: "faramir@gondor.example.com",
      role: Role.IT_STAFF,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Haldir of Lórien",
      email: "haldir@lothlorien.example.com",
      role: Role.IT_STAFF,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Denethor II, Steward of Gondor",
      email: "denethor@gondor.example.com",
      role: Role.IT_STAFF,
      isActive: false, // Inactive IT Staff
      mustChangePassword: false,
    },
    {
      name: "Saruman the White",
      email: "saruman@isengard.example.com",
      role: Role.IT_STAFF,
      isActive: false, // Inactive IT Staff
      mustChangePassword: false,
    },

    // Administrator (1 active: sole administrator for BR-28 / LAST_ADMIN testing)
    {
      name: "Elrond Half-elven",
      email: "elrond@rivendell.example.com",
      role: Role.ADMINISTRATOR,
      isActive: true,
      mustChangePassword: false,
    },
  ];

  for (const u of seedUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        isActive: u.isActive,
        mustChangePassword: u.mustChangePassword,
        passwordHash: DEV_PASSWORD_HASH,
      },
      create: {
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        mustChangePassword: u.mustChangePassword,
        passwordHash: DEV_PASSWORD_HASH,
      },
    });
  }

  // Pre-fetch references
  const [categoriesMap, systemsMap, prioritiesMap, statusesMap, usersMap] = await Promise.all([
    prisma.category.findMany().then((rows) => new Map(rows.map((r) => [r.name, r.id]))),
    prisma.relatedSystem.findMany().then((rows) => new Map(rows.map((r) => [r.name, r.id]))),
    prisma.priority.findMany().then((rows) => new Map(rows.map((r) => [r.name, r.id]))),
    prisma.status.findMany().then((rows) => new Map(rows.map((r) => [r.name, r.id]))),
    prisma.user.findMany().then((rows) => new Map(rows.map((r) => [r.email, r.id]))),
  ]);

  // 7. Seed Tickets (fixed tickets for Lab 2 test compatibility + deterministic realistic distribution)
  const ticketsToSeed = [
    // Two fixed Lab 2 regression tickets
    {
      ticketNumber: "TKT-2026-000001",
      requesterEmail: "frodo.b@shiremail.example.com",
      categoryName: "Account and Access",
      systemName: "Email",
      summary: "Test Test 123",
      description: "Requester is unable to access their email account.",
      requestedPriorityName: "High",
      itPriorityName: "High",
      statusName: "New",
      ownerEmail: null,
      problemAppearsResolved: false,
      resolutionSummary: null,
    },
    {
      ticketNumber: "TKT-2026-000002",
      requesterEmail: "sam.gamgee@shiremail.example.com",
      categoryName: "Hardware",
      systemName: "Campus Wi-Fi",
      summary: "Campus Wi-Fi not working",
      description: "Requester cannot connect to the campus Wi-Fi network.",
      requestedPriorityName: "Medium",
      itPriorityName: "Medium",
      statusName: "Open",
      ownerEmail: "arwen@rivendell.example.com",
      problemAppearsResolved: false,
      resolutionSummary: null,
    },
    // Realistic tickets for queue, triage, filter, and detail operations
    {
      ticketNumber: "TKT-2026-000003",
      requesterEmail: "frodo.b@shiremail.example.com",
      categoryName: "Software",
      systemName: "LEB2 App",
      summary: "LEB2 App crashes on assignment upload",
      description: "App crashes when attempting to submit PDF assignments larger than 10MB.",
      requestedPriorityName: "High",
      itPriorityName: "High",
      statusName: "In Progress",
      ownerEmail: "arwen@rivendell.example.com",
      problemAppearsResolved: false,
      resolutionSummary: null,
    },
    {
      ticketNumber: "TKT-2026-000004",
      requesterEmail: "sam.gamgee@shiremail.example.com",
      categoryName: "Network",
      systemName: "VPN",
      summary: "Cannot connect to campus VPN from off-campus",
      description: "Receiving TLS handshake timeout when connecting to vpn.campus.example.com.",
      requestedPriorityName: "Medium",
      itPriorityName: "Medium",
      statusName: "Waiting for Requester",
      ownerEmail: "faramir@gondor.example.com",
      problemAppearsResolved: true,
      resolutionSummary: null,
    },
    {
      ticketNumber: "TKT-2026-000005",
      requesterEmail: "legolasg@woodland.example.com",
      categoryName: "Hardware",
      systemName: "Printer",
      summary: "Library 2nd floor printer paper jam",
      description: "Paper tray 2 is reporting repeated paper jam error.",
      requestedPriorityName: "Low",
      itPriorityName: "Low",
      statusName: "Resolved",
      ownerEmail: "haldir@lothlorien.example.com",
      problemAppearsResolved: true,
      resolutionSummary: "Cleared jammed paper and replaced roller unit.",
    },
    {
      ticketNumber: "TKT-2026-000006",
      requesterEmail: "gimli.o@erebor.example.com",
      categoryName: "Account and Access",
      systemName: "Grade Submission App",
      summary: "Instructor permissions missing for grading portal",
      description: "Cannot view assigned sections for the current academic semester.",
      requestedPriorityName: "High",
      itPriorityName: "High",
      statusName: "Closed",
      ownerEmail: "arwen@rivendell.example.com",
      problemAppearsResolved: true,
      resolutionSummary: "Updated faculty roles in registration database.",
    },
    {
      ticketNumber: "TKT-2026-000007",
      requesterEmail: "merry.b@shiremail.example.com",
      categoryName: "Hardware",
      systemName: "Corporate Laptop",
      summary: "Laptop battery drains rapidly while sleeping",
      description: "Device loses 80% battery overnight when closed and disconnected.",
      requestedPriorityName: "Medium",
      itPriorityName: "Medium",
      statusName: "New",
      ownerEmail: null,
      problemAppearsResolved: false,
      resolutionSummary: null,
    },
    {
      ticketNumber: "TKT-2026-000008",
      requesterEmail: "frodo.b@shiremail.example.com",
      categoryName: "Network",
      systemName: "Campus Wi-Fi",
      summary: "Intermittent Wi-Fi disconnects in Science Building",
      description: "Connection drops every few minutes during lecture hours.",
      requestedPriorityName: "Medium",
      itPriorityName: "Medium",
      statusName: "Open",
      ownerEmail: "faramir@gondor.example.com",
      problemAppearsResolved: false,
      resolutionSummary: null,
    },
    {
      ticketNumber: "TKT-2026-000009",
      requesterEmail: "sam.gamgee@shiremail.example.com",
      categoryName: "Software",
      systemName: "Email",
      summary: "Spam filter test request",
      description: "Requester accidentally submitted duplicate ticket for spam report.",
      requestedPriorityName: "Low",
      itPriorityName: "Low",
      statusName: "Cancelled",
      ownerEmail: null,
      problemAppearsResolved: false,
      resolutionSummary: "Cancelled per requester confirmation.",
    },
    {
      ticketNumber: "TKT-2026-000010",
      requesterEmail: "legolasg@woodland.example.com",
      categoryName: "Account and Access",
      systemName: "VPN",
      summary: "Password reset for remote VPN account",
      description: "Locked out after 3 failed login attempts during overseas travel.",
      requestedPriorityName: "High",
      itPriorityName: "High",
      statusName: "In Progress",
      ownerEmail: "haldir@lothlorien.example.com",
      problemAppearsResolved: false,
      resolutionSummary: null,
    },
    {
      ticketNumber: "TKT-2026-000011",
      requesterEmail: "gimli.o@erebor.example.com",
      categoryName: "Hardware",
      systemName: "Corporate Laptop",
      summary: "External monitor not detected via HDMI",
      description: "Connecting external Dell 27 inch display shows No Signal.",
      requestedPriorityName: "Medium",
      itPriorityName: "Medium",
      statusName: "Open",
      ownerEmail: "arwen@rivendell.example.com",
      problemAppearsResolved: false,
      resolutionSummary: null,
    },
    {
      ticketNumber: "TKT-2026-000012",
      requesterEmail: "merry.b@shiremail.example.com",
      categoryName: "Software",
      systemName: "LEB2 App",
      summary: "Unable to view course announcements",
      description: "Blank white screen displayed when clicking course bulletin tab.",
      requestedPriorityName: "Low",
      itPriorityName: "Low",
      statusName: "New",
      ownerEmail: null,
      problemAppearsResolved: false,
      resolutionSummary: null,
    },
  ];

  for (const t of ticketsToSeed) {
    const requesterId = usersMap.get(t.requesterEmail);
    const categoryId = categoriesMap.get(t.categoryName);
    const relatedSystemId = systemsMap.get(t.systemName);
    const requestedPriorityId = prioritiesMap.get(t.requestedPriorityName);
    const itPriorityId = t.itPriorityName ? prioritiesMap.get(t.itPriorityName) : requestedPriorityId;
    const currentStatusId = statusesMap.get(t.statusName);
    const ticketOwnerId = t.ownerEmail ? usersMap.get(t.ownerEmail) : null;

    if (!requesterId || !categoryId || !relatedSystemId || !requestedPriorityId || !currentStatusId) {
      throw new Error(`Invalid reference in ticket seed definition for ${t.ticketNumber}`);
    }

    const ticketData = {
      requesterId,
      categoryId,
      relatedSystemId,
      summary: t.summary,
      description: t.description,
      requestedPriorityId,
      itPriorityId,
      currentStatusId,
      ticketOwnerId,
      problemAppearsResolved: t.problemAppearsResolved,
      resolutionSummary: t.resolutionSummary,
    };

    await prisma.ticket.upsert({
      where: { ticketNumber: t.ticketNumber },
      update: ticketData,
      create: {
        ticketNumber: t.ticketNumber,
        ...ticketData,
      },
    });
  }

  // 8. Public Comments & Internal Notes (deterministic sample data)
  const sampleComments = [
    {
      id: 1,
      ticketNumber: "TKT-2026-000001",
      authorEmail: "frodo.b@shiremail.example.com",
      content: "I have tried resetting via self-service portal but received error 502.",
    },
    {
      id: 2,
      ticketNumber: "TKT-2026-000001",
      authorEmail: "arwen@rivendell.example.com",
      content: "We are checking the directory service synchronization status.",
    },
    {
      id: 3,
      ticketNumber: "TKT-2026-000003",
      authorEmail: "frodo.b@shiremail.example.com",
      content: "The crash happens specifically with files larger than 10 MB.",
    },
    {
      id: 4,
      ticketNumber: "TKT-2026-000004",
      authorEmail: "sam.gamgee@shiremail.example.com",
      content: "Still receiving timeout error code 0x8007274c.",
    },
  ];

  for (const c of sampleComments) {
    const ticket = await prisma.ticket.findUniqueOrThrow({ where: { ticketNumber: c.ticketNumber } });
    const author = await prisma.user.findUniqueOrThrow({ where: { email: c.authorEmail } });

    await prisma.publicComment.upsert({
      where: { id: c.id },
      update: {
        ticketId: ticket.id,
        authorId: author.id,
        content: c.content,
      },
      create: {
        id: c.id,
        ticketId: ticket.id,
        authorId: author.id,
        content: c.content,
      },
    });
  }

  const sampleNotes = [
    {
      id: 1,
      ticketNumber: "TKT-2026-000001",
      authorEmail: "arwen@rivendell.example.com",
      content: "Active Directory user object had flag 'lockout' set. Unlocked manually.",
    },
    {
      id: 2,
      ticketNumber: "TKT-2026-000003",
      authorEmail: "faramir@gondor.example.com",
      content: "Issue reproduced on staging. Nginx client_max_body_size was set too low.",
    },
    {
      id: 3,
      ticketNumber: "TKT-2026-000004",
      authorEmail: "haldir@lothlorien.example.com",
      content: "Called user; suggested switching to alternative gateway gateway2.campus.example.com.",
    },
  ];

  for (const n of sampleNotes) {
    const ticket = await prisma.ticket.findUniqueOrThrow({ where: { ticketNumber: n.ticketNumber } });
    const author = await prisma.user.findUniqueOrThrow({ where: { email: n.authorEmail } });

    await prisma.internalNote.upsert({
      where: { id: n.id },
      update: {
        ticketId: ticket.id,
        authorId: author.id,
        content: n.content,
      },
      create: {
        id: n.id,
        ticketId: ticket.id,
        authorId: author.id,
        content: n.content,
      },
    });
  }

  // 9. Backfill any existing tickets with itPriorityId = requestedPriorityId
  await prisma.$executeRawUnsafe(
    `UPDATE "Ticket" SET "itPriorityId" = "requestedPriorityId" WHERE "itPriorityId" IS NULL`
  );

  // 10. Synchronize serial sequences so future inserts work without ID conflicts
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"User"', 'id'), coalesce(max(id), 0) + 1, false) FROM "User"`
  );
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Ticket"', 'id'), coalesce(max(id), 0) + 1, false) FROM "Ticket"`
  );
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"PublicComment"', 'id'), coalesce(max(id), 0) + 1, false) FROM "PublicComment"`
  );
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"InternalNote"', 'id'), coalesce(max(id), 0) + 1, false) FROM "InternalNote"`
  );
}

async function main() {
  await seed();
}

// When executed directly as a script
if (process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js")) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await getPrisma().$disconnect();
    });
}
