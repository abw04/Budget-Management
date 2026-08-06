# Budget Execution

Budget Execution is an interactive prototype for controlling company money from an approved budget to an externally confirmed payment. It gives every request a visible Funding Source, a clear approval owner, a current financial classification, and an auditable history.

The product is built around one question:

> Can Finance understand what changed, who authorized it, which budget is affected, and what must happen next without reconstructing the story from other sources?

This repository demonstrates a complete answer through a seeded FY2027 scenario, role-based workflows, reconciled reporting, and a deliberately small technical implementation.

## The product in one minute

Many expense workflows record an approval but lose the connection between the request, its budget, and the eventual payment. Budget Execution treats that connection as a chain of custody.

A request moves through five meaningful stages:

```text
Requester submits
    -> Line Manager confirms the business need
    -> Department Budget Owner authorizes the Funding Source
    -> Finance Reviewer verifies availability and creates a commitment
    -> Finance Payment Processor records evidence of the external payment
```

The product does **not** move money. It records that a bank transfer happened elsewhere and preserves the evidence and financial effect.

## Who it is for

The primary users are Finance teams responsible for budget control and payment administration. Supporting users see only the information and actions needed for their role.

| Role | Product responsibility | Visibility |
| --- | --- | --- |
| Requester | Creates a request against an eligible Funding Source | Own requests and department project allocations |
| Line Manager | Confirms that the business need is valid | Requests from direct reports |
| Department Budget Owner | Authorizes use of the department's budget | Requests and reporting for their department |
| Finance Reviewer | Performs the final availability and control check | Company-wide requests and reporting |
| Finance Payment Processor | Records evidence of an externally completed transfer | Requests awaiting payment and confirmed payments |
| Executive Viewer | Reviews the company position and audit trail | Company-wide, read-only |

The prototype includes a persistent actor switcher so the complete segregation-of-duties model can be evaluated without a real identity system.

## Product thinking

### 1. Start with the Funding Source, not the form

Every request must name the exact budget authority it will consume. The product supports two paths:

- **Project Allocation** for work funded by a department's allocation to a project.
- **Budget Line Unallocated Balance** for non-project spending.

The broader **Department Unallocated Budget** is useful for reporting, but it is intentionally not selectable. Allowing a request to target an aggregate would make ownership and reconciliation ambiguous.

This choice also supports cross-functional projects. The Ramadan Campaign has allocations from several departments, while each department retains ownership of its own portion.

### 2. Separate business approval, budget authority, and financial control

The workflow uses three approvals because they answer different questions:

| Decision | Question answered | Financial effect |
| --- | --- | --- |
| Line Manager approval | Is this a valid business need? | None |
| Budget Owner approval | May this department Funding Source be used? | None |
| Finance approval | Is the request correctly classified and still affordable? | Creates an Approved unpaid commitment |
| Payment confirmation | Was the approved amount transferred externally, with evidence? | Reclassifies the commitment as Payment-confirmed spend |

Finance review and payment processing are assigned to different actors. This is a deliberate segregation-of-duties control: the person who creates the financial commitment cannot also attest that it was paid.

### 3. Make financial state transitions explicit

Pending requests do not reserve budget. This avoids presenting an early-stage request as committed company money.

At Finance approval, availability is checked again to protect against another request consuming the same funds while the first request was moving through earlier approvals. A successful Finance approval creates an **Approved unpaid commitment**.

At payment confirmation, that amount moves from commitment to **Payment-confirmed spend**. Available to commit does not fall a second time.

For a Project Allocation:

```text
Available to commit
= Project Allocation
- Approved unpaid commitments
- Payment-confirmed spend
```

For a non-project request:

```text
Budget Line Unallocated Balance
= Budget Line Approved Amount
- Project Allocations
- Non-project Approved unpaid commitments
- Non-project Payment-confirmed spend
```

All amounts are stored as integer Indonesian rupiah. Reporting screens derive their totals from allocations, requests, and payment records rather than maintaining separate mutable totals.

### 4. Design each screen around a decision

- **Overview** answers: What is the current company or department budget position?
- **Projects** answers: Which projects exist, and how much remains available?
- **Project Detail** answers: How is a cross-functional project funded by each department?
- **Request Workspace** answers: What needs my attention, what am I authorized to do, and what is the financial consequence?
- **Activity History** answers: Who did what, when, and what status resulted?

The visual direction is a “glass-walled control room”: restrained color, ledger-like alignment, plain-language statuses, and before/after financial values. The interface avoids decorative dashboard charts because exact classification and reconciliation matter more here than visual novelty.

### 5. Optimize the prototype for learning

This is a presentation prototype, not a disguised production system. The seeded fixture, simulated actors, browser persistence, and reset action make the same product story fast to explore and easy to repeat.

The prototype intentionally concentrates on the riskiest product questions:

- Can one transaction remain consistent across request, project, department, and company views?
- Are role boundaries understandable without training?
- Can users distinguish approval, commitment, and payment?
- Can a project span departments without obscuring budget ownership?
- Does the audit history explain the complete chain of custody?

## Canonical walkthrough

The fastest way to evaluate the product is the seeded Ramadan Campaign scenario.

1. Run the app and open **Projects > Ramadan Campaign**.
2. Find Technology's `Rp800M` allocation. It starts with `Rp200M` Payment-confirmed spend and `Rp600M` Available to commit.
3. Switch to **Alya Pranata — Requester** and create a project-backed `Rp150M` microsite request against Technology's Digital Products allocation.
4. Confirm that submission does not change the financial figures.
5. Switch to **Raka Wijaya — Line Manager** and approve the request.
6. Switch to **Dewi Lestari — Department Budget Owner** and approve it.
7. Switch to **Nina Kurnia — Finance Reviewer**. Review the impact preview: `Rp600M` currently available, `Rp150M` requested, and `Rp450M` projected.
8. Approve the request. The product now shows a `Rp150M` Approved unpaid commitment and `Rp450M` Available to commit.
9. Switch to **Siti Rahma — Finance Payment Processor** and open **Awaiting Payment Confirmation**.
10. Record the bank-transfer details and choose a PDF, PNG, JPG, or JPEG proof file no larger than 5 MB.
11. Confirm the payment. Approved unpaid commitments return to `Rp0`, Payment-confirmed spend becomes `Rp350M`, and Available to commit remains `Rp450M`.
12. Verify the same result in Request Workspace, Project Detail, and Overview, then inspect the Activity History.

Use **Reset Demo Data** at any time to restore the starting fixture.

## Run locally

The app has no external runtime dependencies. Use Node.js 20 or newer:

```bash
npm run dev
```

Open [http://localhost:4173](http://localhost:4173).

To run the automated checks:

```bash
npm test
npm run build
```

`npm test` covers the financial formulas, role authorization, department visibility, approval transitions, payment-proof validation, rejection, concurrency-sensitive Finance rechecks, and the no-double-counting invariant. `npm run build` performs a syntax check on the browser entry point.

For a fuller hands-on review, follow [MANUAL-TEST-CHECKLIST.md](./MANUAL-TEST-CHECKLIST.md).

## Implementation approach

The prototype uses dependency-free browser JavaScript, CSS, Node's built-in HTTP server, and Node's built-in test runner. Structured state is stored in `localStorage`, while reporting values are derived in the domain layer.

```text
src/domain/store.js   Domain entities, permissions, transitions, and financial calculations
src/main.js           Application rendering and browser interactions
src/styles.css        Responsive visual system
server.mjs            Loopback-only static development server
tests/                Domain, UI-contract, and server-start checks
```

The lightweight stack is a scope decision: it keeps the six-hour prototype portable and reviewable without an install step. In production, the domain rules could sit behind a server API while the current UI model remains a useful validation artifact.

## Deliberate boundaries

Included in the prototype:

- Project-backed and non-project requests.
- Three-stage approval with stage-specific authorization.
- Rejection with a required reason.
- Finance impact preview and fresh availability validation.
- Separate external payment confirmation with proof metadata.
- Role-scoped navigation, queues, actions, and reporting.
- Immutable activity events, browser persistence, and resettable demo data.

Not included:

- Real authentication or server-side authorization.
- Budget planning, project creation, or allocation-change governance.
- Procurement, invoices, tax, payroll, reimbursement, or general-ledger posting.
- Bank integration or payment execution.
- Partial payments, batches, corrections, reversals, or payment deletion.
- Persisting uploaded proof contents; only filename, MIME type, and size are retained.
- Notifications, configurable approval matrices, or advanced analytics.

These exclusions keep the prototype focused on budget execution and traceability. A production version would require identity integration, server-side policy enforcement, transactional persistence, encrypted evidence storage, access logging, and explicit correction/reversal workflows.

## What I would measure next

The prototype validates the workflow model; a pilot would validate its operational value. The first measures I would use are:

- Time from request submission to Finance decision.
- Percentage of requests returned because the Funding Source or classification is wrong.
- Percentage of approved requests waiting beyond their required date for payment confirmation.
- Number of manual reconciliations needed between request, project, and department reporting.
- Frequency of unauthorized or duplicate action attempts.
- User confidence in identifying the current owner and next action.

Those signals would guide whether to invest next in revision/resubmission, overdue controls, configurable approval policy, accounting integration, or payment correction workflows.

## Supporting documents

- [PRD.md](./PRD.md) — detailed requirements, rules, data model, and acceptance criteria.
- [DESIGN.md](./DESIGN.md) — interaction principles and visual direction.
- [BUILD-SCOPE.md](./BUILD-SCOPE.md) — prototype delivery boundaries.
- [MANUAL-TEST-CHECKLIST.md](./MANUAL-TEST-CHECKLIST.md) — end-to-end review cases.

