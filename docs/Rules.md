# RefundDesk — Project Rules

These rules apply to everyone (and every AI coding assistant) working on RefundDesk. Read PRD.md for *what* we build and TRD.md for *how* it is designed. This file says **how we write the code**.

If a rule here conflicts with a request, follow the rule and flag the conflict.

---

## 1. Golden Rules (never break these)

1. **No refund without human approval.** Only `DecisionService` (after an APPROVER decision) may call `RefundService.execute()`.
2. **The AI agent is read-only.** Code in `agent/` must never import from `refund/` or call any write method in `casemgmt/`.
3. **Every refund uses an idempotency key** (`case-{caseId}`), backed by the unique DB constraint.
4. **Every case status change goes through `CaseStateMachine`** and writes an audit entry in the same transaction.
5. **Money is `BigDecimal` in Java, `NUMERIC(12,2)` in SQL, and a formatted string or number in the UI.** Never `double` or `float`.
6. **No secrets in code or Git.** Use environment variables; keep `.env.example` updated.
7. **Mock data only.** No real names, cards, UPI IDs or bank details anywhere.
8. **Never trust LLM output.** Validate schema, enums and amount limits in code before saving.

---

## 2. General Coding Rules

- Keep functions small and single-purpose (aim for under 30 lines).
- Use clear names: `approveCase`, not `doIt`; `refundAmount`, not `amt`.
- No commented-out code in commits. Delete it; Git remembers.
- No magic numbers or strings: use constants, enums or config.
- Handle errors explicitly; never swallow exceptions silently.
- Write the test with (or before) the code, not "later".
- Don't add a library without a reason written in the PR description.
- Prefer boring, readable code over clever code.

---

## 3. Backend Rules (Java + Spring Boot)

### 3.1 Structure
- Package by **domain** (`casemgmt`, `agent`, `refund`, `audit`, `auth`...), not by layer.
- Inside a domain: `Controller → Service → Repository`. Controllers never call repositories directly.
- Respect the module dependency rules in TRD.md §3.1. ArchUnit tests enforce them; don't disable those tests.

### 3.2 Controllers
- Thin: validate input, call one service method, return a DTO.
- Never return JPA entities. Always map to response DTOs (Java `record`s).
- Every request DTO uses Bean Validation (`@NotNull`, `@Size`, `@Positive`) and `@Valid`.
- Use correct HTTP status codes: `201` on create, `202` for async work, `409` for state conflicts.

### 3.3 Services
- Business rules live here, nowhere else.
- Methods that change data are `@Transactional`; read-only ones use `@Transactional(readOnly = true)`.
- Get the current user from `CurrentUser`, never from request parameters.
- Customers must only ever see their own data; filter by `currentUser.id()` in the query, return `404` otherwise.

### 3.4 Persistence
- Schema changes only through **new** Flyway migrations (`V{n}__description.sql`). Never edit a migration that has been merged.
- `spring.jpa.hibernate.ddl-auto` stays `validate`.
- Use `@Version` for optimistic locking on `Case`.
- No N+1 queries: use fetch joins or projections for lists.
- `audit_log` is append-only; no update or delete methods on `AuditRepository`.

### 3.5 Errors
- Throw domain exceptions (`InvalidTransitionException`, `AmountExceedsTransactionException`...).
- `GlobalExceptionHandler` maps them to the standard error body `{ code, message, traceId }`.
- Never expose stack traces, SQL or internal class names to clients.

### 3.6 Style
- Java 21 features welcome: `record`, `switch` expressions, `var` where the type is obvious.
- Constructor injection only (no `@Autowired` on fields). Use `final` fields.
- Format with the project formatter (Spotless + Google Java Format). CI fails on unformatted code.

---

## 4. AI Agent Rules

- All LLM access goes through the `LlmClient` interface. No provider SDK calls elsewhere.
- Prompts live in `resources/prompts/` as versioned files (`refund-investigator-v1.txt`). Changing a prompt means a new version file.
- Customer text (case description) is wrapped in `<case_data>...</case_data>` and treated as data, never instructions.
- Tools are read-only and scoped to the case's `userId`.
- Hard limits: max **3** LLM calls per case, temperature **0.1**, timeout **20 s**.
- On any failure (timeout, 429, invalid JSON, validation error after one retry) → set `NEEDS_MANUAL_REVIEW` and audit `AGENT_FAILED`. Never auto-approve.
- Store `model` and `promptVersion` with every proposal.
- Don't log full prompts or responses in production; log token counts, latency and outcome.
- Any prompt or tool change must keep the eval suite at **≥ 80%** accuracy. Report the before/after score in the PR.
- Unit tests use `FakeLlmClient`. Real LLM calls only in the tagged `eval` suite.

---

## 5. Security Rules

- Every new endpoint must be added to the role table in TRD.md §5.3 and covered by a `RoleAccessIT` test.
- Default deny: endpoints are authenticated unless explicitly public.
- Passwords hashed with BCrypt; never logged, never returned.
- Never log JWTs, passwords, API keys or full request bodies.
- CORS allow-list only; never `*` in prod.
- Validate and limit all input sizes (description ≤ 1000 chars, page size ≤ 100).
- Run `mvn dependency-check` / `pnpm audit` before releases; fix high/critical issues.

---

## 6. Frontend Rules (React + TypeScript)

### 6.1 Structure
- `packages/ui` = presentational components only. No API calls, no routing, no app state.
- `packages/api-client` = all HTTP calls and TanStack Query hooks. Apps never call `fetch` directly.
- `apps/*` = pages and routing; compose `ui` + `api-client`.
- One component per folder: `Component.tsx`, `Component.module.css`, `Component.test.tsx`, `Component.stories.tsx`, exported from `index.ts`.

### 6.2 TypeScript
- `strict: true`. No `any`; use `unknown` and narrow it.
- API types live in `api-client/types.ts` and match the TRD response shapes.
- Validate forms with Zod schemas; reuse them for types (`z.infer`).

### 6.3 Components
- Function components and hooks only.
- Props are typed interfaces; avoid boolean prop explosion (use a `variant` prop).
- Styles use design tokens (`var(--color-...)`, `var(--space-...)`), never hard-coded colours or pixel values outside tokens.
- Money is formatted with one helper (`formatINR`) using `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.
- Dates shown in IST with one helper (`formatDateTime`).

### 6.4 Accessibility (required, not optional)
- Every interactive element works with keyboard only; visible focus ring.
- Use semantic HTML first (`button`, `nav`, `ol`, `table`) before ARIA.
- Every input has a `<label>`; errors linked with `aria-describedby`.
- Status is never shown by colour alone: badge text + icon.
- Contrast ≥ 4.5:1 for text.
- Every `ui` component has an axe test; zero violations to merge.

### 6.5 State and Data
- Server state → TanStack Query. Local UI state → `useState`. No global store unless clearly needed.
- Show loading, empty and error states on every data view.
- Handle `401` globally: clear token, redirect to login.
- Poll case status only while `OPEN` or `INVESTIGATING`.

---

## 7. API Rules

- REST, JSON, plural nouns: `/api/cases/{id}/notes`.
- Actions that aren't CRUD use a sub-resource verb: `/decision`, `/rerun-agent`.
- Field names in `camelCase`. Dates in ISO-8601 UTC (`2026-11-24T10:30:00Z`).
- Lists are paginated: `{ items, page, size, total }`.
- All errors use `{ code, message, traceId }` with a code from the TRD error table. New codes must be added to the table.
- Don't break existing response fields; add new optional fields instead.
- Keep the OpenAPI annotations up to date for every endpoint.

---

## 8. Testing Rules

| What changed | Required tests |
| --- | --- |
| Business rule / state machine | Unit test for valid and invalid paths |
| New endpoint | MockMvc/integration test + role access test |
| Refund logic | Concurrency test proving one refund per key |
| DB migration | Testcontainers test runs all migrations |
| Agent / prompt | FakeLlmClient tests + eval score in PR |
| UI component | RTL behaviour test + axe test + Storybook story |

- Tests are independent; no reliance on run order or shared mutable data.
- Test names describe behaviour: `approve_whenAmountExceedsTransaction_returns422`.
- Backend business modules keep ≥ 70% line coverage.
- No `@Disabled` / `.skip` merged without a linked issue.

---

## 9. Logging and Observability Rules

- Logs are JSON with `traceId`; add `caseId` and `userId` to MDC when known.
- Levels: `ERROR` = needs action, `WARN` = unexpected but handled (e.g. LLM retry), `INFO` = business events (case created, decision made), `DEBUG` = local only.
- Log events, not essays: `event=REFUND_EXECUTED caseId=42 amount=499.00`.
- Add a Micrometer metric for every new business event.

---

## 10. Git and Workflow Rules

### 10.1 Branches
- `main` is always deployable and protected.
- Branch names: `feat/case-queue-filters`, `fix/refund-race`, `chore/upgrade-spring`, `docs/trd-auth`.

### 10.2 Commits (Conventional Commits)
```
feat(case): add approver decision endpoint
fix(refund): handle concurrent insert on same idempotency key
test(agent): add eval cases for failed-debit scenarios
docs(trd): document JWT claims
```
- Small, focused commits. One logical change each.

### 10.3 Pull Requests
- One feature or fix per PR, ideally under 400 changed lines.
- PR description: what, why, how tested, screenshots for UI changes, eval score for agent changes.
- CI must be green: build, lint, typecheck, tests, ArchUnit, axe.
- Self-review the diff before requesting review.
- Squash-merge into `main`.

### 10.4 Definition of Done
- [ ] Meets the acceptance criteria in PRD.md
- [ ] Tests added and passing
- [ ] Accessibility checked (keyboard + axe)
- [ ] Logs and metrics added for new business events
- [ ] API docs / TRD updated if contracts changed
- [ ] No secrets, no `console.log`, no `System.out.println`
- [ ] Deployed to dev/preview and smoke-tested

---

## 11. Documentation Rules

- `README.md` covers: what it is, architecture diagram, how to run locally, demo accounts, tech stack, screenshots.
- Update PRD.md when behaviour changes, TRD.md when design or contracts change, this file when a rule changes.
- Record significant decisions as short ADRs in `docs/adr/NNN-title.md` (context, decision, consequences).
- Public methods with non-obvious behaviour get a short Javadoc/TSDoc comment explaining *why*, not *what*.

---

## 12. Rules for AI Coding Assistants

When using an AI assistant (Claude, Copilot, Cursor...) on this repo:

1. Read PRD.md, TRD.md and this file before writing code.
2. Follow the existing folder structure and naming; don't invent new top-level folders.
3. Make the smallest change that solves the task; don't refactor unrelated code.
4. Never weaken a Golden Rule, security check, test or ArchUnit rule to make something pass.
5. Never add dependencies without saying why.
6. Always include or update tests with the code.
7. Never hard-code secrets, API keys or real personal data.
8. If a requirement is unclear or conflicts with these rules, stop and ask instead of guessing.
9. Explain non-obvious changes in the PR description.
10. The human developer reviews and understands every line before merging.
