# Project Structure

```text
project-root/
├── client/
│   ├── src/
│   │   ├── api/
│   │   │   ├── attachments.ts
│   │   │   ├── client.ts
│   │   │   ├── referenceData.ts
│   │   │   ├── requesters.ts
│   │   │   └── tickets.ts
│   │   ├── icon/
│   │   ├── lib/
│   │   │   ├── attachments.ts
│   │   │   ├── formatDate.ts
│   │   │   ├── reference.ts
│   │   │   ├── requester.ts
│   │   │   └── ticket.ts
│   │   ├── pages/
│   │   │   ├── ChooseRequester/
│   │   │   │   ├── ChooseRequester.css
│   │   │   │   └── ChooseRequester.tsx
│   │   │   ├── CreateTicket/
│   │   │   │   ├── AttachmentCreateTicket.tsx
│   │   │   │   ├── CreateTicket.css
│   │   │   │   └── CreateTicket.tsx
│   │   │   ├── MyTickets/
│   │   │   │   ├── MyTickets.css
│   │   │   │   └── MyTickets.tsx
│   │   │   ├── TicketDetail/
│   │   │   │   ├── AttachmentTicketDetail.tsx
│   │   │   │   ├── TicketDetail.css
│   │   │   │   └── TicketDetail.tsx
│   │   │   ├── Attachment.css
│   │   │   ├── TopBar.css
│   │   │   └── TopBar.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── styles.css
│   │   └── vite-env.d.ts
│   ├── tests/
│   │   ├── lab-01/App.test.tsx
│   │   ├── lab-02/
│   │   │   ├── AttachmentSection.test.tsx
│   │   │   ├── CreateTicket.test.tsx
│   │   │   ├── MyTickets.test.tsx
│   │   │   └── RequesterTicketDetail.test.tsx
│   │   └── setup.ts
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── database/
│   └── docker-compose.yml
├── docs/
│   ├── lab-01/
│   └── lab-02/
├── e2e/
│   ├── fixtures/lab-02/
│   └── lab-02/requester-ticket-flow.spec.ts
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── attachmentController.ts
│   │   │   ├── referenceController.ts
│   │   │   └── ticketController.ts
│   │   ├── lib/tickets.ts
│   │   ├── routes/
│   │   │   ├── attachmentRoute.ts
│   │   │   ├── health.ts
│   │   │   ├── referenceRoute.ts
│   │   │   └── ticketRoute.ts
│   │   ├── services/
│   │   │   ├── attachmentService.ts
│   │   │   ├── referenceService.ts
│   │   │   └── ticketService.ts
│   │   ├── app.ts
│   │   ├── index.ts
│   │   └── prisma.ts
│   ├── tests/
│   │   ├── lab-01/
│   │   └── lab-02/
│   │       ├── attachments.api.test.ts
│   │       ├── create-ticket.api.test.ts
│   │       ├── my-tickets.api.test.ts
│   │       └── ticket-detail.api.test.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── package.json
├── playwright.config.ts
├── README.md
└── .gitignore
```