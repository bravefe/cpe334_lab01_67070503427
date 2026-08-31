# Project Structure

```text
project-root/
│
├── server/
│   └── src/
│       ├── controllers/
│       │   ├── health.ts
│       │   ├── references.ts
│       │   └── tickets.ts
│       ├── routes/
│       │   ├── health.ts
│       │   ├── references.ts
│       │   └── tickets.ts
│       │
│       ├── services/
│       │
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
