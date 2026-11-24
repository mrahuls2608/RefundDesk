# RefundDesk — Stack Mapping

PRD, TRD, Design and Phases were written for Java/Spring Boot + PostgreSQL + two Vite apps.
The project is implemented on **Next.js + Express + TypeScript + MongoDB + Redis + Tailwind**.
Product behaviour, API contracts, roles, error codes and golden rules are unchanged; this table
records how each technical decision maps. Where this file and TRD.md disagree, this file wins.

| TRD (original) | Implementation | Notes |
| --- | --- | --- |
| Spring Boot 3 / Java 21 | Express 5 + TypeScript (strict), Node 22 | `backend/` |
| Package by domain | `backend/src/modules/<domain>` | user, auth, transaction, policy, casemgmt, agent, refund, audit, admin |
| PostgreSQL + Flyway | MongoDB (replica set) + Mongoose | Replica set required for multi-document transactions |
| `NUMERIC(12,2)` / `BigDecimal` | Integer **paise** (`amountPaise`) | API still returns rupees with 2 decimals; no float arithmetic |
| `BIGSERIAL` ids | Numeric `_id` from an atomic `counters` collection | Keeps `Case #42` and key `case-42` |
| `ux_open_case_per_txn` partial index | Partial unique index on `{transactionId}` where `isOpen: true` | `isOpen` is denormalised from status |
| `@Version` optimistic locking | `version` field + `findOneAndUpdate({_id, version})` | 409 `CONCURRENT_UPDATE` |
| `@Transactional` state change + audit | `withTransaction()` (MongoDB session) | `caseTransitions.ts` is the only status writer |
| Refund unique `idempotency_key` | Unique index `ux_refund_idempotency_key` | E11000 → return existing row |
| Append-only `audit_log` | Mongoose pre-hooks reject every update/delete | |
| Bucket4j login limit | Redis `INCR`/`EXPIRE` per IP | Fails open if Redis is down |
| `@Async` + `@TransactionalEventListener` | **BullMQ queue on Redis**, enqueued after commit | Separate worker process (`npm run worker`), in-process fallback |
| Policy reads | Cached in Redis for 60 s | |
| Spring Security + JJWT | `jsonwebtoken` HS256 + Express middleware | Default deny on every route after login |
| Bean Validation | Zod schemas | Same `VALIDATION_FAILED` body with `fields` |
| MDC trace id | `AsyncLocalStorage` + `X-Trace-Id` | |
| Logback JSON | pino (JSON, redaction of tokens/passwords) | |
| Micrometer / Actuator | prom-client at `/actuator/prometheus` (ADMIN), `/actuator/health` | |
| Resilience4j | Retry/backoff + call budget inside `agent.service.ts` | Max 3 LLM requests per case, retries included |
| `RestClient` LLM clients | `fetch`-based `OpenAiCompatibleClient` (Groq, Ollama), `GeminiClient`, `MockLlmClient` | `LLM_PROVIDER=mock` runs offline |
| `Proposal` entity in `agent/` | `casemgmt/proposal.model.ts` | Agent only returns a draft; casemgmt persists it, so the agent never writes |
| ArchUnit | `test/unit/architecture.test.ts` | Import-rule checks, same rules as TRD §3.1 |
| JUnit + Testcontainers | Vitest + Supertest against real MongoDB/Redis (CI services) | `npm run test:it -w backend` |
| `/internal/refunds` endpoint | Not exposed; refunds are an in-process call | Matches "disabled in prod" |
| Two Vite apps + `packages/ui` | One **Next.js** app: public landing page at `/`, customer portal at `/transactions` and `/cases/*`, ops console at `/ops` | `frontend/src/components/ui` = presentational kit; `components/landing` = marketing sections |
| CSS Modules + tokens | Tailwind theme mapped 1:1 to CSS variable tokens | `frontend/src/app/tokens.css` |
| Storybook | Not yet set up (backlog) | Components have RTL + axe tests |
| Render + Neon + Vercel | Any Docker host + MongoDB Atlas + Redis (e.g. Upstash) + Vercel | See README |

## Landing page decisions

- The product was rebranded to forest green + lime (inspired by a reference landing page the product owner supplied). `Design.md` §3.1 has the new tokens; lime is never used as text on light backgrounds.
- The landing page uses Inter and Lucide for consistency with the apps. The landing page design guidance used during the build prefers Geist and Phosphor; the project design system wins.
- Motion uses the strong easing tokens in `tokens.css` (`--ease-out`, `--ease-in-out`, `--ease-drawer`), CSS transitions and `IntersectionObserver` only, with no animation library. Everything respects `prefers-reduced-motion`, and the hero demo can be paused.
