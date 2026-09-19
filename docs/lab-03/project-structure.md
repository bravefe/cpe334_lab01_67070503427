project-root/
├── client/
│   ├── src/
│   │   ├── api/
│   │   │   ├── attachments.ts
│   │   │   ├── auth.ts
│   │   │   ├── client.ts
│   │   │   ├── referenceData.ts
│   │   │   ├── tickets.ts
│   │   │   └── users.ts
│   │   ├── icon/
│   │   ├── lib/
│   │   │   ├── attachments.ts
│   │   │   ├── auth.ts
│   │   │   ├── formatDate.ts
│   │   │   ├── passwordRules.ts
│   │   │   ├── reference.ts
│   │   │   ├── requester.ts
│   │   │   ├── ticket.ts
│   │   │   └── user.ts
│   │   ├── pages/
│   │   │   ├── ChangePassword/
│   │   │   │   ├── ChangePassword.css
│   │   │   │   └── ChangePassword.tsx
│   │   │   ├── CreateTicket/
│   │   │   │   ├── CreateTicket.css
│   │   │   │   ├── CreateTicket.tsx
│   │   │   │   └── AttachmentCreateTicket.tsx
│   │   │   ├── Login/
│   │   │   │   ├── Login.css
│   │   │   │   └── Login.tsx
│   │   │   ├── MyTickets/
│   │   │   │   ├── MyTickets.css
│   │   │   │   └── MyTickets.tsx
│   │   │   ├── StaffTicketDetail/
│   │   │   │   ├── StaffTicketDetail.css
│   │   │   │   └── StaffTicketDetail.tsx
│   │   │   ├── StaffTicketQueue/
│   │   │   │   ├── StaffTicketQueue.css
│   │   │   │   └── StaffTicketQueue.tsx
│   │   │   ├── TicketDetail/
│   │   │   │   ├── TicketDetail.css
│   │   │   │   ├── TicketDetail.tsx
│   │   │   │   ├── AttachmentTicketDetail.tsx
│   │   │   │   └── ConversationPanel.tsx
│   │   │   ├── UserManagement/
│   │   │   │   ├── UserManagement.css
│   │   │   │   └── UserManagement.tsx
│   │   │   ├── Attachment.css
│   │   │   ├── TopBar.css
│   │   │   └── TopBar.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── styles.css
│   │   └── vite-env.d.ts
│   ├── tests/
│   │   ├── lab-03/
│   │   │   ├── AppShell.test.tsx
│   │   │   ├── ChangePassword.test.tsx
│   │   │   ├── Login.test.tsx
│   │   │   ├── RequesterTicketDetail.test.tsx
│   │   │   ├── StaffTicketDetail.test.tsx
│   │   │   ├── StaffTicketQueue.test.tsx
│   │   │   ├── UserManagement.test.tsx
│   │   │   └── ZenGreenStyle.test.tsx
│   │   └── setup.ts
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── database/
│   ├── docker-compose.yml
│   └── README.md
├── docs/
│   ├── lab-03/
│   │   ├── ai-use.md
│   │   ├── api-spec.md
│   │   ├── credentials.md
│   │   ├── project-structure.md
│   │   ├── reviewer.md
│   │   ├── specification.md
│   │   ├── test.md
│   │   └── ui-spec.md
│   └── lab-02/
├── e2e/
│   ├── fixtures/
│   └── lab-03/
│       ├── authentication.spec.ts
│       ├── responsive.spec.ts
│       ├── screenshots.ts
│       ├── staff-ticket-flow.spec.ts
│       └── user-administration.spec.ts
├── artifacts/
│   └── lab-03/
│       └── screenshots/
│           ├── authentication/
│           ├── staff-queue/
│           ├── staff-ticket-detail/
│           └── user-management/
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── app.ts
│   │   ├── index.ts
│   │   ├── prisma.ts
│   │   ├── controllers/
│   │   │   ├── adminController.ts
│   │   │   ├── attachmentController.ts
│   │   │   ├── authController.ts
│   │   │   ├── referenceController.ts
│   │   │   ├── staffController.ts
│   │   │   └── ticketController.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── csrf.ts
│   │   │   └── errorHandler.ts
│   │   ├── routes/
│   │   │   ├── adminRoute.ts
│   │   │   ├── attachmentRoute.ts
│   │   │   ├── authRoute.ts
│   │   │   ├── health.ts
│   │   │   ├── referenceRoute.ts
│   │   │   ├── staffRoute.ts
│   │   │   └── ticketRoute.ts
│   │   ├── services/
│   │   │   ├── adminService.ts
│   │   │   ├── attachmentService.ts
│   │   │   ├── authService.ts
│   │   │   ├── referenceService.ts
│   │   │   ├── staffService.ts
│   │   │   └── ticketService.ts
│   │   └── lib/
│   │       ├── auth.ts
│   │       ├── password.ts
│   │       ├── statusTransitions.ts
│   │       ├── ticket.ts
│   │       └── user.ts
│   ├── tests/
│   │   ├── lab-03/
│   │   │   ├── auth.api.test.ts
│   │   │   ├── authorization.api.test.ts
│   │   │   ├── comments-notes.api.test.ts
│   │   │   ├── migration.api.test.ts
│   │   │   ├── staff-queue.api.test.ts
│   │   │   ├── staff-ticket-detail.api.test.ts
│   │   │   ├── users-admin.api.test.ts
│   │   │   └── unit/
│   │   │       ├── content.unit.test.ts
│   │   │       ├── email.unit.test.ts
│   │   │       ├── password.unit.test.ts
│   │   │       ├── session.unit.test.ts
│   │   │       ├── status-transitions.unit.test.ts
│   │   │       └── user-ownership.unit.test.ts
│   │   └── lab-02/
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── package.json
├── playwright.config.ts
├── README.md
├── .gitignore
└── temp/