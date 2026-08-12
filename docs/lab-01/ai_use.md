# Lab 1 — AI Use and Reflection

### **LLM/agent used:** ChatGPT

| # | Prompt (summarised) | What I did with the result |
| - | - | - | 
| 1 | Asked how to implement `checkSystem()` in `api.ts`, including the `/api/health` and `/api/categories` fetch calls, error handling, and returning `{ online: true, categories }`.| Implemented both fetch calls, added `await`, threw errors when either request failed, and returned the expected object. |
| 2 | Asked how to implement the React UI logic in `App.tsx`, including the loading, success, and error states, calling `checkSystem()`, storing categories, and showing a useful error message. | Added the async `handleCheck` function, updated the UI state transitions, stored the fetched categories, and rendered the Online/Offline messages and category list. |
| 3 | Asked to fill the AI use documentation for the lab, including summarising prompts, mentioning the relevant files (`api.ts` and `App.tsx`), and formatting the reflection section. | Used the suggested format to complete the AI use table and reflection with concise summaries and file-specific context. |
| 4 |Asked how to implement the Prisma seed script using prisma.category.upsert() so the four categories are created without duplicates when the seed is run multiple times. | Implemented an idempotent seed script by looping through the four category names and calling prisma.category.upsert() with where: { name }, update: {}, and create: { name }, then logged a success message. |
| 5 | Asked how to create a PostgreSQL database matching the `DATABASE_URL` using both a single Docker command and a separate Docker Compose file, including the command to run it. | Created a Docker command using PostgreSQL 16 Alpine with the toktickit user, password, database, and port 5432. Also created a separate Docker Compose configuration with the same settings and provided the command to start the database. |

### **LLM/agent used:** Claude Sonnet 5

| # | Prompt (summarised) | What I did with the result |
| - | - | - | 
| 1 | Asked for a simple `categories.test.ts`, asserting `GET /api/categories`, with context about the `categories.test.ts` header and category order. | Implemented the test to return HTTP 200 and verify the four seeded category names and IDs in order. |

### **LLM/agent used:** VScode Copilot Extension

| # | Prompt (summarised) | What I did with the result |
| - | - | - | 
| 1 | Asked how to implement `GET /api/categories` with context of `app.ts`.| Added the Prisma query, ordered results by `id`, and returned a safe error response. |
| 2 | Asked to update `App.test.tsx` tests for Issue 4 with the required categories, without changing the header or adding other libraries, using context from `App.tsx` and `api.ts`. | Added two tests and mocked `checkSystem` to verify the success and error UI states.|

## Reflection

Giving the file name, file information and the required behavior made the prompts much more accurate because the AI could generate code that matched the project structure. Also restriting ai to follow the format of the original file is nesscessary in some work sice somtimes is just swithc to a diffrent library espeacly on the test file.
