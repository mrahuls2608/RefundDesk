# RefundDesk — Phases and Tasks

| Field | Value |
| --- | --- |
| Product | RefundDesk — AI-assisted refund and dispute desk |
| Author | M N Santhi Swarup |
| Version | 1.0 |
| Date | 24 Nov 2026 |
| Related | PRD.md, TRD.md, Rules.md, Design.md |

The build is split into **7 phases over ~4 weeks** (about 20 hours/week, 75–85 hours total). Each phase ends with a working, demo-able result and a Git tag.

Task IDs (`P1-03`) are used in branch names and commit messages: `feat/P1-03-jwt-auth`.

---

## Overview

| Phase | Name | Goal | Est. hours | Target week | Tag |
| --- | --- | --- | --- | --- | --- |
| 0 | Setup | Repo, tooling, local environment, CI skeleton | 5 | Week 1 | `v0.0` |
| 1 | Backend foundation | Schema, seed data, auth, transactions API | 12 | Week 1 | `v0.1` |
| 2 | Cases and refunds | Case flow, state machine, audit, idempotent refunds, decisions | 12 | Week 2 | `v0.2` |
| 3 | Component kit | Tokens + accessible shared components in Storybook | 10 | Week 2 | `v0.3` |
| 4 | Frontend apps | Customer Portal + Ops Console wired to API | 14 | Week 3 | `v0.4` (MVP without AI) |
| 5 | AI agent | Tool-calling agent, validation, fallback, eval suite | 12 | Week 3–4 | `v0.5` |
| 6 | Ship it | Observability, Docker, CI/CD, deployment, docs, demo | 12 | Week 4 | `v1.0` |

**Milestone A (end of Phase 4):** resume-ready MVP. Publish the repo and start sharing it.
**Milestone B (end of Phase 6):** full v1.0 live with AI, docs and demo video.

---

## Phase 0 — Setup (≈ 5 hrs)

**Goal:** an empty but runnable monorepo with tooling and CI.

| ID | Task | Est. | Done |
| --- | --- | --- | --- |
| P0-01 | Create GitHub repo `refunddesk` (public), add MIT license, `.gitignore`, branch protection on `main` | 0.5h | [ ] |
| P0-02 | Add `docs/` with PRD.md, TRD.md, Rules.md, Design.md, Phases.md; copy Rules.md to `CLAUDE.md` | 0.5h | [ ] |
| P0-03 | Generate Spring Boot 3 / Java 21 project in `backend/` (Web, Security, JPA, Validation, Flyway, Actuator, PostgreSQL) | 0.5h | [ ] |
| P0-04 | Add Spotless (Google Java Format), ArchUnit, Testcontainers, springdoc dependencies | 0.5h | [ ] |
| P0-05 | Create `frontend/` pnpm workspace: `packages/ui`, `packages/api-client`, `apps/customer`, `apps/ops` (Vite + React + TS strict) | 1h | [ ] |
| P0-06 | Configure ESLint, Prettier, Vitest, React Testing Library, vitest-axe in frontend | 0.5h | [ ] |
| P0-07 | `docker-compose.yml` with PostgreSQL 16; `.env.example` with all variables from TRD §12 | 0.5h | [ ] |
| P0-08 | Skeleton GitHub Actions: `backend-ci.yml` (mvn verify) and `frontend-ci.yml` (lint, typecheck, test, build) | 0.5h | [ ] |
| P0-09 | Create Neon project (`main` + `dev` branches), Render account, Vercel account; store nothing secret in repo | 0.5h | [ ] |

**Exit criteria**
- [ ] `docker compose up` starts Postgres; backend starts and `/actuator/health` returns `UP`
- [ ] `pnpm --filter customer dev` and `pnpm --filter ops dev` show blank apps
- [ ] Both CI workflows are green on `main`

---

## Phase 1 — Backend Foundation (≈ 12 hrs)

**Goal:** users can log in with roles, and customers can list their own transactions.

| ID | Task | Est. | Done |
| --- | --- | --- | --- |
| P1-01 | Flyway `V1__init_schema.sql`: all tables, constraints, unique indexes (TRD §4.1) | 1.5h | [ ] |
| P1-02 | `V2__policy_rules.sql`: rules for each issue type | 0.5h | [ ] |
| P1-03 | `V3__seed_demo_data.sql` (local/demo profile): 4 demo users (one per role), ~30 transactions incl. duplicate and failed-but-debited examples | 1h | [ ] |
| P1-04 | Entities + repositories: `User`, `Transaction`, `PolicyRule` | 1h | [ ] |
| P1-05 | `common/error`: `ApiError`, error codes enum, `GlobalExceptionHandler` | 1h | [ ] |
| P1-06 | `TraceIdFilter` (MDC + `X-Trace-Id` header) and JSON logging config | 1h | [ ] |
| P1-07 | `JwtService` (sign/verify HS256, claims), `JwtAuthFilter`, `SecurityConfig` (default deny, CORS allow-list) | 2h | [ ] |
| P1-08 | `POST /api/auth/login` with BCrypt check; `GET /api/me` | 1h | [ ] |
| P1-09 | Login rate limit (Bucket4j, 5/min per IP) | 0.5h | [ ] |
| P1-10 | `GET /api/transactions` (CUSTOMER, own only, paginated, `hasOpenCase` flag) | 1h | [ ] |
| P1-11 | Tests: JwtService unit, login IT (success, wrong password, rate limit), transactions ownership IT | 1.5h | [ ] |

**Exit criteria**
- [ ] Demo customer logs in via Swagger UI and sees only their transactions
- [ ] Wrong role or no token returns `403` / `401` with standard error body
- [ ] All migrations run in Testcontainers test
- [ ] Tag `v0.1`

---

## Phase 2 — Cases, Audit and Refunds (≈ 12 hrs)

**Goal:** the full case lifecycle works through the API (proposal written manually for now).

| ID | Task | Est. | Done |
| --- | --- | --- | --- |
| P2-01 | Entities + repos: `Case` (with `@Version`), `Proposal`, `Decision`, `Refund`, `AuditEntry`, `Note` | 1h | [ ] |
| P2-02 | `CaseStateMachine` with allowed-transition map + `InvalidTransitionException` | 1h | [ ] |
| P2-03 | `AuditService.record(...)` (append-only); call it inside every transition transaction | 1h | [ ] |
| P2-04 | `POST /api/cases` (one open case per transaction → `409 CASE_ALREADY_OPEN`) | 1h | [ ] |
| P2-05 | `GET /api/cases` (customer: own; ops: all, filters, sort, pagination) and `GET /api/cases/{id}` (role-shaped response) | 1.5h | [ ] |
| P2-06 | `POST /api/cases/{id}/notes`, `PUT /api/cases/{id}/proposal` (manual proposal, moves to PROPOSED) | 1h | [ ] |
| P2-07 | `RefundService.execute()` with idempotency key + unique-constraint race handling (TRD §7.2) | 1h | [ ] |
| P2-08 | `DecisionService` + `POST /api/cases/{id}/decision` (APPROVER only, amount ≤ txn, optimistic lock, approve → refund → close) | 1.5h | [ ] |
| P2-09 | `GET /api/cases/{id}/audit` | 0.5h | [ ] |
| P2-10 | ArchUnit test for module dependency rules (TRD §3.1) | 0.5h | [ ] |
| P2-11 | Tests: state machine unit (all valid/invalid transitions), `RefundIdempotencyIT` (10 parallel calls → 1 row), `RoleAccessIT` (every endpoint × every role), decision rules | 2h | [ ] |

**Exit criteria**
- [ ] Via API: customer creates case → ops writes proposal → approver approves → status `CLOSED`, one refund row, full audit trail
- [ ] Double-submitting a decision never creates a second refund
- [ ] Customer cannot call decision endpoint (`403`) or see another user's case (`404`)
- [ ] Tag `v0.2`

---

## Phase 3 — Component Kit (≈ 10 hrs)

**Goal:** an accessible, documented component library matching Design.md.

| ID | Task | Est. | Done |
| --- | --- | --- | --- |
| P3-01 | `tokens.css`: colours (light + dark), type, spacing, radius, shadow, motion (Design §3) | 1h | [ ] |
| P3-02 | Set up Storybook 8 with a11y addon and theme toggle | 0.5h | [ ] |
| P3-03 | `Button` (4 variants, 3 sizes, loading, disabled) | 0.5h | [ ] |
| P3-04 | `Input`, `Textarea` (with counter), `Select`, `RadioGroup` with label/helper/error | 1.5h | [ ] |
| P3-05 | `StatusBadge` (all states + customer mapping), `ConfidenceMeter` | 1h | [ ] |
| P3-06 | `AmountCard`, `TransactionRow` | 1h | [ ] |
| P3-07 | `StatusTimeline` (ordered list, `aria-current`) | 1h | [ ] |
| P3-08 | `AIProposalCard` (normal + failed variant) | 1h | [ ] |
| P3-09 | `Banner`, `Toast`, `Modal`/`ConfirmDialog` (focus trap, Esc, restore focus) | 1.5h | [ ] |
| P3-10 | `Table` (sortable headers, `aria-sort`, density), `EmptyState`, `Skeleton`, `Spinner` | 1h | [ ] |
| P3-11 | Helpers: `formatINR`, `formatDateTime` (IST) | 0.25h | [ ] |
| P3-12 | Every component: story + RTL test + axe test | (included above) | [ ] |

**Exit criteria**
- [ ] All components in Storybook, light and dark
- [ ] Zero axe violations; every component usable by keyboard only
- [ ] Tag `v0.3`

---

## Phase 4 — Frontend Apps (≈ 14 hrs) → Milestone A

**Goal:** both apps work end to end against the real API (no AI yet).

### 4A — Shared client
| ID | Task | Est. | Done |
| --- | --- | --- | --- |
| P4-01 | `api-client/http.ts`: base URL from env, JWT header, error mapping to `ApiError`, global 401 → logout | 1h | [ ] |
| P4-02 | `api-client/auth.ts` (login, token storage, `useCurrentUser`) and `types.ts` (TRD response shapes) | 1h | [ ] |
| P4-03 | Query hooks: `useTransactions`, `useCases`, `useCase` (polling while OPEN/INVESTIGATING), `useCreateCase`, `useAddNote`, `useUpdateProposal`, `useDecision`, `useAudit` | 1.5h | [ ] |

### 4B — Customer Portal
| ID | Task | Est. | Done |
| --- | --- | --- | --- |
| P4-04 | App shell, routing, route guard (CUSTOMER), page titles + focus on route change, skip link | 1h | [ ] |
| P4-05 | Login page | 0.5h | [ ] |
| P4-06 | My Transactions (grouped by date, Report issue / View case) | 1h | [ ] |
| P4-07 | Raise Case form (Zod validation, success toast, redirect) | 1h | [ ] |
| P4-08 | Case Status (timeline, outcome AmountCard, live region announcements) | 1h | [ ] |

### 4C — Ops Console
| ID | Task | Est. | Done |
| --- | --- | --- | --- |
| P4-09 | App shell with sidebar, routing, role guard (OPS/APPROVER/ADMIN) | 1h | [ ] |
| P4-10 | Case Queue (filter chips, type filter, sort, pagination, overdue flag, keyboard shortcuts) | 1.5h | [ ] |
| P4-11 | Case Detail (transaction, message, related txns with "Possible duplicate", notes, timeline/audit tabs, manual proposal editor) | 2h | [ ] |
| P4-12 | Approve / Reject dialogs (amount limit, required comment, 409 handling) | 1h | [ ] |
| P4-13 | Loading / empty / error / cold-start states on every page (Design §9) | 0.5h | [ ] |

**Exit criteria (Milestone A)**
- [ ] Customer raises a case → ops writes proposal → approver approves → customer sees "₹X refunded"
- [ ] Works on mobile width (320 px) and desktop; keyboard-only run-through passes
- [ ] README v0 with screenshots and local run steps
- [ ] Tag `v0.4`, add project to resume and portfolio

---

## Phase 5 — AI Agent (≈ 12 hrs)

**Goal:** cases are investigated automatically and proposals arrive for human approval.

| ID | Task | Est. | Done |
| --- | --- | --- | --- |
| P5-01 | `LlmClient` interface, `LlmMessage`, `ToolDefinition`, `LlmResponse` types | 0.5h | [ ] |
| P5-02 | `GroqLlmClient` (OpenAI-compatible chat + tools) using `RestClient` | 1.5h | [ ] |
| P5-03 | `GeminiLlmClient` (optional) and provider selection via `LLM_PROVIDER` | 1h | [ ] |
| P5-04 | Read-only tools: `GetTransactionsTool`, `GetTransactionTool`, `GetPolicyTool`, scoped to case user | 1h | [ ] |
| P5-05 | Prompt file `refund-investigator-v1.txt` + `PromptBuilder` (case data in `<case_data>` delimiters) | 1h | [ ] |
| P5-06 | `AgentService.investigate()`: tool loop, max 3 calls, temperature 0.1 | 1.5h | [ ] |
| P5-07 | `ProposalValidator`: JSON schema, action enum, amount ≤ txn; one retry with feedback | 1h | [ ] |
| P5-08 | Resilience4j retry/timeout; fallback → `NEEDS_MANUAL_REVIEW` + audit `AGENT_FAILED` | 1h | [ ] |
| P5-09 | Trigger agent after case creation commit (`@TransactionalEventListener` + `@Async`); `POST /rerun-agent` | 1h | [ ] |
| P5-10 | Show AI proposal and failed state in Ops Console (`AIProposalCard`, Re-run button) | 0.5h | [ ] |
| P5-11 | Tests with `FakeLlmClient`: happy path, tool calls, invalid JSON, amount too high, 429 retry, timeout fallback | 1h | [ ] |
| P5-12 | Eval suite: 20+ labelled cases in `agent-evals/cases.json`, `AgentEvalTest` (tag `eval`), record accuracy | 1h | [ ] |

**Exit criteria**
- [ ] New duplicate-charge case reaches `PROPOSED` within 15 s with sensible reasons
- [ ] LLM outage → case goes to Manual review, app keeps working
- [ ] Agent code has no path to refunds (ArchUnit green)
- [ ] Eval accuracy ≥ 80% recorded in README
- [ ] Tag `v0.5`

---

## Phase 6 — Ship It (≈ 12 hrs) → Milestone B

**Goal:** live, observable, documented v1.0.

### 6A — Observability
| ID | Task | Est. | Done |
| --- | --- | --- | --- |
| P6-01 | Micrometer metrics: cases created, proposals (by source), decisions, refunds, LLM calls/latency, agent agreement | 1h | [ ] |
| P6-02 | Expose `/actuator/prometheus` (ADMIN); optional Grafana Cloud free dashboard | 1h | [ ] |
| P6-03 | Verify no secrets/JWTs/prompts in prod logs | 0.25h | [ ] |

### 6B — Containers and CI/CD
| ID | Task | Est. | Done |
| --- | --- | --- | --- |
| P6-04 | Multi-stage `Dockerfile` (non-root, memory flags) per TRD §14.2 | 0.5h | [ ] |
| P6-05 | Finalise CI: Spotless check, ArchUnit, coverage report, Docker build | 1h | [ ] |
| P6-06 | `deploy.yml`: trigger Render deploy hook after green backend CI | 0.5h | [ ] |

### 6C — Deployment
| ID | Task | Est. | Done |
| --- | --- | --- | --- |
| P6-07 | Neon: run migrations on `dev` branch, then `main`; seed demo data | 0.5h | [ ] |
| P6-08 | Render: Docker web service, env vars, health check `/actuator/health` | 1h | [ ] |
| P6-09 | Vercel: two projects (customer, ops), `VITE_API_BASE_URL`, preview deploys on PRs | 0.5h | [ ] |
| P6-10 | DNS: `refunddesk.`, `ops.refunddesk.`, `api.refunddesk.` subdomains on mnsswarup.dev; update CORS | 0.5h | [ ] |
| P6-11 | Production smoke test (Release checklist, TRD §14.4) | 0.5h | [ ] |

### 6D — Docs and Demo
| ID | Task | Est. | Done |
| --- | --- | --- | --- |
| P6-12 | README: problem, architecture diagram, features, tech stack, live links, demo accounts, local setup, eval score, screenshots | 1.5h | [ ] |
| P6-13 | ADRs: `001-modular-monolith`, `002-idempotent-refunds`, `003-human-in-the-loop-agent` | 0.75h | [ ] |
| P6-14 | 2-minute demo video: raise case → AI proposal → approve → refunded; show audit log and a double-click test | 1h | [ ] |
| P6-15 | Add to portfolio (mnsswarup.dev), LinkedIn post, resume bullets | 0.5h | [ ] |

**Exit criteria (Milestone B)**
- [ ] Live URLs work end to end (allow ~1 min for first load)
- [ ] CI/CD green; push to `main` auto-deploys
- [ ] README, ADRs and demo video published
- [ ] Tag `v1.0`

---

## Backlog (post v1.0)

| ID | Item | Priority |
| --- | --- | --- |
| B-01 | In-app and email notifications on status change | Medium |
| B-02 | Agent accuracy dashboard in Ops Console | Medium |
| B-03 | Policy editor with versioning | Low |
| B-04 | Refresh tokens in httpOnly cookies | Medium |
| B-05 | Playwright E2E suite in CI | Medium |
| B-06 | Outbox + queue for async agent jobs | Low |
| B-07 | OpenTelemetry tracing | Low |
| B-08 | Extract agent / refund modules into separate services | Low |

---

## Weekly Schedule (suggested)

| Week | Weekdays (2 h/day) | Weekend (5 h/day) |
| --- | --- | --- |
| 1 | Phase 0, start Phase 1 (schema, auth) | Finish Phase 1, start Phase 2 |
| 2 | Phase 2 (cases, refunds, tests) | Phase 3 (component kit) |
| 3 | Phase 4 (apps) → **Milestone A** | Phase 5 (AI agent) |
| 4 | Finish Phase 5, start Phase 6 | Phase 6 (deploy, docs, demo) → **Milestone B** |

---

## Progress Tracking Rules

- Update the `Done` column (`[x]`) in the same PR that completes the task.
- One task ≈ one PR where possible; large tasks split into `P2-08a`, `P2-08b`.
- If a phase runs over by more than 50%, cut scope from that phase into the Backlog rather than delaying the milestone.
- Never skip the exit criteria; they are the definition of "phase done".
