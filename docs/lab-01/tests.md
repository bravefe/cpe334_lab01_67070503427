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
```bash
> toktickit-client@1.0.0 test
> vitest run


 RUN  v2.1.9 C:/KMUTT/3.1/Software/Week1/client

 ✓ tests/lab-01/App.test.tsx (3)
   ✓ App (3)
     ✓ renders the TokTickIT heading
     ↓ shows Online and the seeded categories on success [skipped]
     ↓ shows an Offline error message when the API is unavailable [skipped]

 Test Files  1 passed (1)
      Tests  1 passed | 2 todo (3)
   Start at  13:43:02
   Duration  4.72s (transform 153ms, setup 403ms, collect 463ms, tests 74ms, environment 2.73s, prepare 341ms)
```

| # | Tool | Test |
|---|------|------|
| 4 | Vitest | Success state shows Online + category list | 
| 5 | Vitest | Error state shows Offline + message |
```bash
> toktickit-client@1.0.0 test
> vitest run


 RUN  v2.1.9 C:/KMUTT/3.1/Software/Week1/client

 ✓ tests/lab-01/App.test.tsx (3) 576ms
   ✓ App (3) 570ms
     ✓ renders the TokTickIT heading
     ✓ shows Online and the seeded categories on success 303ms
     ✓ shows an Offline error message when the API is unavailable

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  14:28:20
   Duration  5.75s (transform 167ms, setup 447ms, collect 774ms, tests 576ms, environment 2.81s, prepare 351ms)
```
Paste your passing terminal output / screenshot below.
