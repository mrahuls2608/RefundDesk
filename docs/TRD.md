# RefundDesk — Technical Requirements Document (TRD)

| Field | Value |
| --- | --- |
| Product | RefundDesk — AI-assisted refund and dispute desk |
| Author | M N Santhi Swarup |
| Version | 1.0 (MVP) |
| Date | 24 Nov 2026 |
| Related | PRD.md |

This document specifies how RefundDesk is built: tech stack, architecture, folder structure, APIs, authentication, AI agent integration, testing, and deployment.

---

## 1. Architecture Overview

RefundDesk is a **modular monolith**: one Spring Boot deployable, split internally by domain, with two React apps sharing one component library, and PostgreSQL for storage.

```
                ┌───────────────────────────────────────────────┐
                │        Frontend monorepo (Vercel)              │
                │  apps/customer      apps/ops                   │
                │        └──── packages/ui (component kit) ────┘ │
                └───────────────────────┬───────────────────────┘
                                        │ HTTPS, Authorization: Bearer <JWT>
                ┌───────────────────────▼───────────────────────┐
                │       Spring Boot API (Render, Docker)         │
                │                                                │
                │  security ─► auth ─► case ─► agent ─► LLM API  │
                │                       │                         │
                │                       └──► refund               │
                │  audit · common · config                        │
                └───────────────────────┬───────────────────────┘
                                        │ JDBC (SSL)
                ┌───────────────────────▼───────────────────────┐
                │           PostgreSQL 16 (Neon)                  │
                └────────────────────────────────────────────────┘
```

### 1.1 Architectural Principles
1. **Human-in-the-loop:** the agent module has no access to refund code; only `case` calls `refund`, and only after an APPROVER decision.
2. **Idempotency by design:** refunds keyed by a unique `idempotency_key` in the database.
3. **Least privilege:** role checks on every endpoint; agent tools are read-only repository queries.
4. **Fail safe:** any AI failure results in `NEEDS_MANUAL_REVIEW`, never a crash or an automatic refund.
5. **Modules over microservices:** packages per domain with clear interfaces, so a module can be extracted later.

---

## 2. Tech Stack

### 2.1 Frontend
| Concern | Choice | Version |
| --- | --- | --- |
| Language | TypeScript | 5.x |
| Framework | React | 18.x |
| Build tool | Vite | 5.x |
| Monorepo | pnpm workspaces | 9.x |
| Routing | React Router | 6.x |
| Server state | TanStack Query | 5.x |
| Forms + validation | React Hook Form + Zod | latest |
| Styling | CSS Modules + design tokens (CSS variables) | — |
| Component docs | Storybook | 8.x |
| Testing | Vitest, React Testing Library, axe-core | latest |
| Lint / format | ESLint, Prettier | latest |

### 2.2 Backend
| Concern | Choice | Version |
| --- | --- | --- |
| Language | Java | 21 (LTS) |
| Framework | Spring Boot | 3.x |
| Web | Spring Web (REST) | — |
| Security | Spring Security + JJWT | — |
| Persistence | Spring Data JPA (Hibernate) | — |
| Migrations | Flyway | — |
| Validation | Jakarta Bean Validation | — |
| HTTP client (LLM) | Spring `RestClient` | — |
| Resilience | Resilience4j (retry, timeout) | 2.x |
| Observability | Spring Boot Actuator, Micrometer, Logback JSON encoder | — |
| API docs | springdoc-openapi (Swagger UI) | 2.x |
| Testing | JUnit 5, Mockito, Testcontainers (PostgreSQL), MockMvc | — |
| Build | Maven | 3.9.x |

### 2.3 Infrastructure
| Concern | Choice |
| --- | --- |
| Database | PostgreSQL 16 on Neon (free plan) |
| Backend hosting | Render free web service (Docker) |
| Frontend hosting | Vercel (two projects: customer, ops) |
| LLM | Groq API (default) or Gemini API; Ollama for offline dev |
| CI/CD | GitHub Actions |
| Containers | Docker, docker-compose for local |
| Domains | `refunddesk.mnsswarup.dev` (customer), `ops.refunddesk.mnsswarup.dev` (ops), `api.refunddesk.mnsswarup.dev` (API) |

---

## 3. Repository and Folder Structure

Single GitHub repository (monorepo) with frontend and backend side by side.

```
refunddesk/
├── README.md
├── docs/
│   ├── PRD.md
│   ├── TRD.md
│   └── diagrams/
│       └── architecture.png
├── docker-compose.yml               # postgres + backend for local dev
├── .github/
│   └── workflows/
│       ├── backend-ci.yml
│       ├── frontend-ci.yml
│       └── deploy.yml
│
├── backend/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/dev/mnsswarup/refunddesk/
│       │   │   ├── RefundDeskApplication.java
│       │   │   ├── config/                # CORS, OpenAPI, Jackson, clock
│       │   │   ├── common/
│       │   │   │   ├── error/             # ApiError, GlobalExceptionHandler, error codes
│       │   │   │   ├── logging/           # TraceIdFilter (MDC)
│       │   │   │   └── util/
│       │   │   ├── security/
│       │   │   │   ├── JwtService.java
│       │   │   │   ├── JwtAuthFilter.java
│       │   │   │   ├── SecurityConfig.java
│       │   │   │   └── CurrentUser.java
│       │   │   ├── auth/
│       │   │   │   ├── AuthController.java
│       │   │   │   ├── AuthService.java
│       │   │   │   └── dto/
│       │   │   ├── user/
│       │   │   │   ├── User.java, Role.java
│       │   │   │   ├── UserRepository.java
│       │   │   │   └── AdminUserController.java
│       │   │   ├── transaction/
│       │   │   │   ├── Transaction.java
│       │   │   │   ├── TransactionRepository.java
│       │   │   │   ├── TransactionController.java
│       │   │   │   └── TransactionService.java
│       │   │   ├── casemgmt/              # "case" is a Java keyword
│       │   │   │   ├── Case.java, CaseStatus.java, IssueType.java
│       │   │   │   ├── CaseStateMachine.java
│       │   │   │   ├── CaseController.java
│       │   │   │   ├── CaseService.java
│       │   │   │   ├── CaseRepository.java
│       │   │   │   ├── note/              # Note entity, repo, service
│       │   │   │   ├── decision/          # Decision entity, DecisionService
│       │   │   │   └── dto/
│       │   │   ├── agent/
│       │   │   │   ├── AgentService.java          # orchestrates LLM loop
│       │   │   │   ├── LlmClient.java              # interface
│       │   │   │   ├── GroqLlmClient.java
│       │   │   │   ├── GeminiLlmClient.java
│       │   │   │   ├── tools/                      # read-only tool implementations
│       │   │   │   │   ├── AgentTool.java
│       │   │   │   │   ├── GetTransactionsTool.java
│       │   │   │   │   ├── GetTransactionTool.java
│       │   │   │   │   └── GetPolicyTool.java
│       │   │   │   ├── prompt/                     # PromptBuilder, prompt version
│       │   │   │   ├── Proposal.java, ProposalRepository.java
│       │   │   │   └── ProposalValidator.java
│       │   │   ├── policy/
│       │   │   │   ├── PolicyRule.java, PolicyRepository.java
│       │   │   │   └── PolicyController.java
│       │   │   ├── refund/
│       │   │   │   ├── Refund.java, RefundStatus.java
│       │   │   │   ├── RefundRepository.java
│       │   │   │   ├── RefundService.java          # idempotent execute()
│       │   │   │   └── InternalRefundController.java
│       │   │   └── audit/
│       │   │       ├── AuditEntry.java
│       │   │       ├── AuditRepository.java
│       │   │       └── AuditService.java
│       │   └── resources/
│       │       ├── application.yml
│       │       ├── application-local.yml
│       │       ├── application-prod.yml
│       │       ├── logback-spring.xml
│       │       ├── prompts/
│       │       │   └── refund-investigator-v1.txt
│       │       └── db/migration/
│       │           ├── V1__init_schema.sql
│       │           ├── V2__policy_rules.sql
│       │           └── V3__seed_demo_data.sql
│       └── test/
│           ├── java/dev/mnsswarup/refunddesk/
│           │   ├── casemgmt/CaseStateMachineTest.java
│           │   ├── refund/RefundIdempotencyIT.java
│           │   ├── security/RoleAccessIT.java
│           │   └── agent/AgentServiceTest.java
│           └── resources/agent-evals/cases.json   # labelled eval cases
│
└── frontend/
    ├── package.json
    ├── pnpm-workspace.yaml
    ├── tsconfig.base.json
    ├── packages/
    │   ├── ui/                         # shared component kit
    │   │   ├── src/
    │   │   │   ├── tokens/tokens.css
    │   │   │   ├── Button/  (Button.tsx, Button.module.css, Button.test.tsx, Button.stories.tsx)
    │   │   │   ├── Input/
    │   │   │   ├── Select/
    │   │   │   ├── AmountCard/
    │   │   │   ├── TransactionRow/
    │   │   │   ├── StatusTimeline/
    │   │   │   ├── StatusBadge/
    │   │   │   ├── Banner/
    │   │   │   ├── Modal/
    │   │   │   ├── Table/
    │   │   │   └── index.ts
    │   │   └── package.json
    │   └── api-client/                 # typed fetch client, auth storage, query hooks
    │       └── src/
    │           ├── http.ts
    │           ├── auth.ts
    │           ├── types.ts
    │           └── hooks/
    └── apps/
        ├── customer/
        │   ├── src/
        │   │   ├── main.tsx, App.tsx, routes.tsx
        │   │   └── pages/ (Login, Transactions, RaiseCase, CaseStatus)
        │   ├── vite.config.ts
        │   └── vercel.json
        └── ops/
            ├── src/
            │   ├── main.tsx, App.tsx, routes.tsx
            │   └── pages/ (Login, CaseQueue, CaseDetail, Admin)
            ├── vite.config.ts
            └── vercel.json
```

### 3.1 Module Dependency Rules
| Module | May depend on | Must NOT depend on |
| --- | --- | --- |
| `agent` | `transaction`, `policy` (read-only repositories), `common` | `refund`, `casemgmt` write services |
| `casemgmt` | `agent`, `refund`, `audit`, `transaction`, `common` | — |
| `refund` | `audit`, `common` | `agent` |
| `security` | `user`, `common` | business modules |

Enforced with an ArchUnit test in CI.

---

## 4. Data Layer

### 4.1 Schema (Flyway `V1__init_schema.sql`, summarised)
```sql
CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  role          VARCHAR(20)  NOT NULL CHECK (role IN ('CUSTOMER','OPS','APPROVER','ADMIN')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE transactions (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id),
  amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency    CHAR(3) NOT NULL DEFAULT 'INR',
  merchant    VARCHAR(120) NOT NULL,
  status      VARCHAR(20) NOT NULL,          -- SUCCESS | FAILED | PENDING
  created_at  TIMESTAMPTZ NOT NULL
);

CREATE TABLE cases (
  id             BIGSERIAL PRIMARY KEY,
  user_id        BIGINT NOT NULL REFERENCES users(id),
  transaction_id BIGINT NOT NULL REFERENCES transactions(id),
  issue_type     VARCHAR(30) NOT NULL,
  description    VARCHAR(1000),
  status         VARCHAR(30) NOT NULL,
  version        INT NOT NULL DEFAULT 0,      -- optimistic locking
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- one open case per transaction
CREATE UNIQUE INDEX ux_open_case_per_txn ON cases(transaction_id)
  WHERE status NOT IN ('CLOSED');

CREATE TABLE proposals (
  id             BIGSERIAL PRIMARY KEY,
  case_id        BIGINT NOT NULL REFERENCES cases(id),
  action         VARCHAR(20) NOT NULL,       -- FULL_REFUND | PARTIAL_REFUND | REJECT
  amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
  reasons        JSONB NOT NULL,
  confidence     NUMERIC(3,2),
  model          VARCHAR(80),
  prompt_version VARCHAR(20),
  created_by     VARCHAR(40) NOT NULL,       -- 'AGENT' or user id
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE decisions (
  id           BIGSERIAL PRIMARY KEY,
  case_id      BIGINT NOT NULL REFERENCES cases(id),
  approver_id  BIGINT NOT NULL REFERENCES users(id),
  decision     VARCHAR(10) NOT NULL,        -- APPROVE | REJECT
  final_amount NUMERIC(12,2),
  comment      VARCHAR(500) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE refunds (
  id              BIGSERIAL PRIMARY KEY,
  case_id         BIGINT NOT NULL REFERENCES cases(id),
  amount          NUMERIC(12,2) NOT NULL,
  idempotency_key VARCHAR(80) NOT NULL UNIQUE,
  status          VARCHAR(20) NOT NULL,     -- PENDING | SUCCESS | FAILED
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id          BIGSERIAL PRIMARY KEY,
  case_id     BIGINT REFERENCES cases(id),
  actor_id    VARCHAR(40) NOT NULL,         -- user id or 'SYSTEM' / 'AGENT'
  action      VARCHAR(50) NOT NULL,
  from_status VARCHAR(30),
  to_status   VARCHAR(30),
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notes (
  id         BIGSERIAL PRIMARY KEY,
  case_id    BIGINT NOT NULL REFERENCES cases(id),
  author_id  BIGINT NOT NULL REFERENCES users(id),
  body       VARCHAR(2000) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE policy_rules (
  id          BIGSERIAL PRIMARY KEY,
  issue_type  VARCHAR(30) NOT NULL,
  rule_text   VARCHAR(1000) NOT NULL,
  max_days    INT,
  active      BOOLEAN NOT NULL DEFAULT true
);
```

### 4.2 Data Rules
- Money stored as `NUMERIC(12,2)`, handled as `BigDecimal` in Java. Never `double`.
- All timestamps `TIMESTAMPTZ`, stored in UTC, displayed in IST on the frontend.
- `audit_log` is append-only: no update/delete repository methods are exposed.
- `cases.version` provides optimistic locking so two approvers can't decide the same case at once.

---

## 5. Authentication and Authorization

### 5.1 Login Flow
```
Client                         API                              DB
  │  POST /api/auth/login        │                                │
  │  {email, password}  ───────► │  find user by email ─────────► │
  │                              │  BCrypt.matches(password)      │
  │                              │  sign JWT (HS256, 60 min)      │
  │ ◄─────── {accessToken,       │                                │
  │           expiresIn, user}   │                                │
  │                              │                                │
  │  GET /api/cases              │                                │
  │  Authorization: Bearer <jwt> │  JwtAuthFilter verifies        │
  │  ──────────────────────────► │  signature + expiry, sets      │
  │                              │  SecurityContext(userId, role) │
```

### 5.2 Token Details
| Item | Value |
| --- | --- |
| Algorithm | HS256, secret from `JWT_SECRET` env var (≥ 32 bytes) |
| Access token lifetime | 60 minutes |
| Claims | `sub` (user id), `role`, `name`, `iat`, `exp` |
| Storage (frontend) | In memory + `sessionStorage`; cleared on logout |
| Refresh | MVP: re-login on expiry. Post-MVP: refresh token in httpOnly cookie |
| Passwords | BCrypt, strength 10 |

### 5.3 Role-Based Access
Configured in `SecurityConfig` plus `@PreAuthorize` on methods.

| Endpoint pattern | CUSTOMER | OPS | APPROVER | ADMIN |
| --- | --- | --- | --- | --- |
| `POST /api/auth/login` | public | public | public | public |
| `GET /api/transactions` | own | — | — | — |
| `POST /api/cases` | ✓ | — | — | — |
| `GET /api/cases`, `GET /api/cases/{id}` | own | all | all | all |
| `POST /api/cases/{id}/notes` | — | ✓ | ✓ | ✓ |
| `PUT /api/cases/{id}/proposal` | — | ✓ | ✓ | ✓ |
| `POST /api/cases/{id}/rerun-agent` | — | ✓ | ✓ | ✓ |
| `POST /api/cases/{id}/decision` | — | — | ✓ | — |
| `GET /api/cases/{id}/audit` | — | ✓ | ✓ | ✓ |
| `/api/admin/**` | — | — | — | ✓ |
| `/internal/**` | not exposed publicly (in-process call; endpoint disabled in prod profile) |
| `/actuator/health` | public | | | |
| `/actuator/**` (others) | — | — | — | ✓ |

**Ownership check:** for CUSTOMER, `CaseService` and `TransactionService` always filter by `currentUser.id`; accessing another user's case returns `404` (not `403`) to avoid leaking existence.

### 5.4 Other Security Controls
- CORS allow-list: the two frontend origins only.
- Input validation on every DTO (`@NotNull`, `@Size`, `@Positive`); description max 1000 chars.
- Generic error messages; stack traces never returned.
- Secrets only in environment variables; `.env` in `.gitignore`.
- Case description is passed to the LLM as **data inside a delimited block**, never as instructions.
- Login endpoint rate-limited (Bucket4j, 5 attempts/min per IP).

---

## 6. API Specification

Base URL: `https://api.refunddesk.mnsswarup.dev`. All bodies JSON. OpenAPI docs at `/swagger-ui.html` (local profile only).

### 6.1 Conventions
- Auth header: `Authorization: Bearer <token>`
- Pagination: `?page=0&size=20` → `{ items, page, size, total }`
- Every response carries an `X-Trace-Id` header
- Error body:
```json
{ "code": "INVALID_TRANSITION", "message": "Case 42 cannot move from OPEN to APPROVED", "traceId": "7f3a1c" }
```

### 6.2 Error Codes
| HTTP | Code | When |
| --- | --- | --- |
| 400 | VALIDATION_FAILED | DTO validation error (includes `fields`) |
| 401 | UNAUTHENTICATED | Missing / invalid / expired token |
| 403 | FORBIDDEN | Role not allowed |
| 404 | NOT_FOUND | Resource missing or not owned |
| 409 | CASE_ALREADY_OPEN | Open case exists for transaction |
| 409 | INVALID_TRANSITION | State machine rejects transition |
| 409 | CONCURRENT_UPDATE | Optimistic lock failure |
| 422 | AMOUNT_EXCEEDS_TRANSACTION | Refund > original amount |
| 429 | RATE_LIMITED | Too many login attempts |
| 500 | INTERNAL_ERROR | Unexpected error |

### 6.3 Endpoints

**Auth**
```
POST /api/auth/login
Request:  { "email": "asha@demo.in", "password": "Demo@123" }
Response 200:
{
  "accessToken": "eyJhbGciOi...",
  "expiresIn": 3600,
  "user": { "id": 1, "name": "Asha", "role": "CUSTOMER" }
}

GET /api/me
Response 200: { "id": 1, "name": "Asha", "email": "asha@demo.in", "role": "CUSTOMER" }
```

**Transactions**
```
GET /api/transactions?page=0&size=20          (CUSTOMER)
Response 200:
{
  "items": [
    { "id": 101, "amount": 499.00, "currency": "INR", "merchant": "FoodNow",
      "status": "SUCCESS", "createdAt": "2026-11-20T13:05:10Z", "hasOpenCase": false }
  ],
  "page": 0, "size": 20, "total": 12
}
```

**Cases**
```
POST /api/cases                                (CUSTOMER)
Request:  { "transactionId": 101, "issueType": "DUPLICATE_CHARGE",
            "description": "Charged twice for one order" }
Response 201: { "id": 42, "status": "OPEN", "createdAt": "..." }

GET /api/cases?status=PROPOSED&issueType=DUPLICATE_CHARGE&page=0&size=20
Response 200: { "items": [ { "id": 42, "customerName": "Asha", "amount": 499.00,
                "issueType": "DUPLICATE_CHARGE", "status": "PROPOSED",
                "ageMinutes": 35 } ], "page": 0, "size": 20, "total": 1 }

GET /api/cases/42
Response 200:
{
  "id": 42,
  "status": "PROPOSED",
  "issueType": "DUPLICATE_CHARGE",
  "description": "Charged twice for one order",
  "transaction": { "id": 101, "amount": 499.00, "merchant": "FoodNow", "status": "SUCCESS" },
  "proposal": {
    "action": "FULL_REFUND", "amount": 499.00, "confidence": 0.92,
    "reasons": ["Identical ₹499 charge to FoodNow 40 seconds earlier (txn 100)"],
    "createdBy": "AGENT", "model": "llama-3.x", "promptVersion": "v1"
  },
  "decision": null,
  "refund": null,
  "timeline": [
    { "status": "OPEN", "at": "..." },
    { "status": "INVESTIGATING", "at": "..." },
    { "status": "PROPOSED", "at": "..." }
  ]
}
```
Customers receive the same shape without `proposal.reasons`, `confidence`, `model` and internal notes.

```
POST /api/cases/42/notes                       (OPS+)
Request:  { "body": "Customer confirmed single order" }
Response 201: { "id": 7, "author": "Ravi", "body": "...", "createdAt": "..." }

PUT /api/cases/42/proposal                     (OPS+)
Request:  { "action": "PARTIAL_REFUND", "amount": 250.00,
            "reasons": ["Only delivery fee charged twice"] }
Response 200: { ...updated proposal, "createdBy": "5" }

POST /api/cases/42/rerun-agent                 (OPS+)
Response 202: { "status": "INVESTIGATING" }

POST /api/cases/42/decision                    (APPROVER)
Request:  { "decision": "APPROVE", "finalAmount": 499.00,
            "comment": "Duplicate confirmed", "version": 3 }
Response 200: { "status": "REFUNDED", "refund": { "id": 9, "amount": 499.00,
                "status": "SUCCESS", "idempotencyKey": "case-42" } }

GET /api/cases/42/audit                        (OPS+)
Response 200: [ { "actor": "AGENT", "action": "PROPOSAL_CREATED",
                  "from": "INVESTIGATING", "to": "PROPOSED", "at": "..." } ]
```

**Admin**
```
GET  /api/admin/users
POST /api/admin/users          { "name", "email", "password", "role" }
GET  /api/admin/policies
PUT  /api/admin/policies/{id}  { "ruleText", "maxDays", "active" }
```

**Health and Metrics**
```
GET /actuator/health           → { "status": "UP" }
GET /actuator/metrics/refunddesk.cases.created
GET /actuator/prometheus       (ADMIN)
```

---

## 7. Core Logic

### 7.1 Case State Machine
`CaseStateMachine` holds an explicit allowed-transition map; `CaseService.transition(case, to, actor)` checks the map, updates status, and writes an audit entry **in the same DB transaction**.

```java
private static final Map<CaseStatus, Set<CaseStatus>> ALLOWED = Map.of(
    OPEN,                Set.of(INVESTIGATING),
    INVESTIGATING,       Set.of(PROPOSED, NEEDS_MANUAL_REVIEW),
    NEEDS_MANUAL_REVIEW, Set.of(PROPOSED),
    PROPOSED,            Set.of(APPROVED, REJECTED, INVESTIGATING),
    APPROVED,            Set.of(REFUNDED),
    REFUNDED,            Set.of(CLOSED),
    REJECTED,            Set.of(CLOSED)
);
```

### 7.2 Idempotent Refund
```java
@Transactional
public Refund execute(long caseId, BigDecimal amount, String idempotencyKey) {
    return refundRepository.findByIdempotencyKey(idempotencyKey)
        .orElseGet(() -> {
            try {
                return refundRepository.saveAndFlush(
                    Refund.success(caseId, amount, idempotencyKey));
            } catch (DataIntegrityViolationException e) {
                // concurrent request inserted first: return the existing row
                return refundRepository.findByIdempotencyKey(idempotencyKey).orElseThrow();
            }
        });
}
```
- Key format: `case-{caseId}` (one refund per case).
- The unique DB constraint is the real guarantee; the lookup is an optimisation.
- `RefundIdempotencyIT` fires 10 parallel calls and asserts exactly one row.

### 7.3 Decision Flow
```
DecisionService.decide(caseId, request, approver):
  1. load case with version check (optimistic lock)
  2. assert status == PROPOSED
  3. assert finalAmount <= transaction.amount
  4. save Decision
  5. if APPROVE: transition → APPROVED; refundService.execute(...); transition → REFUNDED → CLOSED
     if REJECT:  transition → REJECTED → CLOSED
  6. all steps in one @Transactional method
```

---

## 8. AI Agent Integration

### 8.1 Flow
```
CaseService.create() ──(after commit, @Async)──► AgentService.investigate(caseId)
   1. build prompt: system prompt (prompts/refund-investigator-v1.txt)
      + policy rules + case facts in <case_data> delimiters
   2. call LLM with tool definitions
   3. if model requests a tool → run read-only tool → send result back
   4. stop when model returns final JSON or after 3 LLM calls
   5. ProposalValidator: schema check, amount ≤ txn amount, action enum
   6. valid   → save Proposal, transition → PROPOSED
      invalid → retry once with error feedback → else NEEDS_MANUAL_REVIEW
```

### 8.2 LLM Client Abstraction
```java
public interface LlmClient {
    LlmResponse chat(List<LlmMessage> messages, List<ToolDefinition> tools);
}
```
- `GroqLlmClient` and `GeminiLlmClient` implement it; selected by `LLM_PROVIDER` env var.
- Tests use a `FakeLlmClient` returning scripted responses.

### 8.3 Tools
| Tool | Input | Output | Backed by |
| --- | --- | --- | --- |
| `getTransactions` | `userId`, `days` (≤ 30) | list of id, amount, merchant, status, time | `TransactionRepository` (read-only) |
| `getTransaction` | `transactionId` | one transaction | `TransactionRepository` |
| `getPolicy` | `issueType` | active rule text, max days | `PolicyRepository` |

Tool calls are scoped to the case's own `userId`; the agent cannot query other users.

### 8.4 Resilience Settings
| Setting | Value |
| --- | --- |
| HTTP timeout | 20 s |
| Retries on 429 / 5xx / timeout | 3, exponential backoff 1s → 2s → 4s |
| Max LLM calls per case | 3 |
| Temperature | 0.1 |
| Fallback | `NEEDS_MANUAL_REVIEW` + audit entry `AGENT_FAILED` |

### 8.5 Evaluation
- `src/test/resources/agent-evals/cases.json`: 20+ labelled cases (input transactions + expected action).
- `AgentEvalTest` (tagged `eval`, run nightly / manually against the real LLM) reports accuracy; target ≥ 80%.

---

## 9. Frontend Architecture

### 9.1 Structure
- `packages/ui`: presentational components only, no API calls. Each component ships with a test, a Storybook story and an axe accessibility test.
- `packages/api-client`: typed `fetch` wrapper that adds the JWT, maps error bodies to `ApiError`, and exposes TanStack Query hooks (`useCases`, `useCase`, `useDecision`...).
- `apps/customer`, `apps/ops`: pages and routing only; compose `ui` + `api-client`.

### 9.2 Routing
| App | Route | Page | Guard |
| --- | --- | --- | --- |
| customer | `/login` | Login | public |
| customer | `/` | Landing page | public |
| customer | `/transactions` | Transactions | CUSTOMER |
| customer | `/cases/new?txn=101` | RaiseCase | CUSTOMER |
| customer | `/cases/:id` | CaseStatus | CUSTOMER |
| ops | `/login` | Login | public |
| ops | `/` | CaseQueue | OPS, APPROVER, ADMIN |
| ops | `/cases/:id` | CaseDetail | OPS, APPROVER, ADMIN |
| ops | `/admin` | Admin | ADMIN |

### 9.3 Accessibility Requirements
- All interactive components reachable and operable by keyboard; visible focus ring from tokens.
- `StatusTimeline` rendered as an ordered list with `aria-current="step"`.
- Form errors linked via `aria-describedby`; Banner uses `role="alert"` for errors, `role="status"` for info.
- Modal traps focus and returns it on close; closes on `Esc`.
- Colour contrast ≥ 4.5:1; status never shown by colour alone (badge text + icon).

### 9.4 Polling
Case status pages poll `GET /api/cases/{id}` every 5 s while status is `OPEN` or `INVESTIGATING` (TanStack Query `refetchInterval`), then stop.

---

## 10. Observability

| Signal | Implementation |
| --- | --- |
| Trace ID | `TraceIdFilter` generates/propagates `X-Trace-Id`, puts it in MDC |
| Logs | JSON via logstash-logback-encoder; fields: timestamp, level, traceId, caseId, userId, event |
| Metrics | Micrometer counters/timers: `refunddesk.cases.created`, `refunddesk.proposals.created{source}`, `refunddesk.decisions{decision}`, `refunddesk.refunds{status}`, `refunddesk.llm.calls{outcome}`, `refunddesk.llm.latency` |
| Agent accuracy | `refunddesk.agent.agreement{agreed=true/false}` recorded when approver's decision matches/differs from proposal |
| Health | `/actuator/health` (DB check) used by Render health checks |
| Dashboard | Grafana Cloud free tier scraping `/actuator/prometheus` (optional) |

Never log passwords, JWTs or full LLM prompts in production; log prompt version and token counts only.

---

## 11. Testing Strategy

| Level | Tooling | Scope |
| --- | --- | --- |
| Unit (backend) | JUnit 5, Mockito | State machine, validators, decision rules, prompt builder |
| Integration (backend) | Spring Boot Test, Testcontainers PostgreSQL, MockMvc | Endpoints, security rules per role, idempotency under concurrency, Flyway migrations |
| Architecture | ArchUnit | Module dependency rules (section 3.1) |
| Agent | FakeLlmClient tests + eval suite | Tool loop, retries, fallback, accuracy |
| Unit (frontend) | Vitest, React Testing Library | Components and hooks |
| Accessibility | jest-axe / vitest-axe | Every `ui` component |
| E2E (post-MVP) | Playwright | Raise case → approve → refunded |

Coverage target: ≥ 70% lines on backend business modules.

---

## 12. Configuration

### 12.1 Environment Variables
| Variable | Used by | Example |
| --- | --- | --- |
| `SPRING_PROFILES_ACTIVE` | backend | `prod` |
| `DATABASE_URL` | backend | `jdbc:postgresql://<host>.neon.tech/refunddesk?sslmode=require` |
| `DATABASE_USERNAME` / `DATABASE_PASSWORD` | backend | — |
| `JWT_SECRET` | backend | 32+ random bytes |
| `JWT_TTL_MINUTES` | backend | `60` |
| `CORS_ALLOWED_ORIGINS` | backend | `https://refunddesk.mnsswarup.dev,https://ops.refunddesk.mnsswarup.dev` |
| `LLM_PROVIDER` | backend | `groq` / `gemini` / `ollama` |
| `LLM_API_KEY` | backend | — |
| `LLM_MODEL` | backend | model id from provider console |
| `VITE_API_BASE_URL` | frontend | `https://api.refunddesk.mnsswarup.dev` |

A `.env.example` file documents all variables; real values live only in Render/Vercel/GitHub secrets.

### 12.2 `application.yml` (excerpt)
```yaml
spring:
  datasource:
    url: ${DATABASE_URL}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}
    hikari:
      maximum-pool-size: 5
  jpa:
    open-in-view: false
    hibernate.ddl-auto: validate
  flyway:
    enabled: true

app:
  jwt:
    secret: ${JWT_SECRET}
    ttl-minutes: ${JWT_TTL_MINUTES:60}
  cors:
    allowed-origins: ${CORS_ALLOWED_ORIGINS}
  llm:
    provider: ${LLM_PROVIDER:groq}
    api-key: ${LLM_API_KEY}
    model: ${LLM_MODEL}
    timeout-seconds: 20
    max-calls-per-case: 3

management:
  endpoints.web.exposure.include: health,metrics,prometheus
  endpoint.health.probes.enabled: true
```

---

## 13. Local Development

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: refunddesk
      POSTGRES_USER: refunddesk
      POSTGRES_PASSWORD: refunddesk
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]

  backend:
    build: ./backend
    env_file: .env
    environment:
      SPRING_PROFILES_ACTIVE: local
      DATABASE_URL: jdbc:postgresql://postgres:5432/refunddesk
    ports: ["8080:8080"]
    depends_on: [postgres]

volumes:
  pgdata:
```

```bash
# backend + db
docker compose up -d
# frontend
cd frontend && pnpm install
pnpm --filter customer dev    # http://localhost:5173
pnpm --filter ops dev         # http://localhost:5174
pnpm --filter ui storybook    # http://localhost:6006
```

Demo accounts are created by `V3__seed_demo_data.sql` (local and demo profiles only): one customer, one ops agent, one approver, one admin.

---

## 14. Deployment

### 14.1 Topology
| Piece | Platform | Notes |
| --- | --- | --- |
| Backend | Render web service (Docker, free) | Health check `/actuator/health`; sleeps after 15 min idle |
| Database | Neon (free) | SSL required; separate `dev` branch for testing migrations |
| Customer app | Vercel project `refunddesk-customer` | Root `frontend/apps/customer` |
| Ops app | Vercel project `refunddesk-ops` | Root `frontend/apps/ops` |
| DNS | Existing `mnsswarup.dev` domain | CNAMEs to Vercel and Render |

### 14.2 Backend Dockerfile
```dockerfile
# build stage
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q dependency:go-offline
COPY src ./src
RUN mvn -q package -DskipTests

# run stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/target/refunddesk-*.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
```
Runs as a non-root user; memory tuned for Render's 512 MB free instance.

### 14.3 CI/CD (GitHub Actions)
```yaml
# .github/workflows/backend-ci.yml
name: backend-ci
on:
  push: { branches: [main], paths: ["backend/**"] }
  pull_request: { paths: ["backend/**"] }
jobs:
  test:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: backend } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: "21", cache: maven }
      - run: mvn -B verify          # unit + Testcontainers integration + ArchUnit
      - run: docker build -t refunddesk-backend .
```

```yaml
# .github/workflows/frontend-ci.yml
name: frontend-ci
on:
  push: { branches: [main], paths: ["frontend/**"] }
  pull_request: { paths: ["frontend/**"] }
jobs:
  test:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: frontend } }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm, cache-dependency-path: frontend/pnpm-lock.yaml }
      - run: pnpm install --frozen-lockfile
      - run: pnpm -r lint
      - run: pnpm -r typecheck
      - run: pnpm -r test
      - run: pnpm -r build
```

```yaml
# .github/workflows/deploy.yml
name: deploy
on:
  workflow_run:
    workflows: [backend-ci]
    branches: [main]
    types: [completed]
jobs:
  deploy-backend:
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest
    steps:
      - run: curl -fsS -X POST "${{ secrets.RENDER_DEPLOY_HOOK_URL }}"
```
Frontend deploys happen automatically through Vercel's Git integration (preview deploy per PR, production on `main`).

### 14.4 Release Checklist
1. CI green on `main`.
2. Flyway migration tested on Neon `dev` branch.
3. Render deploy succeeds and `/actuator/health` returns `UP`.
4. Smoke test: log in as customer → raise case → log in as approver → approve → status `REFUNDED`.

---

## 15. Non-Functional Targets

| Area | Target |
| --- | --- |
| API latency (warm, non-AI) | p95 < 500 ms |
| Agent proposal time | < 15 s |
| Cold start (free tier) | ~1 min, shown with a loading state |
| Duplicate refunds | 0 |
| Accessibility | WCAG 2.1 AA, zero critical axe violations |
| Availability | Best effort on free tier (demo project) |

---

## 16. Future Technical Enhancements
- Refresh tokens in httpOnly cookies
- Outbox table + message queue for async agent jobs instead of `@Async`
- Extract `agent` and `refund` into separate services once load requires it
- Playwright E2E suite in CI
- OpenTelemetry tracing across frontend and backend
