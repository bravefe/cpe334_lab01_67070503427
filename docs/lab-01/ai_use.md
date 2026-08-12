# Lab 1 — AI Use and Reflection  (fill this in)

### **LLM/agent used:** ChatGPT
| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | | |

### **LLM/agent used:** Claude Sonnet 5
| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | Asked for a simple `categories.test.ts` , asserting `GET /api/categories`. Give context of `categories.test.ts` header and categories order.| Implement in the test to returns 200 and the four seeded category `names` and `id` in order on success.|


### **LLM/agent used:** VScode Copilot Extension
| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | Asked how to implement `GET /api/categories`. Give context of `app.ts` | Added the Prisma query, ordered results by `id`, and returned a safe error response. |
| 2 | Asked to update `App.test.tsx` tests for Issue 4 with the required categories, tell the ai to not change the header or add other library. Give context of the categories, `App.tsx` and `api.ts`.| Added two tests, mocked `checkSystem` |

## Reflection
Two or three sentences: what made your prompts better, and one place you had to
correct or reject what the agent produced.
