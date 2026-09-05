# Lab 2 — AI Use

### **LLM/Agent Used: ChatGPT**

| # | Prompt (Summarised) | What I Did with the Result |
| - | - | - |
| 1 | Reviewed my database structure, identified fields that should be unique, converted the design into Markdown tables, and suggested improvements. | Reviewed the suggestions and updated `design/database.md`. |
| 2 | Asked ChatGPT to organize and improve my project documentation. | Reorganized the specification, API, database, and test documentation for consistency. |
| 3 | Asked ChatGPT to split the project files into a clearer structure: `route`, `controller`, and `service` for the server side, and `api`, `lib`, and `page` for the client side. | Reviewed the proposed structure and reorganized the files to make the project easier to maintain. |

Also, use ChatGPT For smaller syntax or ui change

### **LLM/Agent Used: Gemini**

| # | Prompt (Summarised) | What I Did with the Result |
| - | - | - |
| 1 | Updated the database design with ticket priorities, statuses, and their relationships. | Applied the changes to the schema, seed data, and documentation. |
| 2 | Added `PublicComments`, `ServiceActions`, and `EventLog` with their required relationships and operations. | Implemented the models and updated the related documentation. |
| 3 | Asked Gemini to rewrite and implement tests based on my specification and test results. | Reviewed the tests and used the results to fix the implementation. |

### **LLM/Agent Used: VS Code Copilot Extension — ChatGPT 5.6 Luna**

| # | Prompt (Summarised) | What I Did with the Result |
| - | - | - |
| 1 | Asked it to create the Prisma schema and seed data based on the database specification. | Reviewed and adapted the generated files to my project. |
| 2 | Pasted the specification and asked it to implement only the **My Tickets** and **Requester Selection** pages. | Reviewed the implementation and adjusted it to match the specification. |
| 3 | Asked it to organize the code into `page`, `lib`, `api`, `route`, and `service` folders. | Reviewed and adjusted the generated structure. |
| 4 | Asked it to re-check the implementation against `specification.md`. It found eight major issues. | Fixed the issues and updated `specification.md` and `api-spec.md`. |
| 5 | Pasted the complete specification and instructed it to implement only specific pages. | Checked that the changes stayed within the requested scope. |
| 6 | Pasted `test.md` and asked it to implement the tests file by file. After each implementation, and run test only after the code is complete. | Made small fixes based on failed tests and repeated the process until all tests passed. |

## Reflection

This lab mainly revolved around **pasting an already-prepared specification into AI and using it to guide the implementation**. I found that AI was useful for quickly generating code, tests, database changes, and documentation.

One thing I learned is that limiting Copilot's commands is sometimes necessary. If I give it too much freedom, it can sometimes go out of context or make changes that are not needed. I also found that I should not allow it to run npm run build unnecessarily during development, since it generate files. For the next lab, I might remove or restrict this command during the development phase.

Overall, AI helped speed up development and identify errors, while testing reviewing and made small adjustment.
