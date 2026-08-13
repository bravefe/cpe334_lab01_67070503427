# TokTickIT 
TokTickIT is a full-stack IT service desk application for managing Account & Access, Hardware, Software, and Network support requests. The project is built incrementally across multiple lab sprints, with each sprint adding new features, validation, testing, and UI improvements.

The application supports three user roles: Requester, IT Staff, and Administrator. Tickets include request details, public comments, internal notes, actions taken, and attachments, with role-based permissions controlling sensitive operations such as assignment, priority management, status updates, and user administration.

The goal is to produce a polished local web application with responsive design, consistent styling, validation, automated tests, GitHub workflows, and complete documentation.

## Setup Guide
Follow these steps to run the project locally.

### 1. Clone the repository
```bash
git clone https://github.com/your-username/TokTickIT.git
cd TokTickIT
```
### 2. Install dependencies

Open two terminals.

#### Client
```bash
cd client
npm install
```
#### Server
```bash
cd server
npm install
```

### 3. Start the development servers

Run both the client and server at the same time.

#### Client
```bash
cd client
npm run dev
```
#### Server
```bash
cd server
npm run dev
```
The client and server should now be running locally in development mode.
