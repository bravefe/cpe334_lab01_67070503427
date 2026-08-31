# Project Structure

```text
project-root/
│
├── server/
│   └── src/
│       ├── controllers/
│       │   ├── referenceController.ts
│       │   └── ticketsController.ts
│       ├── routes/
│       │   ├── referenceRoute.ts
│       │   └── ticketsRoute.ts
│       ├── services/
│       │   ├── referenceService.ts
│       │   └── ticketsService.ts
│       ├── app.ts
│       ├── index.ts
│       └── prisma.ts
│
└── client/
    └── src/
        ├── api/
        │   ├── client.ts
        │   ├── reference.ts
        │   ├── requesters.ts
        │   └── tickets.ts
        │
        ├── lib/
        │   ├── reference.ts
        │   ├── requester.ts
        │   └── ticket.ts
        │
        ├── pages/
        │   ├── ChooseRequester/
        │   │   ├── ChooseRequester.css
        │   │   └── ChooseRequester.tsx
        │   │
        │   ├── MyTickets/
        │   │   ├── MyTickets.css
        │   │   └── MyTickets.tsx
        │   │
        │   └── TopBar/
        │       └── TopBar.css
        │
        ├── App.tsx
        ├── main.tsx
        └── styles.css
```
