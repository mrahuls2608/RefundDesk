# RefundDesk — Product Requirements Document

| Field | Value |
| --- | --- |
| Product | RefundDesk — AI-assisted refund and dispute desk |
| Author | M N Santhi Swarup |
| Version | 1.0 (MVP) |
| Date | 24 Nov 2026 |
| Status | Draft |

---

## 1. Summary

RefundDesk is a web platform that resolves payment disputes ("charged twice", "order failed but money debited") faster and more safely. An AI agent investigates each case and proposes a resolution. A human approver makes the final decision. A refund is executed only after approval, exactly once.

**Core principle:** the AI investigates and proposes; humans approve; money moves only through an idempotent API.

---

## 2. Problem Statement

- Customers whose payment fails or is duplicated get no clear way to report it or track progress.
- Support teams investigate every case by hand: finding the transaction, checking the policy, deciding the outcome. This is slow and inconsistent.
- Mistakes are expensive: a duplicate or wrong refund is real money lost, and there is often no clear record of who decided what.

---

## 3. Goals and Non-Goals

### 3.1 Goals

1. Let customers raise a dispute against a specific transaction and track it to closure.
2. Cut investigation time by having an AI agent gather facts and propose a resolution with reasons.
3. Guarantee that no refund happens without human approval.
4. Guarantee that each approved refund is executed exactly once, even with retries or double clicks.
5. Keep a complete audit trail of every action on every case.
6. Provide an accessible UI built from one shared component kit.

### 3.2 Non-Goals (MVP)

- Integrating with a real payment gateway or bank (all transactions are mock data).
- Fully automatic refunds without human review.
- Chargeback handling with card networks.
- Multi-currency and multi-language support.
- Native mobile apps (the web UI is responsive).

---

## 4. Users and Personas

| Persona | Description | Primary need |
| --- | --- | --- |
| Customer | Uses the payments app; has a failed or duplicate charge | Report the issue easily and see clear status |
| Ops Agent | Support team member handling the case queue | Quickly understand each case, with facts already gathered |
| Approver | Senior ops / finance member | Make a confident, auditable refund decision |
| Admin | Platform owner | Manage users, roles and refund policy rules |

---

## 5. User Stories

### Customer
- **C1.** As a customer, I can log in and see my recent transactions.
- **C2.** As a customer, I can raise a case on a transaction and choose an issue type (duplicate charge, failed but debited, wrong amount, other) with a short description.
- **C3.** As a customer, I can see the status of my case on a timeline.
- **C4.** As a customer, I can see the final outcome and refund amount.

### Ops Agent
- **O1.** As an ops agent, I can see a queue of cases filtered by status and sorted by age.
- **O2.** As an ops agent, I can open a case and see the transaction, customer history, AI proposal, reasons and confidence.
- **O3.** As an ops agent, I can add internal notes and edit the proposed amount before sending it for approval.
- **O4.** As an ops agent, I can re-run the AI investigation if new information is added.

### Approver
- **A1.** As an approver, I can approve, edit or reject a proposal with a mandatory comment.
- **A2.** As an approver, I can see who did what on a case in the audit log.

### Admin
- **AD1.** As an admin, I can create users and assign roles.
- **AD2.** As an admin, I can view and update refund policy rules used by the agent.

---

## 6. Functional Requirements

### 6.1 Authentication and Authorization
| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | Users log in with email and password; the server issues a JWT | Must |
| FR-2 | Roles: CUSTOMER, OPS, APPROVER, ADMIN, checked on every endpoint | Must |
| FR-3 | Customers can only see their own transactions and cases | Must |
| FR-4 | Only APPROVER can call the decision endpoint | Must |
| FR-5 | Passwords stored hashed (BCrypt) | Must |

### 6.2 Transactions
| ID | Requirement | Priority |
| --- | --- | --- |
| FR-6 | Seed script creates mock users and transactions, including duplicate and failed-but-debited cases | Must |
| FR-7 | List transactions for the logged-in customer with status, amount, merchant, date | Must |

### 6.3 Case Management
| ID | Requirement | Priority |
| --- | --- | --- |
| FR-8 | Customer creates a case linked to one transaction | Must |
| FR-9 | Only one open case allowed per transaction | Must |
| FR-10 | Case follows the state machine in section 7; invalid transitions are rejected | Must |
| FR-11 | Ops queue with filters (status, type) and sort (oldest first) | Must |
| FR-12 | Internal notes on a case, visible only to OPS/APPROVER/ADMIN | Should |

### 6.4 AI Agent
| ID | Requirement | Priority |
| --- | --- | --- |
| FR-13 | Agent runs automatically when a case is created | Must |
| FR-14 | Agent uses read-only tools: `getTransactions(userId)`, `getTransaction(id)`, `getPolicy(issueType)` | Must |
| FR-15 | Agent output is structured JSON: action (FULL_REFUND, PARTIAL_REFUND, REJECT), amount, reasons, confidence (0–1) | Must |
| FR-16 | Output is validated against a schema; invalid output is retried once, then the case goes to manual review | Must |
| FR-17 | Agent cannot call any write or refund endpoint | Must |
| FR-18 | Maximum 3 LLM calls per case | Must |
| FR-19 | Ops can re-run the agent on a case | Should |

### 6.5 Approval and Refund
| ID | Requirement | Priority |
| --- | --- | --- |
| FR-20 | Approver approves, edits amount, or rejects, with a required comment | Must |
| FR-21 | Refund amount can never exceed the original transaction amount | Must |
| FR-22 | On approval, Refund Service is called with `Idempotency-Key: case-{caseId}` | Must |
| FR-23 | Repeated calls with the same key return the original result and create no new refund | Must |
| FR-24 | Refund status recorded (PENDING, SUCCESS, FAILED) | Must |

### 6.6 Audit Log
| ID | Requirement | Priority |
| --- | --- | --- |
| FR-25 | Every state change writes: case, actor, action, from-status, to-status, timestamp | Must |
| FR-26 | Audit entries are append-only (no update or delete endpoint) | Must |
| FR-27 | Audit log visible on the case detail page for OPS/APPROVER/ADMIN | Must |

### 6.7 Notifications (post-MVP)
| ID | Requirement | Priority |
| --- | --- | --- |
| FR-28 | In-app notification to customer on status change | Could |
| FR-29 | Email notification on case close | Could |

---

## 7. Case State Machine

```
OPEN ──► INVESTIGATING ──► PROPOSED ──► APPROVED ──► REFUNDED ──► CLOSED
                │               │
                │               └──────► REJECTED ─────────────► CLOSED
                └──► NEEDS_MANUAL_REVIEW ──► PROPOSED (ops writes proposal)
```

| From | To | Triggered by |
| --- | --- | --- |
| OPEN | INVESTIGATING | System, on case creation |
| INVESTIGATING | PROPOSED | AI agent returns valid proposal |
| INVESTIGATING | NEEDS_MANUAL_REVIEW | LLM failure or invalid output |
| NEEDS_MANUAL_REVIEW | PROPOSED | Ops agent writes proposal |
| PROPOSED | APPROVED | Approver |
| PROPOSED | REJECTED | Approver |
| APPROVED | REFUNDED | Refund Service success |
| REFUNDED / REJECTED | CLOSED | System |

---

## 8. System Architecture

```
┌──────────────────── React + TS frontend (Vercel) ────────────────────┐
│     Customer Portal                         Ops Console               │
│              (one shared accessible component kit)                    │
└───────────────────────────────┬───────────────────────────────────────┘
                                │ HTTPS + JWT
                    ┌───────────▼────────────┐
                    │ API layer               │
                    │ Spring Security: JWT,   │
                    │ RBAC, input validation  │
                    └───────────┬────────────┘
┌────────────── Spring Boot backend (Render), modular monolith ─────────┐
│                                                                        │
│  ┌──────────────┐  requests   ┌──────────────┐  approved  ┌───────────┐ │
│  │ AI Agent     │◄────────────│ Case Service │───────────►│ Refund    │ │
│  │ Service      │  proposal   │ state machine│            │ Service   │ │
│  │ (read-only)  │             │ + audit log  │            │ idempotent│ │
│  └──────┬───────┘             └──────┬───────┘            └─────┬─────┘ │
└─────────┼────────────────────────────┼──────────────────────────┼──────┘
          │ tool calls                 │                          │
   ┌──────▼────────┐          ┌────────▼──────────────────────────▼──────┐
   │ LLM API       │          │ PostgreSQL (Neon)                         │
   │ Groq / Gemini │          │ users, transactions, cases, proposals,    │
   └───────────────┘          │ refunds, audit_log                        │
                              └───────────────────────────────────────────┘
```

### 8.1 Components
| Component | Responsibility | Tech |
| --- | --- | --- |
| Customer Portal | Raise case, view transactions, track status | React, TypeScript, Vite |
| Ops Console | Queue, case detail, proposal review, decisions | React, TypeScript, Vite |
| Component kit | Button, Input, AmountCard, TransactionRow, StatusTimeline, Banner, Modal, Table | React, TypeScript, Storybook |
| API layer | Auth, role checks, validation, consistent error format | Spring Security, Bean Validation |
| Case Service | Case CRUD, state machine, orchestration, audit log | Spring Boot |
| AI Agent Service | LLM tool-calling loop, proposal generation | Spring AI or HTTP client |
| Refund Service | Executes approved refunds exactly once | Spring Boot |
| Database | Persistent storage, migrations | PostgreSQL (Neon), Flyway |
| LLM | Reasoning over case facts | Groq (Llama) or Gemini Flash |

### 8.2 End-to-end Flow
1. Customer raises a case → `POST /api/cases` → **OPEN**.
2. Case Service triggers the agent → **INVESTIGATING**.
3. Agent calls `getTransactions`, `getPolicy`; sends facts to the LLM; validates JSON output → **PROPOSED**.
4. Approver reviews in the Ops Console → `POST /api/cases/{id}/decision` → **APPROVED** or **REJECTED**.
5. On approval, Case Service calls Refund Service with an idempotency key → **REFUNDED**.
6. Each step writes an audit entry → **CLOSED**.

---

## 9. Data Model

| Table | Columns |
| --- | --- |
| users | id (PK), name, email (unique), password_hash, role, created_at |
| transactions | id (PK), user_id (FK), amount, currency, merchant, status (SUCCESS, FAILED, PENDING), created_at |
| cases | id (PK), user_id (FK), transaction_id (FK), issue_type, description, status, created_at, updated_at |
| proposals | id (PK), case_id (FK), action, amount, reasons, confidence, model, created_by (AGENT / user id), created_at |
| decisions | id (PK), case_id (FK), approver_id (FK), decision, final_amount, comment, created_at |
| refunds | id (PK), case_id (FK), amount, idempotency_key (unique), status, created_at |
| audit_log | id (PK), case_id (FK), actor_id, action, from_status, to_status, details (JSON), created_at |
| notes | id (PK), case_id (FK), author_id (FK), body, created_at |

---

## 10. API Specification

| Method | Endpoint | Role | Description |
| --- | --- | --- | --- |
| POST | /api/auth/login | Public | Returns JWT |
| GET | /api/me | Any | Current user profile |
| GET | /api/transactions | CUSTOMER | Own transactions |
| POST | /api/cases | CUSTOMER | Create case `{transactionId, issueType, description}` |
| GET | /api/cases | Any | Customer: own cases; Ops: all, with filters |
| GET | /api/cases/{id} | Owner / OPS+ | Case detail with proposal, timeline |
| POST | /api/cases/{id}/notes | OPS+ | Add internal note |
| POST | /api/cases/{id}/rerun-agent | OPS+ | Re-run AI investigation |
| PUT | /api/cases/{id}/proposal | OPS+ | Edit or write proposal |
| POST | /api/cases/{id}/decision | APPROVER | `{decision, finalAmount, comment}` |
| GET | /api/cases/{id}/audit | OPS+ | Audit entries |
| POST | /internal/refunds | System only | Header `Idempotency-Key`; executes refund |
| GET | /actuator/health, /actuator/metrics | Admin | Health and metrics |

**Error format (all endpoints):**
```json
{ "code": "INVALID_TRANSITION", "message": "Case 42 cannot move from OPEN to APPROVED", "traceId": "a1b2c3" }
```

---

## 11. AI Agent Design

**Prompt contract**
- System prompt: role ("refund investigator"), policy rules, output schema, instruction to never invent transactions.
- Tools (read-only): `getTransactions(userId, days)`, `getTransaction(id)`, `getPolicy(issueType)`.

**Output schema**
```json
{
  "action": "FULL_REFUND | PARTIAL_REFUND | REJECT",
  "amount": 499.00,
  "reasons": ["Two identical charges of ₹499 to the same merchant 40 seconds apart"],
  "confidence": 0.92
}
```

**Guardrails**
- Schema validation; one retry on invalid output, then NEEDS_MANUAL_REVIEW.
- Amount cannot exceed the transaction amount (checked in code, not trusted from the LLM).
- Retry with exponential backoff on 429 / timeout; max 3 LLM calls per case.
- Model name and prompt version stored with each proposal.

**Evaluation**
- Eval set of 20+ labelled sample cases (duplicate, failed-debit, valid charge, ambiguous).
- Metric: % of proposals matching the expected action; tracked in CI.

---

## 12. Non-Functional Requirements

| Category | Requirement |
| --- | --- |
| Security | JWT auth, role checks on every endpoint, BCrypt passwords, input validation, no secrets in code (env vars), CORS restricted to frontend domain |
| Reliability | Idempotent refunds; DB transaction around state change + audit write; graceful LLM fallback |
| Performance | Non-AI API p95 < 500 ms (warm); agent proposal < 15 s |
| Accessibility | WCAG 2.1 AA: keyboard navigation, visible focus, ARIA labels, 4.5:1 contrast, screen-reader-friendly status timeline |
| Observability | JSON logs with traceId and caseId; metrics: cases created, proposals, approval rate, agent accuracy, refund failures, LLM errors |
| Maintainability | Layered packages per domain (case, agent, refund, auth); 70%+ backend test coverage on core logic |
| Data | Mock data only; no real payment or personal data |

---

## 13. UI Screens

| Screen | App | Key elements |
| --- | --- | --- |
| Login | Both | Email, password, error banner |
| My Transactions | Customer | TransactionRow list, "Report issue" button |
| Raise Case | Customer | Issue type select, description, submit |
| Case Status | Customer | StatusTimeline, outcome AmountCard |
| Case Queue | Ops | Table with filters, status badges, age |
| Case Detail | Ops | Transaction, AI proposal + reasons + confidence, notes, audit log, Approve / Edit / Reject (approver only) |
| Admin | Ops | Users and roles, policy rules |

---

## 14. Tech Stack and Hosting (₹0)

| Layer | Choice | Hosting |
| --- | --- | --- |
| Frontend | React 18, TypeScript, Vite, React Router, TanStack Query | Vercel / Netlify |
| Backend | Java 21, Spring Boot 3, Spring Security, Spring Data JPA | Render free web service |
| Database | PostgreSQL, Flyway | Neon free plan |
| AI | Groq or Gemini free API (Ollama for offline) | Provider free tier |
| Testing | JUnit 5, Mockito, Testcontainers, Vitest, React Testing Library | GitHub Actions |
| DevOps | Docker, docker-compose, GitHub Actions | Free for public repos |

Known free-tier limits: backend sleeps after 15 min idle (~1 min cold start); LLM rate limits handled by retry and fallback.

---

## 15. Milestones

| Week | Deliverable |
| --- | --- |
| 1 | Backend: schema, seed data, auth + roles, transactions API, idempotent refund API, tests |
| 2 | Component kit, Customer Portal, Ops Console (without AI) |
| 3 | AI agent, state machine, audit log, fallback, eval set |
| 4 | Docker, CI/CD, logs + metrics, deployment, README, demo video |

---

## 16. Success Metrics

| Metric | Target |
| --- | --- |
| Duplicate refunds | 0 (verified by idempotency tests) |
| Agent proposal accuracy on eval set | ≥ 80% |
| Cases with complete audit trail | 100% |
| Accessibility audit (axe) critical issues | 0 |
| CI pipeline | Green on every merge to main |

---

## 17. Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| LLM gives wrong proposal | Wrong refund suggested | Human approval required; amount capped in code; eval set |
| LLM rate limit / outage | Cases stuck | Retry + backoff, then manual review path |
| Double refund from retries | Money loss | Unique idempotency key in DB |
| Free backend cold start | Slow first load in demo | Open app before demo; show loading state |
| Prompt injection via case description | Agent misled | Treat description as data, strict output schema, read-only tools |

---

## 18. Future Enhancements

- Notifications (in-app and email)
- Agent accuracy dashboard comparing AI proposals with final decisions
- Policy editor with versioning
- Rate limiting at the API layer
- Event queue for async agent processing
- Split modules into separate services when load requires
