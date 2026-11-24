# RefundDesk — Design Document

| Field | Value |
| --- | --- |
| Product | RefundDesk — AI-assisted refund and dispute desk |
| Author | M N Santhi Swarup |
| Version | 1.0 (MVP) |
| Date | 24 Nov 2026 |
| Related | PRD.md, TRD.md, Rules.md |

This document defines how RefundDesk looks and behaves: design principles, design tokens, components, screens, states, and accessibility. All UI is built from the shared kit in `frontend/packages/ui`.

---

## 1. Design Principles

1. **Clarity over cleverness.** A customer under stress should understand their case status in under 5 seconds.
2. **Trust through transparency.** Show what happened, who did it and when. The AI's reasoning is always visible to ops, never hidden.
3. **Humans decide.** AI output is styled as a *suggestion* (outlined card, "AI proposal" label), never as a final decision.
4. **Money is precise.** Amounts are large, right-aligned in tables, always formatted as ₹1,234.00.
5. **Accessible by default.** WCAG 2.1 AA is the minimum for every component and screen.
6. **One system, two apps.** Customer Portal and Ops Console share tokens and components; they differ in density, not style.

---

## 2. Users and Their Context

| User | Device | Mindset | Design implication |
| --- | --- | --- | --- |
| Customer | Mostly mobile | Anxious, wants money back | Big status, plain words, few steps |
| Ops Agent | Desktop, long sessions | Efficient, scanning many cases | Dense tables, keyboard shortcuts, filters |
| Approver | Desktop | Careful, accountable | All facts on one screen, confirm before acting |
| Admin | Desktop | Occasional configuration | Simple forms |

---

## 3. Design Tokens

Defined once in `packages/ui/src/tokens/tokens.css` as CSS variables. Components use tokens only, never raw values.

### 3.1 Colour — Light Theme

Brand: deep forest green with a lime accent (rebrand, Nov 2026). **Lime is only a fill, or a colour on forest/dark surfaces.** It is never text or a focus ring on a light background (1.5:1 contrast).

**Brand and neutrals**
| Token | Hex | Use |
| --- | --- | --- |
| `--color-primary-600` | `#3F6212` | Links, focus ring, selected chips (white text on it: 7.1:1) |
| `--color-primary-700` | `#365314` | Link hover |
| `--color-primary-50` | `#F7FEE7` | Selected rows, subtle highlights |
| `--color-accent` | `#A3E635` | Primary buttons and CTAs, highlights, glows |
| `--color-accent-strong` | `#84CC16` | Primary button hover |
| `--color-on-accent` | `#0B1A12` | Text on accent (11.9:1) |
| `--color-bg` | `#F7F9F4` | App background |
| `--color-surface` | `#FFFFFF` | Cards, tables, modals |
| `--color-border` | `#E3E8DF` | Dividers, input borders |
| `--color-border-strong` | `#7A887E` | Input borders on hover |
| `--color-text` | `#0E1A13` | Primary text |
| `--color-text-muted` | `#4A5A50` | Secondary text, labels (6.9:1 on bg) |
| `--color-text-inverse` | `#FFFFFF` | Text on primary and danger fills |

**Forest surfaces** (dark brand panels on the landing page; same in both themes, slightly deeper in dark)
| Token | Hex | Use |
| --- | --- | --- |
| `--color-forest-950` | `#0B1A12` | Hub section, footer |
| `--color-forest-900` | `#10241A` | Hero, final CTA, featured cards |
| `--color-forest-800` | `#183324` | Chips and nodes on forest |
| `--color-on-forest` | `#F1F5F0` | Text on forest (14.8:1) |
| `--color-on-forest-muted` | `#A7B5AC` | Secondary text on forest (7.6:1) |

**Status (always paired with text and an icon)**
| Token | Hex | Background token | Hex | Meaning |
| --- | --- | --- | --- | --- |
| `--color-success-700` | `#15803D` | `--color-success-50` | `#F0FDF4` | Refunded, approved |
| `--color-warning-700` | `#B45309` | `--color-warning-50` | `#FFFBEB` | Needs manual review |
| `--color-danger-700` | `#B91C1C` | `--color-danger-50` | `#FEF2F2` | Rejected, errors |
| `--color-info-700` | `#1D4ED8` | `--color-info-50` | `#EFF6FF` | Open, investigating (kept blue so "in progress" never reads as the brand green) |
| `--color-ai-700` | `#6D28D9` | `--color-ai-50` | `#F5F3FF` | AI proposal content |

All `-700` text colours meet ≥ 4.5:1 contrast on white and on their `-50` background.

### 3.2 Colour — Dark Theme
| Token | Hex |
| --- | --- |
| `--color-bg` | `#0A120E` |
| `--color-surface` | `#111C16` |
| `--color-border` | `#1F2E25` |
| `--color-text` | `#EEF3EC` |
| `--color-text-muted` | `#9DAEA3` |
| `--color-primary-600` | `#A3E635` (lime is allowed as text on dark: 12.6:1) |
| `--color-text-inverse` | `#0A120E` |

Dark theme follows `prefers-color-scheme` and can be toggled in the user menu. Status colours switch to their `-300` shades on `-950` backgrounds.

### 3.3 Typography
Font: **Inter** (self-hosted), fallback `system-ui, -apple-system, Segoe UI, Roboto, sans-serif`. Numbers use `font-variant-numeric: tabular-nums` so amounts align.

| Token | Size / line height | Weight | Use |
| --- | --- | --- | --- |
| `--text-display` | 32 / 40 | 700 | Refund amount on case status |
| `--text-h1` | 24 / 32 | 600 | Page titles |
| `--text-h2` | 20 / 28 | 600 | Section titles |
| `--text-h3` | 16 / 24 | 600 | Card titles |
| `--text-body` | 15 / 24 | 400 | Body text |
| `--text-small` | 13 / 20 | 400 | Labels, meta, table secondary |
| `--text-caption` | 12 / 16 | 500 | Badges, timestamps |

Minimum body size on mobile: 15 px. Never go below 12 px.

### 3.4 Spacing (4-pt grid)
| Token | Value |
| --- | --- |
| `--space-1` | 4 px |
| `--space-2` | 8 px |
| `--space-3` | 12 px |
| `--space-4` | 16 px |
| `--space-5` | 20 px |
| `--space-6` | 24 px |
| `--space-8` | 32 px |
| `--space-10` | 40 px |
| `--space-12` | 48 px |

### 3.5 Radius, Shadow, Motion
| Token | Value | Use |
| --- | --- | --- |
| `--radius-sm` | 6 px | Badges, inputs |
| `--radius-md` | 8 px | Buttons, cards |
| `--radius-lg` | 12 px | Modals |
| `--radius-full` | 999 px | Pills, avatars |
| `--shadow-sm` | `0 1px 2px rgba(15,23,42,.06)` | Cards |
| `--shadow-lg` | `0 10px 30px rgba(15,23,42,.15)` | Modals, menus |
| `--motion-fast` | 120 ms ease-out | Hover, focus |
| `--motion-base` | 200 ms ease-out | Modals, toasts |
| `--ease-out` / `--ease-in-out` / `--ease-drawer` | `cubic-bezier(0.23,1,0.32,1)` / `(0.77,0,0.175,1)` / `(0.32,0.72,0,1)` | Entrances, on-screen movement, drawers and marketing reveals |

All motion is disabled under `prefers-reduced-motion: reduce`.

### 3.6 Layout and Breakpoints
| Name | Min width | Layout |
| --- | --- | --- |
| `sm` | 0 | Single column, 16 px gutters |
| `md` | 768 px | Single column, max width 720 px |
| `lg` | 1024 px | Ops: sidebar + content; Customer: centred 720 px |
| `xl` | 1280 px | Ops case detail: 2 columns (8/4 grid) |

Touch targets ≥ 44 × 44 px on mobile.

---

## 4. Iconography and Content

### 4.1 Icons
- Library: **Lucide** (outline, 1.5 px stroke), 16 px inline, 20 px in buttons, 24 px standalone.
- Decorative icons get `aria-hidden="true"`; meaningful icons get an accessible label.

| Meaning | Icon |
| --- | --- |
| Open / Investigating | `circle-dot` / `loader` |
| Proposed | `sparkles` (AI) |
| Approved / Refunded | `check-circle` |
| Rejected | `x-circle` |
| Manual review | `alert-triangle` |
| Closed | `archive` |

### 4.2 Voice and Tone
- Plain, calm, specific. Say what happened and what happens next.
- Customer copy avoids internal words ("proposal", "idempotency", "agent").
- Use "you" for the customer; use the person's role for ops ("Approved by Priya, Approver").

| Situation | Customer sees | Ops sees |
| --- | --- | --- |
| Case created | "We've received your request. Most cases are reviewed within 24 hours." | "New case · Duplicate charge" |
| AI working | "We're checking your transactions." | "AI investigating…" |
| Proposed | "Your request is being reviewed by our team." | "AI proposal ready · 92% confidence" |
| Refunded | "₹499.00 has been refunded to your original payment method." | "Refunded · ₹499.00 · key case-42" |
| Rejected | "We couldn't approve this refund. Reason: the charge matches a completed order." | "Rejected by Priya" |
| AI failed | (same as Proposed) | "AI couldn't complete. Review manually." |

---

## 5. Component Library (`packages/ui`)

Each component: variants, states, accessibility notes. Every component has a Storybook story and an axe test.

### 5.1 Button
| Variant | Use |
| --- | --- |
| `primary` | Main action per screen (Submit, Approve) |
| `secondary` | Supporting action (Edit, Cancel) |
| `danger` | Destructive or negative decision (Reject) |
| `ghost` | Low-emphasis actions in toolbars |

- Sizes: `sm` (32 px), `md` (40 px), `lg` (48 px, mobile primary).
- States: default, hover, active, focus-visible (2 px `--color-primary-600` ring, 2 px offset), disabled, loading (spinner + `aria-busy="true"`, label kept).
- One `primary` button per view.

### 5.2 Input, Textarea, Select
- Label always visible above the field (no placeholder-only labels).
- Helper text below in `--text-small` muted; error text replaces helper in danger colour with an icon.
- Error state: border `--color-danger-700`, `aria-invalid="true"`, `aria-describedby` → error id.
- Textarea shows a character counter (`0 / 1000`), announced politely when near the limit.

### 5.3 StatusBadge
- Pill, `--text-caption`, icon + text, colours from §3.1 status table.
- Values: Open, Investigating, Proposed, Manual review, Approved, Rejected, Refunded, Closed.
- Customer app maps internal states to simpler labels: Open/Investigating/Proposed/Manual review → **"In review"**.

### 5.4 AmountCard
- Shows a label ("Refund amount"), the amount in `--text-display`, and an optional caption ("to UPI · original payment method").
- Variants: `neutral`, `success` (refunded), `muted` (rejected, amount struck through with "Not refunded" text).

### 5.5 TransactionRow
- Layout: merchant name + date (left), amount + status badge (right).
- Whole row is not clickable; the "Report issue" button is the only action (avoids nested interactive elements).
- If a case is open: badge "Case open" and button becomes "View case".

### 5.6 StatusTimeline
- Vertical ordered list (`<ol>`), one step per state reached, plus upcoming steps in muted style.
- Current step has `aria-current="step"`, a filled icon and bold label.
- Each step: label, timestamp (IST), optional actor ("by Priya").
- Customer view shows 4 steps: Received → In review → Decision → Refunded/Closed.

### 5.7 AIProposalCard (Ops only)
- Outlined card with `--color-ai-50` header strip, `sparkles` icon and label **"AI proposal — needs human approval"**.
- Body: action (Full refund / Partial refund / Reject), amount, confidence meter (bar + text "92%"), reasons list, model + prompt version in caption.
- Never uses success/green styling, so it's not mistaken for an approval.
- If AI failed: warning variant "AI couldn't complete this case. Review manually." with "Re-run AI" button.

### 5.8 Banner
- Variants: info, success, warning, danger. Icon + message + optional action link.
- Errors: `role="alert"`. Info/success: `role="status"`.

### 5.9 Toast
- Bottom-right (desktop), bottom-centre (mobile); auto-dismiss after 5 s except errors; pause on hover/focus; `role="status"`.

### 5.10 Modal (ConfirmDialog)
- Used for Approve and Reject.
- Title, summary of the action, required comment field, cancel + confirm buttons.
- Focus moves to the first field on open, trapped inside, returns to the trigger on close; `Esc` closes.

### 5.11 Table (Ops)
- Sticky header, zebra-free rows with 1 px dividers, row height 48 px (comfortable) or 40 px (compact toggle).
- Sortable columns use `<button>` in headers with `aria-sort`.
- Amount column right-aligned with tabular numbers.
- Row link: case ID cell is the link; whole row highlights on hover.

### 5.12 Other
| Component | Notes |
| --- | --- |
| `EmptyState` | Icon, title, one line, optional action |
| `Skeleton` | Loading placeholders matching final layout |
| `Spinner` | Inline loading with visually hidden "Loading" text |
| `Tabs` | Roving tabindex, arrow-key navigation |
| `FilterChips` | Toggle buttons with `aria-pressed` |
| `Avatar` | Initials, used for actors in audit log |
| `ConfidenceMeter` | Bar + numeric text; never colour-only |

---

## 6. Screens — Customer Portal

Mobile-first, centred single column (max 720 px), top app bar with logo and user menu.

### 6.1 Login
```
┌──────────────────────────────┐
│          RefundDesk           │
│  Email     [______________]   │
│  Password  [______________]   │
│  [        Log in          ]   │
│  Demo accounts: see README    │
└──────────────────────────────┘
```
- Error banner on failed login: "Email or password is incorrect."
- Rate-limit message: "Too many attempts. Try again in a minute."

### 6.2 My Transactions
```
┌──────────────────────────────┐
│ My transactions               │
│ ┌──────────────────────────┐ │
│ │ FoodNow        ₹499.00   │ │
│ │ 20 Nov, 6:35 PM  Success │ │
│ │            [Report issue]│ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ FoodNow        ₹499.00   │ │
│ │ 20 Nov, 6:34 PM  Success │ │
│ │        Case open [View]  │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```
- Grouped by date ("Today", "Yesterday", "20 Nov 2026").
- Empty state: "No transactions in the last 30 days."

### 6.3 Raise a Case
- Step 1 (same screen): selected transaction summary card (read-only).
- Fields: **What went wrong?** (radio group: Charged twice · Payment failed but money was debited · Wrong amount · Something else), **Tell us more** (textarea, optional, 1000 max).
- Primary button "Submit request" (full width on mobile).
- On success → redirect to Case Status with toast "Request submitted".

### 6.4 Case Status
```
┌──────────────────────────────┐
│ Request #42        In review  │
│ FoodNow · ₹499.00 · 20 Nov    │
│                               │
│ ● Received        20 Nov 6:40 │
│ ● In review       20 Nov 6:41 │
│ ○ Decision                    │
│ ○ Refunded                    │
│                               │
│ We're checking your           │
│ transactions. Most cases are  │
│ reviewed within 24 hours.     │
└──────────────────────────────┘
```
- After refund: AmountCard (success) at the top: "₹499.00 refunded".
- After rejection: reason in plain words + "Need help? Contact support" link.
- Polls every 5 s while In review; a polite live region announces status changes.

---

## 7. Screens — Ops Console

Desktop layout: left sidebar (240 px) with nav (Cases, Admin), top bar with search, role badge and user menu.

### 7.1 Case Queue
```
┌────────┬──────────────────────────────────────────────────────────┐
│ Cases  │ Cases                                    [Search ID ...] │
│ Admin  │ [All] [Proposed 4] [Manual review 1] [Approved] [Closed] │
│        │ Type: [All ▾]   Sort: [Oldest first ▾]   Density: [▤]    │
│        │ ┌──────┬──────────┬───────────────┬────────┬──────┬────┐ │
│        │ │ ID   │ Customer │ Type          │ Amount │Status│Age │ │
│        │ ├──────┼──────────┼───────────────┼────────┼──────┼────┤ │
│        │ │ #42  │ Asha     │ Charged twice │ ₹499.00│Prop. │35m │ │
│        │ │ #41  │ Rahul    │ Failed, debit │ ₹1,200 │Manual│2h  │ │
│        │ └──────┴──────────┴───────────────┴────────┴──────┴────┘ │
│        │                                   < 1 2 3 >  20 per page │
└────────┴──────────────────────────────────────────────────────────┘
```
- Default filter: Proposed + Manual review (cases needing action).
- Age over 24 h shows a warning icon + "Overdue" text.
- Keyboard: `/` focuses search, `j/k` moves row focus, `Enter` opens case.

### 7.2 Case Detail
```
┌────────┬──────────────────────────────────────┬───────────────────┐
│ Cases  │ ← Cases   Case #42   [Proposed]      │ Decision          │
│ Admin  │                                      │ ┌───────────────┐ │
│        │ Transaction                          │ │ AI proposal — │ │
│        │ FoodNow · ₹499.00 · 20 Nov 6:35 PM   │ │ needs approval│ │
│        │ Status: Success · Txn 101            │ │ Full refund   │ │
│        │                                      │ │ ₹499.00       │ │
│        │ Customer's message                   │ │ ████████░ 92% │ │
│        │ "Charged twice for one order"        │ │ • Identical   │ │
│        │                                      │ │   charge 40s  │ │
│        │ Recent transactions (30 days)        │ │   earlier     │ │
│        │ ┌──────────────────────────────────┐ │ └───────────────┘ │
│        │ │ 101 FoodNow ₹499 6:35 PM  ◄ case │ │ [Edit proposal]   │
│        │ │ 100 FoodNow ₹499 6:34 PM         │ │ [Approve] [Reject]│
│        │ └──────────────────────────────────┘ │                   │
│        │                                      │ Notes             │
│        │ Timeline / Audit log  [tabs]         │ [Add note...]     │
│        │ ● PROPOSED by AGENT   6:41 PM        │                   │
│        │ ● INVESTIGATING       6:40 PM        │                   │
└────────┴──────────────────────────────────────┴───────────────────┘
```
- Right column is sticky so decision buttons stay visible while scrolling.
- Approve/Reject buttons render only for APPROVER; OPS sees "Waiting for approver" text instead.
- Related transactions that match the case (same merchant + amount within 10 min) are highlighted with a "Possible duplicate" tag.

### 7.3 Approve / Reject Dialog
- **Approve:** "Approve refund of ₹499.00 to Asha?" Editable amount (max = transaction amount, inline error if exceeded), required comment, buttons "Cancel" / "Approve refund".
- **Reject:** "Reject this request?" Required reason (shown to customer, so plain language hint), buttons "Cancel" / "Reject request" (danger).
- After confirm: button loading state → toast "Refund of ₹499.00 completed" → status updates to Refunded.
- On `409 CONCURRENT_UPDATE`: banner "This case was just updated by someone else. Refresh to see the latest."

### 7.4 Admin
- Users tab: table (name, email, role) + "Add user" form (name, email, temporary password, role select).
- Policies tab: list of rules per issue type with edit form (rule text, max days, active toggle).

---

## 8. Key User Flows

### 8.1 Customer raises and tracks a case
1. Log in → My transactions.
2. Tap "Report issue" on a transaction.
3. Choose what went wrong, optionally add details, submit.
4. Land on Case Status: Received → In review.
5. Receive outcome: Refunded (amount card) or Rejected (reason).

### 8.2 Approver resolves a case
1. Log in → Case Queue (filtered to Proposed).
2. Open the oldest case.
3. Read transaction, customer message, related transactions, AI proposal and reasons.
4. Optionally edit amount; click Approve or Reject.
5. Confirm in dialog with a comment → case moves to Refunded/Closed → next case.

### 8.3 AI failure path
1. Case lands in "Manual review" with warning badge.
2. Ops opens it, sees "AI couldn't complete" card.
3. Ops either clicks "Re-run AI" or writes a proposal manually.
4. Approver decides as normal.

---

## 9. States for Every Data View

| State | Pattern |
| --- | --- |
| Loading | Skeletons shaped like the final content; no full-page spinners |
| Empty | EmptyState with a helpful line ("No cases need action right now.") |
| Error | Danger Banner with message + "Try again" button; traceId shown in small text for ops |
| Partial (AI pending) | Inline "AI investigating…" with spinner in the proposal card |
| Offline | Top banner "You're offline. Changes will fail until you reconnect." |
| Cold start (free hosting) | After 3 s: "Waking up the server, this can take up to a minute…" |
| Unauthorized | Redirect to Login with info banner "Please log in again." |

---

## 10. Accessibility Checklist

- [ ] All functionality available by keyboard; logical tab order; skip link "Skip to content".
- [ ] Visible focus on every interactive element (2 px ring, 2 px offset).
- [ ] Text contrast ≥ 4.5:1; large text and UI parts ≥ 3:1.
- [ ] Status never conveyed by colour alone.
- [ ] Every form field has a visible label; errors linked with `aria-describedby`.
- [ ] Page title updates on route change (`Case #42 · RefundDesk`); focus moves to the `h1`.
- [ ] Live regions for status changes and toasts (`aria-live="polite"`).
- [ ] Dialogs trap focus, restore focus, close on `Esc`.
- [ ] Tables use `<th scope>` and `aria-sort`.
- [ ] Works at 200% zoom and 320 px width without horizontal scroll.
- [ ] Respects `prefers-reduced-motion` and `prefers-color-scheme`.
- [ ] Tested with keyboard only, NVDA (Windows) or VoiceOver (mobile), and axe (zero critical issues).

---

## 11. Responsive Behaviour

| Element | Mobile (< 768) | Desktop (≥ 1024) |
| --- | --- | --- |
| Customer pages | Full-width cards, sticky bottom primary button | Centred 720 px column |
| Ops sidebar | Collapses to top bar with menu button | Fixed 240 px sidebar |
| Case queue | Card list instead of table | Full table |
| Case detail | Single column; decision panel moves to the top, sticky action bar at bottom | Two columns, sticky right panel |
| Dialogs | Full-screen sheet | Centred modal, 480 px |

---

## 12. Design Handoff

- **Figma file:** one page each for Tokens, Components, Customer screens, Ops screens, Flows.
- Figma variables mirror CSS tokens 1:1 (same names).
- Components mapped to code with Figma Code Connect so designers see the real React props.
- Storybook (`pnpm --filter ui storybook`) is the source of truth for implemented components; deployed alongside the apps for review.
- Any new component needs: Figma spec → Storybook story → axe test → usage in app.
