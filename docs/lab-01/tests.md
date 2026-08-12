# Lab 1 — Test Plan and Evidence  (fill this in)

All test files live under server/tests/lab-01/ and client/tests/lab-01/.

| # | Tool | Test |
|---|------|------|
| 1 | Supertest | GET /api/health returns 200, status=ok | 
```bash
> toktickit-server@1.0.0 test
> vitest run


 RUN  v2.1.9 C:/KMUTT/3.1/Software/Week1/server

 ↓ tests/lab-01/categories.test.ts (1) [skipped]
 ✓ tests/lab-01/health.test.ts (1)

 Test Files  1 passed | 1 skipped (2)
      Tests  1 passed | 1 todo (2)
   Start at  13:01:25
   Duration  2.35s (transform 215ms, setup 0ms, collect 1.97s, tests 87ms, environment 1ms, prepare 980ms)
```   
| # | Tool | Test |
|---|------|------|
| 2 | Supertest | GET /api/categories returns 4 seeded categories in id order |

```bash
> toktickit-server@1.0.0 test
> vitest run


 RUN  v2.1.9 C:/KMUTT/3.1/Software/Week1/server

 ✓ tests/lab-01/categories.test.ts (1) 353ms
 ✓ tests/lab-01/health.test.ts (1)

 Test Files  2 passed (2)
      Tests  2 passed (2)
   Start at  13:07:18
   Duration  3.68s (transform 564ms, setup 0ms, collect 3.10s, tests 455ms, environment 2ms, prepare 1.92s)
```
| # | Tool | Test |
|---|------|------|
| 3 | Vitest | Heading renders | 

| # | Tool | Test |
|---|------|------|
| 4 | Vitest | Success state shows Online + category list | 

| # | Tool | Test |
|---|------|------|
| 5 | Vitest | Error state shows Offline + message | |

Paste your passing terminal output / screenshot below.
