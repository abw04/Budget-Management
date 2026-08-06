# Implementation Improvement Audit

**Audit date:** 2026-08-06  
**Scope:** Current working tree checked against `PRD.md`, `DESIGN.md`, and `TICKETS.md`, including the uncommitted `server.mjs` changes and untracked reviewer-test files.  
**Verification:** Static code review, direct Node tests/syntax checks, and an end-to-end walkthrough in the Codex in-app Browser at desktop, 760 px, and 390 px widths.

## Executive result

The prototype has a solid shared domain model, canonical data, persistence, role guards, request creation, the first two approvals, payment reclassification logic, and a visually strong overview. However, it is **not presentation-ready** because the primary demo cannot be completed through the UI.

Two release blockers should be fixed first:

1. Clicking a field or other non-action content inside a modal closes the modal.
2. A request at `Awaiting Finance Approval` is not assigned to the Finance Reviewer in UI queue/action checks, so Finance cannot approve or reject it.

The in-app Browser reproduced both issues. After successfully submitting the canonical `Rp150M` request and completing the Line Manager and Budget Owner approvals, Nina Kurnia saw the correct `Rp600M → Rp450M` impact preview but `My Approvals 0`, no Approve action, and the contradictory hint “Available to Finance Reviewer at this stage.”

## Ticket-level status

| Ticket | Status | Main gap |
| --- | --- | --- |
| 01 — Persistent FY2027 overview | Mostly implemented | Automated reporting coverage is incomplete; the local server exposes repository files. |
| 02 — Ramadan Campaign detail | Mostly implemented | Allocation rows do not provide the specified selection/direct-request behavior. |
| 03 — Project-backed request | Partially implemented | Domain submission works, but mouse interaction with the modal is broken and derived approvers are missing from modal context. |
| 04 — Three approvals | **Blocked** | Finance is absent from `My Approvals` and has no UI actions. |
| 05 — Payment confirmation | **Blocked by Ticket 04** | Domain logic exists, but the UI path is unreachable; proof validation is not immediate. |
| 06 — Non-project lifecycle | Partially implemented | Funding Source math works, but department/annual Unallocated Budget reporting does not consume non-project commitments/spend. |
| 07 — Rejection | Partially implemented | Domain transition works, but clicking the rejection textarea closes the modal. |
| 08 — Demo hardening | **Not complete** | Primary walkthrough is blocked; accessibility, server isolation, and regression coverage need work. |

## P0 — Release blockers

### 1. Stop modal content clicks from closing the dialog

**Evidence**

- The modal backdrop owns `data-action="close-modal"` at `src/main.js:192`.
- Delegated click handling uses `event.target.closest('[data-action]')` at `src/main.js:288`.
- Therefore, clicking an input, label, text area, select, upload area, or ordinary modal text climbs to the backdrop and resolves as `close-modal`.
- Browser reproduction: opening New Request and clicking the `Title` field immediately reduced the dialog count from one to zero.

**Impact**

- New Request is effectively unusable by mouse.
- Rejection reasons cannot be entered normally.
- Payment details and transfer proof cannot be entered normally.
- This violates Tickets 03, 05, 07, and 08 and `DESIGN.md` accessibility/interaction requirements.

**Improve**

- Close only when the backdrop itself is clicked, for example by checking `event.target === event.currentTarget`, or put the close action on a dedicated backdrop handler that ignores clicks from the dialog.
- Stop propagation from the dialog surface if the event architecture remains delegated.
- Add a UI regression test that clicks and types into every modal field before submitting.

### 2. Make Finance approval role-owned and actionable

**Evidence**

- `activeApproval()` omits `actorId` for the Finance stage at `src/domain/store.js:359`.
- `getActiveApproval()` finds a Finance actor but returns it only as `actor`, without adding its ID, at `src/domain/store.js:472-476`.
- `My Approvals` and detail actions require `pending.actorId === activeUserId` at `src/main.js:135` and `src/main.js:151`.
- Domain calls can approve as Finance, which is why the unit test passes, but the UI cannot expose the action.

**Impact**

- The PRD’s primary demo stops at step 10 of 18.
- Finance cannot approve or reject even though the request is at its stage.
- Payment confirmation and cross-view reconciliation cannot be reached through the product.

**Improve**

- Return a usable Finance assignee ID from `getActiveApproval()`, or make Finance stages explicitly role-owned in both queue and action predicates.
- Use one shared `canActorActOnRequest()` policy for queue counts, action rendering, and domain transitions so these layers cannot disagree.
- Add a workflow-level test that drives all three UI approvals and asserts Finance queue count/action visibility.

## P1 — Financial correctness and validation

### 3. Correct Department Unallocated Budget for non-project consumption

**Evidence**

- `deriveDepartmentReports()` calculates `approvedBudget - allocatedToProjects` only at `src/domain/store.js:269-283`.
- It does not subtract non-project Approved unpaid commitments or non-project Payment-confirmed spend from the Budget Line Unallocated Balances.
- A direct lifecycle check for a `Rp100M` Technology non-project payment returned:
  - `departmentUnallocatedBudget: Rp59.2B`
  - `paymentConfirmedSpend: Rp300M`
- The correct Department Unallocated Budget is `Rp59.1B`: `Rp60B - Rp800M Project Allocation - Rp100M non-project consumption`.

**Impact**

- Overview and department reporting do not reconcile with the selectable non-project Funding Source.
- Ticket 06 and PRD section 11 are not satisfied.

**Improve**

- Derive each Budget Line Unallocated Balance through `deriveFundingSourceMetrics()` and sum those balances for the department.
- Keep total department commitments/spend as separate classification columns, but ensure the Unallocated Budget specifically reflects non-project consumption once.
- Add before-approval, after-Finance-approval, and after-payment assertions for Technology and company reports.

### 4. Validate proof metadata immediately and connect availability errors to fields

**Evidence**

- File selection at `src/main.js:296` stores and displays any filename/type/size without validating it.
- Actual proof validation occurs only during `confirmPayment()` at `src/domain/store.js:420-434`.
- The current rule accepts a listed extension even when a conflicting MIME type is supplied.
- `validateNewDraft()` at `src/main.js:231-239` checks that an amount is positive, but not that it is within current availability. The domain check at `src/domain/store.js:329` then appears as a generic form error rather than an amount-field error.

**Impact**

- Ticket 05’s immediate file validation is missing.
- Ticket 03 and the design brief’s field-linked validation requirement are only partial.

**Improve**

- Extract shared `validateProofMetadata()` and `validateRequestedAmount()` functions used by both UI and domain code.
- Run proof validation on file selection; reject invalid metadata immediately and retain focus on the upload field.
- Require an accepted MIME type, with a narrow extension fallback only when the browser provides no MIME type.
- Show over-availability errors on `requestedAmount`, including the current Available to commit and the maximum valid amount.

## P1 — Prototype server safety

### 5. Bind locally and serve only public application assets

**Evidence**

- The server root is the repository root at `server.mjs:6` and it reads any resolved file at `server.mjs:11-18`.
- `server.listen(port)` at `server.mjs:38` does not restrict the listener to loopback.
- Live HTTP checks returned `200` for both `/PRD.md` and `/.git/HEAD`.
- The string-prefix path guard at `server.mjs:13` is also weaker than a relative-path/allowlist check.

**Impact**

- Specifications, Git metadata, tests, and any other repository files can be downloaded from the dev server.
- On systems where the listener is reachable from the LAN, this exposure is not limited to the local machine.

**Improve**

- Listen on `127.0.0.1` by default.
- Serve only `index.html` and a dedicated public asset root such as `src/`, or use an explicit allowlist.
- Resolve paths with `path.relative()` and reject absolute or parent-relative results.
- Add negative server tests for `/.git/HEAD`, `/PRD.md`, traversal attempts, and unknown files.

## P2 — Audit completeness, accessibility, and design fidelity

### 6. Render complete Activity History evidence

`renderEvent()` at `src/main.js:171-174` omits `resultingStatus` for every event. Payment events also omit proof MIME type and size even though the records contain them. Show the resulting status for all events and the full required payment metadata: amount, bank, reference, filename, type, and size. This is required by PRD section 12 and Tickets 05 and 07.

### 7. Complete dialog, tab, row, and touch accessibility

Browser and static checks found:

- Focusable request rows are `<div>` elements without an interactive role at `src/main.js:123-128`.
- All three `role="tab"` elements omit `aria-selected`, `aria-controls`, IDs, and associated tab panels at `src/main.js:131-139`.
- Dialogs have no Escape handling, focus trap, background inertness, or focus restoration. `src/main.js:309-314` handles only Enter, while `src/main.js:322` always focuses the first matching control after render.
- At 390 px, there was no document-level horizontal overflow, which is good, but three visible controls were below the design brief’s 44×44 px touch target.
- The small-screen shell remains a horizontally compressed rail/header rather than the specified top navigation drawer.

Use native buttons/links for selectable rows, implement the ARIA tab pattern, add robust dialog focus management, and raise interactive targets to at least 44 px on touch breakpoints.

### 8. Show all required derived request context

The New Request modal shows department, Budget Line, availability, and project at `src/main.js:205`, but not the derived Line Manager and Department Budget Owner required by the PRD and `DESIGN.md` workflow narrative. Add both approvers as read-only context before submission.

Project allocation rows at `src/main.js:119` are also non-interactive even though the design calls for selecting an allocation to emphasize/filter requests and provide direct request links. Either implement that interaction or update the design brief if the hardcoded project-level prefill is the intentional simplification.

### 9. Add regression coverage for behavior the domain tests cannot see

The domain suite covers the core formulas and transitions well, but it does not catch either P0 blocker. Add focused DOM/component integration coverage for modal clicks, queue ownership, action visibility, field-linked validation, and Activity History rendering. Also add domain/report tests for:

- Finance availability changing between submission and approval;
- rejection at all three stages and duplicate attempts;
- department/company reports after non-project approval and payment;
- MIME/extension mismatch and the exact 5 MB boundary;
- event resulting status and full payment metadata.

The current server fallback test at `tests/server-start.test.js:43` assumes `preferredPort + 1` is always free. It failed once when that port was occupied and passed on rerun. Assert that the chosen port is within the allowed fallback range and not the blocked port, or reserve both ports deterministically.

### 10. Reconcile implementation-stack and motion decisions with `DESIGN.md`

`DESIGN.md` proposes React, TypeScript, Vite, Tailwind, Lucide, and Vitest, while the implementation is dependency-free vanilla JavaScript/CSS with Node’s test runner. The current choice is reasonable for a six-hour prototype, but the documentation and implementation should agree. Either record the deliberate deviation in the README/design brief or migrate before treating the design’s implementation direction as accepted.

The two signature financial transitions described in `DESIGN.md` are also not implemented. After the functional blockers are fixed, add a restrained Finance-commitment transition and payment-reclassification transition with explicit static text and reduced-motion behavior.

## What is already working well

- Canonical FY2027, department, budget-line, project, allocation, seeded request, payment, and proof metadata are modeled as structured records.
- Project Allocation and Budget Line Unallocated Balance calculations are shared and use integer rupiah.
- Submission does not reserve budget; Finance approval performs a fresh domain availability check.
- Domain authorization blocks wrong roles, out-of-order actions, terminal changes, duplicate payment, and over-availability approval.
- Payment confirmation reclassifies commitment to spend without reducing Available to commit twice.
- Local storage persistence was verified by refreshing after submission and two approvals.
- Role visibility, overview/project totals, text-plus-color status treatment, reduced-motion CSS, and the reviewer README are substantially aligned with the specifications.
- The desktop presentation is visually calm and legible. At 760 px and 390 px there was no document-level horizontal overflow.

## Verification results

- `node --test`: **11/11 passed on rerun**. The first run exposed the flaky port assumption described above.
- Syntax checks: `src/main.js`, `src/domain/store.js`, and `server.mjs` passed `node --check`.
- `npm` itself could not run in the desktop host because its global launcher points to a missing `npm-cli.js`; this is an environment issue, so the underlying dependency-free commands were run directly.
- In-app Browser: overview, request submission, persistence, Line Manager approval, Budget Owner approval, Finance queue/action state, modal interaction, and 760/390 px layouts were checked.

## Recommended implementation order

1. Fix modal click handling and Finance action ownership.
2. Add regression tests for those two blockers and rehearse all 18 PRD demo steps.
3. Correct non-project department/company reporting and add reconciliation tests.
4. Implement immediate field-linked request/proof validation.
5. Restrict the dev server to loopback and public assets.
6. Complete Activity History evidence and accessibility semantics/focus behavior.
7. Add derived approver context, allocation-row interactions, and signature transitions.
8. Resolve implementation-stack documentation drift and rerun the complete manual checklist.
