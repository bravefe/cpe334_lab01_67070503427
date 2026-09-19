-- CreateEnum
CREATE TYPE "Role" AS ENUM ('REQUESTER', 'IT_STAFF', 'ADMINISTRATOR');

-- DropForeignKey from Ticket to DevRequester
ALTER TABLE "Ticket" DROP CONSTRAINT IF EXISTS "Ticket_requesterId_fkey";

-- AlterTable Ticket
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "problemAppearsResolved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "resolutionSummary" TEXT,
ADD COLUMN IF NOT EXISTS "ticketOwnerId" INTEGER;

-- CreateTable User
CREATE TABLE IF NOT EXISTS "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'REQUESTER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Case-insensitive unique index and regular unique index
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_lower_key" ON "User"(LOWER("email"));
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");

-- Data Backfill step 1: Populate User from existing DevRequester records
INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive", "mustChangePassword", "createdAt", "updatedAt")
SELECT "id", "name", "email", '$2b$12$1TtvDmSubNdB6a6rJ7A7COpXVk26a55cs6QoiQlymdg2yV.1pmnSC', 'REQUESTER'::"Role", "isActive", true, "createdAt", "updatedAt"
FROM "DevRequester"
ON CONFLICT ("id") DO NOTHING;

-- Synchronize User id sequence
SELECT setval(pg_get_serial_sequence('"User"', 'id'), coalesce(max("id"), 0) + 1, false) FROM "User";

-- Data Backfill step 2: Ensure Ticket.requesterId resolves to User.id
UPDATE "Ticket" t
SET "requesterId" = u."id"
FROM "DevRequester" dr
JOIN "User" u ON LOWER(dr."email") = LOWER(u."email")
WHERE t."requesterId" = dr."id";

-- Data Backfill step 3: Copy requestedPriority to itPriority
UPDATE "Ticket"
SET "itPriorityId" = "requestedPriorityId"
WHERE "itPriorityId" IS NULL;

-- CreateTable PublicComment
CREATE TABLE IF NOT EXISTS "PublicComment" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "content" VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable InternalNote
CREATE TABLE IF NOT EXISTS "InternalNote" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "content" VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalNote_pkey" PRIMARY KEY ("id")
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS "PublicComment_ticketId_idx" ON "PublicComment"("ticketId");
CREATE INDEX IF NOT EXISTS "PublicComment_authorId_idx" ON "PublicComment"("authorId");

CREATE INDEX IF NOT EXISTS "InternalNote_ticketId_idx" ON "InternalNote"("ticketId");
CREATE INDEX IF NOT EXISTS "InternalNote_authorId_idx" ON "InternalNote"("authorId");

CREATE INDEX IF NOT EXISTS "Ticket_ticketOwnerId_idx" ON "Ticket"("ticketOwnerId");

-- AddForeignKey constraints
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_ticketOwnerId_fkey" FOREIGN KEY ("ticketOwnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PublicComment" ADD CONSTRAINT "PublicComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PublicComment" ADD CONSTRAINT "PublicComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
