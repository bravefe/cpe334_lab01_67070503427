# Lab 1 — Peer Review Record  (fill this in)

**Author:** Patcharak Plipat — 67070503427 — bravefe
**Peer reviewer:** Punnapob Wirojwongchai — 67070503425 — SaintCrois
## Pull Requests I authored (reviewed by my partner)
| PR | Branch | Reviewer verdict |
|----|--------|------------------|
|  #6  | feature/1-project-foundation | Aprove |
|  #8  | feature/2-health-check | Aprove  |
|  #10  | feature/3-category-seed | Aprove |
|  #13  | feature/4-category-list | Aprove |

### feature/1-project-foundation
****
Yep, you have added the READ ME and bootstrap notice. All clear. GJ.

 - Punnapob W.

**How I responded:** Merge `feature/1-project-foundation` to `lab1-staging`.

### feature/2-health-check
**Reviewer comment I received:** 
Good no problem. Clear to merge. Don't forget to make branch for feat 3 before merging naja

- Punnapob W.

How I responded: Thumb up emoji and proceed to merge `feature/2-health-check` to `lab1-staging`.

### feature/3-category-seed
**Reviewer comment I received:** 
Good job! You've even updated the README file. Prisma is good. Overall it is a go. Please merge.

- Punnapob W.

**How I responded:**  Add an md file fro the database and the `docker-compose.ymal` then merge into `lab1-staging`.

### feature/4-category-list
**Reviewer comment I received:** 
Nice, great work. Everything looks good and ready to merge:

- Backend Route: The GET /api/categories endpoint in server/src/app.ts correctly selects id and name, sorts by id: "asc", and properly handles error status codes (500).
- Testing: The Supertest suite in categories.test.ts cleanly verifies both the HTTP 200 response and the exact order of the 4 seeded categories.
- Documentation: docs/lab-01/ai_use.md and docs/lab-01/tests.md are updated
Ok plz merge.

Punnapob W.
**How I responded:** Thankyou for the review. Then, merge with `lab1-staging

## Pull Requests I reviewed for my partner


### feature/1-project-foundation
**My comment:** "Very nice. Include setup guide in readme.md. Question: is the change in App.tsx needed?"
**Partner's response:** Bootstrap is installed and visible in the frontend. So yes.

### feature/2-health-check
**My comment:** "Wait you are merging with main. Do you have the lab1-staging or something?"
**Partner's response:** Oh thank you. Changed that.


### feature/3-category-seed
**My comment:** "The seed is safe to run more than once without duplicates. Wait, how do I do that."
**Partner's response:nt:** I used prisma.category.upsert() in prisma/seed.ts. If a category name already exists in the database, it performs an empty update:{} instead of creating a duplicate, making the seed script completely safe to run multiple times.


### feature/4-category-list
**My comment:** All the code are being implemented, also include all the necessary document
**Partner's response:** Heart Emoji, then proceed to merge.