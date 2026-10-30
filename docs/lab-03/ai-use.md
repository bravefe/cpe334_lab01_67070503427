# Lab 3 — AI Use 
 
### **LLM/Agent Used: ChatGPT 5.6 Luna/Tera (Codex/Copilot)**

| # | Prompt (Summarised) | What I Did with the Result |
| - | - | - |
| 1 | Read the project specification and narrowed it down to 5 key issues instead of 10. | Reviewed the issue list, selected the most relevant items, and used them to guide implementation planning. |
| 2 | Pasted the issues and the specification.md for all the 3 issues left. | Generate the core structure of api and client side. Also, implement the test of related to the issue in another prompt. |
| 3 | Requested small UI adjustments, including moving the filter bar and adding error text styling. | Applied the visual refinements and improved the error message presentation in the interface. |
| 4 | Pasted an older page and asked the agent to make the UI consistent with the newer design. | Compared the old and new layouts, adjusted the styling, and aligned the page with the existing UI system. |
| 5 | Included the entire specification content in the prompt so the agent could work from the full project requirements. | Reviewed the complete specification, used it as the source of truth, and aligned the implementation with the documented requirements. |

### **LLM/Agent Used: Gemini 3.8 (Antigravity)**

| # | Prompt (Summarised) | What I Did with the Result |
| - | - | - |
| 1 | Implemented Issue 11: Lab 3 data model, database migration from Lab 2, idempotent seed data, and unit/migration tests. | Reviewed implementation plan, validated migration and seed idempotence, and confirmed all automated tests passed. |
| 2 | Implement and fixed the end-to-end test failures and resolved the errors. | Create the E2E test and Reviewed the failing E2E flow, corrected the underlying issues, and verified the tests passed. |

## Reflection

This lab mainly involved **pasting an already-prepared specification into AI and using it to guide the implementation**. There were fewer personal adjustments compared to Lab 2, although sometimes the AI implemented only the client, server, or test side, so it was necessary to re-prompt it and specify the exact part to implement, such as writing the test in a separate prompt. There were still some errors when running the tests, and sometimes it was necessary to step back and re-evaluate the tests.
