# Budget Management Implementation Tickets

**Source:** `PRD.md`  
**Document status:** Draft for ticket-breakdown review  
**Publishing decision:** Kept in this single Markdown file by request; no Git or issue-tracker tickets are created.

## Proposed breakdown

1. **Open a persistent FY2027 budget overview**
   - **Blocked by:** None
   - **What it delivers:** A runnable application that loads the canonical FY2027 budget, derives the opening financial position from structured records, survives refresh, supports simulated role switching, and can be reset to the canonical fixture.
2. **Inspect the Ramadan Campaign across departmental allocations**
   - **Blocked by:** 01 — Open a persistent FY2027 budget overview
   - **What it delivers:** A user can move from Overview into the Ramadan Campaign and verify its consolidated allocation and each department's ownership without double counting reserved project funds.
3. **Submit a project-backed request into the Request Workspace**
   - **Blocked by:** 02 — Inspect the Ramadan Campaign across departmental allocations
   - **What it delivers:** A Technology Requester can submit the Rp150M microsite request against the Technology Project Allocation, see it in the Request Workspace, refresh safely, and observe that submission has no financial effect.
4. **Approve a project request and create its commitment**
   - **Blocked by:** 03 — Submit a project-backed request into the Request Workspace
   - **What it delivers:** Distinct actors can complete the three approval stages, with Finance seeing a fresh impact preview before approval creates an Approved Unpaid Commitment.
5. **Confirm a Bank Transfer and reconcile every reporting view**
   - **Blocked by:** 04 — Approve a project request and create its commitment
   - **What it delivers:** A Finance Payment Processor can record valid external-payment evidence exactly once and see the commitment reclassified as Payment-Confirmed Spend everywhere without reducing Available to Commit twice.
6. **Run a non-project request through the shared lifecycle**
   - **Blocked by:** 05 — Confirm a Bank Transfer and reconcile every reporting view
   - **What it delivers:** A requester can use a Budget Line Unallocated Balance as the Funding Source and complete the same submission, approval, payment, history, persistence, and reporting workflow without a project association.
7. **Reject a request at any active approval stage**
   - **Blocked by:** 04 — Approve a project request and create its commitment
   - **What it delivers:** The active Line Manager, Department Budget Owner, or Finance Reviewer can reject with a mandatory reason, producing a terminal, auditable result with no financial effect.
8. **Harden the reviewer-facing demo and handoff**
   - **Blocked by:** 05 — Confirm a Bank Transfer and reconcile every reporting view; 06 — Run a non-project request through the shared lifecycle; 07 — Reject a request at any active approval stage
   - **What it delivers:** Every role sees the correct queues, information, and actions; the required demo is polished and accessible; all tests pass; and the README enables a reviewer to run and understand the prototype.

## Dependency frontier

| Ticket | Can start when | Immediate blocker(s) |
| --- | --- | --- |
| 01 | Immediately | None |
| 02 | 01 is complete | 01 |
| 03 | 02 is complete | 02 |
| 04 | 03 is complete | 03 |
| 05 | 04 is complete | 04 |
| 06 | 05 is complete | 05 |
| 07 | 04 is complete | 04 |
| 08 | 05, 06, and 07 are complete | 05, 06, 07 |

After ticket 04, tickets 05 and 07 are both on the frontier and may be implemented independently. Ticket 06 deliberately follows ticket 05 so it can prove that the second Funding Source type uses the already-complete shared lifecycle rather than introducing a parallel workflow.

---

# 01 — Open a persistent FY2027 budget overview

**What to build:** A user can launch the prototype into an Overview that presents the canonical FY2027 company and department budget position. The figures come from one structured domain state, including the pre-existing Ramadan Campaign allocation and Payment-Confirmed Spend. That state persists in browser storage, can be viewed under simulated roles, and can be restored with Reset Demo Data.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] The Overview shows the Rp500B FY2027 Approved Budget and the six canonical department totals, including Technology at Rp60B.
- [ ] Company and department reporting distinguishes Approved Budget, Allocated to Projects, Department Unallocated Budget, Approved Unpaid Commitments, and Payment-Confirmed Spend.
- [ ] The opening Rp200M Technology Payment-Confirmed Spend is derived from canonical request/payment records rather than a mutable screen total.
- [ ] Funding Source calculations use integer Indonesian rupiah, format amounts consistently, and enforce that Project Allocations under a Budget Line cannot exceed its approved amount.
- [ ] The role switcher contains Requester, Line Manager, Department Budget Owner, Finance Reviewer, Finance Payment Processor, and Executive Viewer identities as distinct seeded people.
- [ ] Structured budgets, allocations, requests, Payment Records, Activity Events, and proof metadata load from browser storage after initial seeding and survive refresh.
- [ ] Reset Demo Data restores the exact canonical fixture and its opening financial values.
- [ ] Focused domain tests cover the opening Project Allocation and Budget Line Unallocated Balance calculations and the allocation invariant.

---

# 02 — Inspect the Ramadan Campaign across departmental allocations

**What to build:** From Overview, a user can open the Ramadan Campaign and understand its consolidated financial position while retaining the department and Budget Line ownership of every Project Allocation.

**Blocked by:** 01 — Open a persistent FY2027 budget overview.

**Status:** ready-for-agent

- [ ] Overview provides a working Ramadan Campaign entry point with no placeholder navigation.
- [ ] Project Detail shows the project name, owner, dates, status, and Rp5B Total Project Allocation.
- [ ] The department-allocation table shows Marketing Rp2.5B, Technology Rp800M, Operations Rp1.2B, and Creative Rp500M with their correct Budget Lines.
- [ ] The Technology allocation shows Rp0 Approved Unpaid Commitments, Rp200M Payment-Confirmed Spend, and Rp600M Available to Commit.
- [ ] Project totals and allocation rows are derived from the same allocations, requests, and Payment Records used by Overview.
- [ ] Project spending does not reduce Department Unallocated Budget again after the Project Allocation has already reserved that amount.
- [ ] Project Detail remains usable at smaller widths, and financial states use text labels in addition to color.

---

# 03 — Submit a project-backed request into the Request Workspace

**What to build:** A Technology Requester can create the Ramadan Campaign microsite request from Project Detail or the global New Request entry point. The product derives the valid Funding Source relationships and approvers, validates the amount, submits directly into the first approval stage, records the business event, and exposes the saved request in a unified Request Workspace.

**Blocked by:** 02 — Inspect the Ramadan Campaign across departmental allocations.

**Status:** ready-for-agent

- [ ] New Request from Project Detail preselects the Technology Ramadan Campaign Project Allocation; the global entry point can select that same Project Allocation through valid department and Budget Line relationships.
- [ ] The form requires title, Project Allocation, Budget Line, vendor or recipient, requested amount, required date, and business justification.
- [ ] Requester, requester department, direct Line Manager, Department Budget Owner, current Available to Commit, project, and allocation are derived rather than manually combined.
- [ ] A requester can select only Project Allocations owned by their own department, and incompatible department, Budget Line, project, or allocation combinations cannot be submitted.
- [ ] The amount must be greater than zero and cannot exceed the Funding Source's current Available to Commit; validation messages are connected to their fields.
- [ ] Submitting the Rp150M microsite request creates `Awaiting Line Manager Approval`, persists it, and records exactly one Request Submitted Activity Event.
- [ ] Submission leaves Rp0 Approved Unpaid Commitments, Rp200M Payment-Confirmed Spend, and Rp600M Available to Commit unchanged.
- [ ] Request Workspace provides All Requests, My Approvals, and Awaiting Payment Confirmation tabs, a selectable request list, the required request details, current status, pending approver, and read-only Activity History.
- [ ] Submitted requests cannot be edited, and refresh preserves both the request and its Activity Event.
- [ ] Domain tests cover valid submission, invalid relationships, non-positive amounts, over-availability amounts, and the rule that pending requests do not reserve budget.

---

# 04 — Approve a project request and create its commitment

**What to build:** The microsite request moves through Line Manager approval, Department Budget Owner approval, and Finance approval in the Request Workspace. Each decision is available only to the correct distinct actor at the active stage, and Finance approval uses a current impact preview before creating the commitment.

**Blocked by:** 03 — Submit a project-backed request into the Request Workspace.

**Status:** ready-for-agent

- [ ] My Approvals shows the request only to the actor responsible for its current stage, and the selected-request detail exposes role-appropriate Approve and Reject actions.
- [ ] Only the requester's direct Line Manager can move the request to `Awaiting Budget Owner Approval`; this action has no financial effect.
- [ ] Only the selected Funding Source's Department Budget Owner can move it to `Awaiting Finance Approval`; this action has no financial effect.
- [ ] The requester cannot self-approve, actors are distinct, the Finance Payment Processor cannot perform Finance approval, and stale, duplicate, out-of-order, or unauthorized actions are blocked.
- [ ] Immediately before Finance approval, the preview shows Rp800M Funding Source amount, Rp0 current Approved Unpaid Commitments, Rp200M current Payment-Confirmed Spend, Rp600M current Available to Commit, Rp150M request amount, and Rp450M projected Available to Commit.
- [ ] Finance approval rechecks current availability, blocks a negative projection, and displays a non-blocking inline warning when projected utilization reaches 80%.
- [ ] Valid Finance approval sets `approvedAmount` to the uneditable requested amount and changes status to `Approved — Awaiting Payment Confirmation`.
- [ ] Finance approval produces Rp150M Approved Unpaid Commitments, retains Rp200M Payment-Confirmed Spend, and changes Available to Commit to Rp450M.
- [ ] Each approval records exactly one immutable Activity Event with actor, role, timestamp, resulting status, and no duplicate generic Status Changed event.
- [ ] Refresh preserves the approval state, commitment, pending actor, and history.
- [ ] Domain tests cover authorized and invalid transitions, segregation of duties, duplicate approval attempts, the fresh availability check, commitment creation, and exact Activity Event creation.

---

# 05 — Confirm a Bank Transfer and reconcile every reporting view

**What to build:** A Finance Payment Processor can find the approved request in Awaiting Payment Confirmation, record evidence of the externally completed Bank Transfer, and confirm it exactly once. The request, Project Detail, and Overview immediately show one consistent reclassification from commitment to Payment-Confirmed Spend.

**Blocked by:** 04 — Approve a project request and create its commitment.

**Status:** ready-for-agent

- [ ] Only the Finance Payment Processor sees Record Payment for a request in `Approved — Awaiting Payment Confirmation`; the Finance Reviewer cannot confirm payment.
- [ ] Record Payment is a modal from Request Workspace and requires payment date, beneficiary, destination bank, transfer reference, and transfer-proof file, while payment amount is read-only and equals Rp150M.
- [ ] Transfer-proof validation runs immediately, accepts PDF, PNG, JPG, and JPEG up to and including 5 MB, rejects other types or larger files, displays filename/type/size, and supports removal or replacement before confirmation.
- [ ] Confirmation requires all valid fields, creates exactly one Payment Record, prevents duplicate confirmation, and changes status to `Payment Confirmed`.
- [ ] Only filename, type, and size are persisted for the proof; file contents are not persisted and no preview or download is offered.
- [ ] Confirmation changes Approved Unpaid Commitments from Rp150M to Rp0 and Payment-Confirmed Spend from Rp200M to Rp350M while Available to Commit remains Rp450M.
- [ ] Project Detail and Overview derive and display the same reclassification immediately, with the Rp150M transaction stored and counted only once.
- [ ] Payment Information becomes read-only and shows payment details, processor, confirmation timestamp, and proof metadata.
- [ ] Activity History adds exactly one Payment Confirmed event with actor, role, timestamp, amount, bank, reference, proof metadata, and resulting status.
- [ ] Refresh preserves the Payment Record, proof metadata, status, Activity Event, and reconciled totals; confirmed payments cannot be edited, deleted, corrected, or reversed.
- [ ] Domain tests cover confirmation preconditions, required evidence, file constraints, duplicate actions, payment reclassification, and the invariant that Available to Commit is not reduced twice.

---

# 06 — Run a non-project request through the shared lifecycle

**What to build:** From the global New Request action, a requester can choose a Budget Line Unallocated Balance and complete the same request, three-approval, payment-confirmation, persistence, reporting, and Activity History workflow without a project association.

**Blocked by:** 05 — Confirm a Bank Transfer and reconcile every reporting view.

**Status:** ready-for-agent

- [ ] The global form offers Project and Non-project Funding Source types; Non-project requires a valid Budget Line and displays no project or Project Allocation.
- [ ] A Technology requester can select only a Technology Budget Line Unallocated Balance, not Department Unallocated Budget or another department's Budget Line.
- [ ] Digital Products starts with a Rp17.2B Budget Line Unallocated Balance derived from Rp18B approved minus the Rp800M Ramadan Campaign Project Allocation.
- [ ] Project-backed commitments and Payment-Confirmed Spend do not consume Digital Products' Budget Line Unallocated Balance a second time.
- [ ] A valid non-project submission has no financial effect, Finance approval creates a non-project Approved Unpaid Commitment, and Payment Confirmation reclassifies it without another reduction.
- [ ] The non-project request uses the same statuses, role guards, queues, Payment Record rules, Activity Events, and browser-storage behavior as a project-backed request.
- [ ] Overview and department reporting include the non-project transaction exactly once while Project Detail excludes it.
- [ ] Domain tests cover the non-project formula, availability validation at submission and Finance approval, and one complete non-project lifecycle through Payment Confirmed.

---

# 07 — Reject a request at any active approval stage

**What to build:** The active approver can reject a request in the Request Workspace with a mandatory reason. Rejection is terminal, produces no commitment or spend, appears once in Activity History, and removes the request from actionable approval queues.

**Blocked by:** 04 — Approve a project request and create its commitment.

**Status:** ready-for-agent

- [ ] The direct Line Manager can reject only at `Awaiting Line Manager Approval`, the Department Budget Owner only at `Awaiting Budget Owner Approval`, and the Finance Reviewer only at `Awaiting Finance Approval`.
- [ ] A non-blank rejection reason is required and its validation message is connected to the input.
- [ ] Valid rejection changes the request to terminal `Rejected` and removes all Approve, Reject, and Record Payment actions.
- [ ] Rejection creates no Approved Unpaid Commitment or Payment-Confirmed Spend and leaves Available to Commit unchanged.
- [ ] Activity History records exactly one Request Rejected event with reason, actor, role, timestamp, and resulting status.
- [ ] Unauthorized, stale, out-of-order, and duplicate rejection attempts are blocked without adding events.
- [ ] Rejection state and history survive refresh and appear consistently to users who may view the request.
- [ ] Domain tests cover rejection at all three stages, mandatory reasons, terminal behavior, no financial effect, and idempotency.

---

# 08 — Harden the reviewer-facing demo and handoff

**What to build:** A reviewer can run the prototype, switch through every seeded role, execute the canonical project-backed story, inspect the non-project capability, verify the financial and Activity History invariants, reset the demo, and understand the solution and its deliberate boundaries from the README.

**Blocked by:** 05 — Confirm a Bank Transfer and reconcile every reporting view; 06 — Run a non-project request through the shared lifecycle; 07 — Reject a request at any active approval stage.

**Status:** ready-for-agent

- [ ] Requesters see only requests they created; Line Managers see direct-report requests; Department Budget Owners see requests charged to Funding Sources they own; Finance Reviewers and Executive Viewers see all requests; Finance Payment Processors see awaiting and completed payment confirmations.
- [ ] Executive Viewer is read-only, unauthorized actions are visibly unavailable, and domain guards still prevent unauthorized transitions independent of UI visibility.
- [ ] All three pages, all three Request Workspace tabs, both modals, navigation, role switching, and Reset Demo Data contain no dead controls or placeholder routes on the primary demo path.
- [ ] Currency formatting, status labels, focus behavior, field-linked validation, keyboard use, text-plus-color states, and smaller desktop/tablet layouts are consistent enough for the presentation.
- [ ] Reset Demo Data restores the exact canonical fixture after any mix of submissions, approvals, rejections, and payment confirmations.
- [ ] The complete automated suite passes and covers both Funding Source formulas and request types, authorized and invalid transitions, duplicate actions, commitment creation, payment reclassification, and Activity History invariants.
- [ ] The README explains the Finance problem, three-page structure, five-actor workflow and segregation of duties, Funding Source and financial terminology, setup/test commands, seeded role switching, exact canonical walkthrough, prototype tradeoffs, and out-of-scope capabilities.
- [ ] The README identifies future enterprise extensions including revision/resubmission, payment reversal, and Project Allocation governance without implying that they exist in the prototype.
- [ ] A manual rehearsal completes all 18 primary demo steps after a reset, including the Rp150M transition from submission through Payment Confirmed and the brief non-project form demonstration.

## Deferred, not ticketed in the required sequence

The PRD marks these as “if time permits,” so they are deliberately kept outside the required dependency graph until tickets 01–08 pass:

- `Revision Required` and resubmission, because the approval restart policy must be decided before implementation.
- An `Overdue` badge for requests awaiting payment confirmation after the required date.
- README screenshots.

## Review questions

1. Does this eight-ticket granularity feel right, or should any slice be coarser or finer?
2. Are the blocking edges correct, especially the decision to make the complete non-project lifecycle depend on payment confirmation while rejection can proceed in parallel?
3. Should any deferred, if-time enhancement become a numbered ticket now?
