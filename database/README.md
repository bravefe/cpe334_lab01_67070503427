# Database setup

1. **Start PostgreSQL with Docker**

   ```bash
   docker compose up -d
   ```

   Launches the PostgreSQL database container.

2. **Go to the server folder**

   ```bash
   cd ..\server
   ```

3. **Run the initial migration**

   ```bash
   npx prisma migrate dev --name init
   ```

   Creates the database schema and applies migrations.

4. **Seed the database**

   ```bash
   npx prisma db seed
   ```

   Inserts the initial data into the database.

   To seed the reference data without creating sample tickets, set
   `SKIP_TICKET_SEED=true` before running the seed command. This also skips
   sample comments, internal notes, ticket backfill, and ticket-related ID
   sequence synchronization:

   **PowerShell**
   ```powershell
   $env:SKIP_TICKET_SEED = "true"
   npx prisma db seed
   ```

   **macOS/Linux**
   ```bash
   SKIP_TICKET_SEED=true npx prisma db seed
   ```

5. **Open Prisma Studio**

   ```bash
   npx prisma studio
   ```

   Opens a browser-based interface to view and edit database records.


```bash
npx prisma migrate reset
```
