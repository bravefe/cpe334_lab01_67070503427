# Project File Directory

```text
project-root/
├── client/
│   ├── src/
│   │   ├── api/
│   │   │   ├── actions.ts
│   │   │   ├── attachments.ts
│   │   │   ├── auth.ts
│   │   │   ├── client.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── referenceData.ts
│   │   │   ├── tickets.ts
│   │   │   └── users.ts
│   │   ├── icon/
│   │   │   └── logo.png
│   │   ├── lib/
│   │   │   ├── actionTaken.ts
│   │   │   ├── attachments.ts
│   │   │   ├── auth.ts
│   │   │   ├── dashboard.ts
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
│   │   │   │   ├── AttachmentCreateTicket.tsx
│   │   │   │   ├── CreateTicket.css
│   │   │   │   └── CreateTicket.tsx
│   │   │   ├── Dashboard/
│   │   │   │   ├── Dashboard.css
│   │   │   │   └── Dashboard.tsx
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
│   │   │   │   ├── ActionsTakenPanel.css
│   │   │   │   ├── ActionsTakenPanel.tsx
│   │   │   │   ├── AttachmentTicketDetail.tsx
│   │   │   │   ├── ConversationPanel.css
│   │   │   │   ├── ConversationPanel.tsx
│   │   │   │   ├── TicketDetail.css
│   │   │   │   └── TicketDetail.tsx
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
│   │   ├── lab-01/
│   │   │   └── App.test.tsx
│   │   ├── lab-02/
│   │   │   ├── AttachmentSection.test.tsx
│   │   │   ├── CreateTicket.test.tsx
│   │   │   ├── MyTickets.test.tsx
│   │   │   └── RequesterTicketDetail.test.tsx
│   │   ├── lab-03/
│   │   │   ├── AppShell.test.tsx
│   │   │   ├── ChangePassword.test.tsx
│   │   │   ├── Login.test.tsx
│   │   │   ├── RequesterTicketDetail.test.tsx
│   │   │   ├── StaffTicketDetail.test.tsx
│   │   │   ├── StaffTicketQueue.test.tsx
│   │   │   ├── UserManagement.test.tsx
│   │   │   └── ZenGreenStyle.test.tsx
│   │   ├── lab-04/
│   │   │   ├── ActionsTaken.test.tsx
│   │   │   ├── RequesterDashboard.test.tsx
│   │   │   ├── StaffDashboard.test.tsx
│   │   │   └── TicketWorkflow.test.tsx
│   │   └── setup.ts
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── database/
│   ├── docker-compose.yml
│   └── README.md
├── docs/
│   ├── lab-01/
│   ├── lab-02/
│   ├── lab-03/
│   └── lab-04/
│       ├── _SE+Lab+4.pdf
│       ├── ai-use.md
│       ├── api-spec.md
│       ├── filedirectory.md
│       ├── reviewer.md
│       ├── specification.md
│       ├── test.md
│       └── ui-spec.md
├── e2e/
│   ├── fixtures/
│   │   └── e2e-attachment.pdf
│   ├── lab-02/
│   │   └── requester-ticket-flow.spec.ts
│   ├── lab-03/
│   │   ├── authentication.spec.ts
│   │   ├── responsive.spec.ts
│   │   ├── screenshots.ts
│   │   ├── staff-ticket-flow.spec.ts
│   │   └── user-administration.spec.ts
│   └── lab-04/
│       ├── actions-taken-flow.spec.ts
│       ├── dashboards.spec.ts
│       ├── screenshots.ts
│       └── ticket-resolution.spec.ts
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   │   ├── 20260811020829_init/
│   │   │   ├── 20260827080614_init/
│   │   │   ├── 20260915062726_lab3_data_model/
│   │   │   ├── 20260924080139_lab4/
│   │   │   ├── 20261028152719_action_taken_action_at_default/
│   │   │   └── migration_lock.toml
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── actionTakenController.ts
│   │   │   ├── adminController.ts
│   │   │   ├── attachmentController.ts
│   │   │   ├── authController.ts
│   │   │   ├── referenceController.ts
│   │   │   ├── staffController.ts
│   │   │   └── ticketController.ts
│   │   ├── lib/
│   │   │   ├── actionTaken.ts
│   │   │   ├── content.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── email.ts
│   │   │   ├── password.ts
│   │   │   ├── session.ts
│   │   │   ├── statusTransitions.ts
│   │   │   ├── tickets.ts
│   │   │   └── userOwnership.ts
│   │   ├── middleware/
│   │   │   └── authentication.ts
│   │   ├── routes/
│   │   │   ├── adminRoute.ts
│   │   │   ├── attachmentRoute.ts
│   │   │   ├── authRoute.ts
│   │   │   ├── health.ts
│   │   │   ├── referenceRoute.ts
│   │   │   ├── staffRoute.ts
│   │   │   └── ticketRoute.ts
│   │   ├── services/
│   │   │   ├── actionTakenService.ts
│   │   │   ├── adminService.ts
│   │   │   ├── attachmentService.ts
│   │   │   ├── authService.ts
│   │   │   ├── referenceService.ts
│   │   │   ├── staffService.ts
│   │   │   └── ticketService.ts
│   │   ├── app.ts
│   │   ├── index.ts
│   │   └── prisma.ts
│   ├── tests/
│   │   ├── lab-01/
│   │   ├── lab-02/
│   │   ├── lab-03/
│   │   └── lab-04/
│   │       ├── actions-taken.api.test.ts
│   │       ├── admin-dashboard.api.test.ts
│   │       ├── requester-dashboard.api.test.ts
│   │       ├── staff-dashboard.api.test.ts
│   │       ├── ticket-workflow.api.test.ts
│   │       └── transition-matrix.api.test.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── artifacts/
│   ├── lab-02/
│   │   └── screenshots/
├── .github/
│   └── workflows/
│       └── lab4-tests.yml
├── .vscode/
│   └── settings.json
│   └── lab-03/
│       └── screenshots/
├── package.json
├── package-lock.json
├── playwright.config.ts
├── README.md
└── .gitignore
```
