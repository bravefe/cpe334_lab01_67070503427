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
   Skip this step if alredy have migraions folder.
4. **Generate the Prisma client**

   ```bash
   npx prisma generate
   ```

   Generates the Prisma client for database access.

5. **Seed the database**

   ```bash
   npx prisma db seed
   ```

   Inserts the initial data into the database.

6. **Open Prisma Studio**

   ```bash
   npx prisma studio
   ```

   Opens a browser-based interface to view and edit database records.
