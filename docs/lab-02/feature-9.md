
I want you to put the code for attachment seperately 
the file you will need client/src/api/attachments.ts
src/lib/attachments.ts if you need 
|
Then put AttachmentCreateTicket.tsx inside the creattTicket folder an same with AttachmentTicketDetail.tsx

since the look will be similar you only need 1 cssfile /pages/Attachment.css

For the server also spilt the file like what I have done

in client you need to craeate 

in page /ticket/id: put this below the detail the similary to the topbar there is a line below to hightlight witch page are we at right now we are only implementing attachment so when go to other page just leave it with a message to be implemented set the default page to the attachments for now
│ ┌──────────────────────────────────────────────────────────────────────┐ │
│ │ Public Comments │ Attachments │ Service Actions │ Event Log    │ │
│ ├──────────────────────────────────────────────────────────────────────┤ │
│ │    file                                                         x    │ │
│ ├──────────────────────────────────────────────────────────────────────┤ │
│ │                     | + Add FIle Button   |                          │ │
│ └──────────────────────────────────────────────────────────────────────┘ │

and in /create-ticket does not need to have Public Comments, Service Actions, and Event Log only the attachments

use the same file list by linestyle for these 2 file but you are able to drag and drop the file in the area and it will add auto you click on the the file will download and there also be the add file button below tthe file if there is one if you can still add more file in the ticket 

You are only alow to create test in here
`server/tests/lab-02/attachments.api.test.ts`

:root {
  font-family: "DM Sans", sans-serif;
  color: var(--text);
  background: var(--page-bg);
  --primary-green: #006b3c;
  --secondary-green: #0b7a46;
  --pale-green: #eaf6ef;
  --page-bg: #f5f7f6;
  --surface: #ffffff;
  --text: #173b2d;
  --muted: #67756f;

  --border: #d9e1dd;
  --control-border: var(--border);
  --subtle-border: var(--border);
  --mobile-border: var(--border);
  --readonly-border: var(--border);
  --attachment-border: var(--border);

  --readonly-surface: var(--page-bg);
  --attachment-surface: var(--surface);

  /* --control-border: #c9d3ce;
  --subtle-border: #e8ecea;
  --mobile-border: #e8eee9;
  --readonly-surface: #f2f4f3;
  --attachment-surface: #f9fbfa;
  --readonly-border: #dde5e1;
  --attachment-border: #bfd6c9; */

  --focus-ring: rgba(0, 107, 60, 0.24);
  --hover-overlay: rgba(255, 255, 255, 0.08);
  --shadow-soft: rgba(23, 59, 45, 0.05);
  --shadow-card: rgba(23, 59, 45, 0.06);
  --shadow-selection: rgba(23, 59, 45, 0.12);

  --error: #b42318;
  --success: #16803c;

  --error-surface: #fdecec;
  --error-border: #e9bdb8;
  --error-banner-surface: #fef2f2;
  --error-banner-border: #fecaca;
  --success-banner-surface: #edfdf4;
  --success-banner-border: #b9edc8;
  
  --low-priority-surface: #eef8f1;
  --low-priority-text: #2b6b42;
  --medium-priority-surface: #fff7e8;
  --medium-priority-text: #8a5a00;
  --high-priority-surface: #fdecec;
  --high-priority-text: #9a2d23;
  --status-surface: #eef3fc;
  --status-text: #31588f;
}

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Category {
  id       Int      @id @default(autoincrement())
  name     String   @unique
  isActive Boolean  @default(true)
  tickets  Ticket[]
}

model Priority {
  id               Int      @id @default(autoincrement())
  name             String   @unique
  sortOrder        Int      @unique
  requestedTickets Ticket[] @relation("RequestedPriority")
  assignedTickets  Ticket[] @relation("ItPriority")
}

model Status {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  isDefault Boolean  @default(false)
  tickets   Ticket[]
}

model DevRequester {
  id             Int             @id @default(autoincrement())
  name       String
  email          String          @unique
  isActive       Boolean         @default(true)
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  tickets        Ticket[]
}

model RelatedSystem {
  id       Int      @id @default(autoincrement())
  name     String   @unique
  isActive Boolean  @default(true)
  tickets  Ticket[]
}

model Ticket {
  id                  Int             @id @default(autoincrement())
  ticketNumber        String          @unique
  requesterId         Int
  categoryId          Int
  relatedSystemId     Int
  summary             String          @db.VarChar(150)
  description         String          @db.VarChar(2000)
  requestedPriorityId Int
  itPriorityId        Int?
  currentStatusId     Int
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
  requester           DevRequester    @relation(fields: [requesterId], references: [id], onDelete: Restrict)
  category            Category        @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  relatedSystem       RelatedSystem   @relation(fields: [relatedSystemId], references: [id], onDelete: Restrict)
  requestedPriority   Priority        @relation("RequestedPriority", fields: [requestedPriorityId], references: [id], onDelete: Restrict)
  itPriority          Priority?       @relation("ItPriority", fields: [itPriorityId], references: [id], onDelete: Restrict)
  currentStatus       Status          @relation(fields: [currentStatusId], references: [id], onDelete: Restrict)
  attachments         Attachment[]
  // publicComments      PublicComment[]
  // serviceActions      ServiceAction[]
  // eventLogs           EventLog[]

  @@index([ticketNumber])
  @@index([requesterId])
  @@index([categoryId])
  @@index([requestedPriorityId])
  @@index([currentStatusId])
  @@index([createdAt])
}
enum AttachmentStatus {
  ACTIVE
  REMOVED
}

model Attachment {
  id               Int              @id @default(autoincrement())
  ticketId         Int
  originalFileName String
  storedFileName   String
  mimeType         String
  fileSize          Int
  status           AttachmentStatus @default(ACTIVE)
  removalReason    String?
  removedAt        DateTime?
  uploadedAt       DateTime         @default(now())
  ticket           Ticket           @relation(fields: [ticketId], references: [id], onDelete: Restrict)

  @@index([ticketId])
}