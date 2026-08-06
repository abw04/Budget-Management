# Product Requirements Document

## Budget Request, Approval, and Payment Confirmation

| Attribute | Value |
| --- | --- |
| Document status | Approved for six-hour prototype |
| Product type | Internal finance operations application |
| Primary users | Finance Reviewer and Finance Payment Processor |
| Supporting users | Requester, Line Manager, Department Budget Owner, Executive Viewer |
| Financial year | FY2027 |
| Primary scenario | Ramadan Campaign microsite request |

## 1. Product Summary

The product gives the Finance team a systematic way to trace company funds from an approved departmental budget through expense request, business approval, budget authorization, financial approval, and external payment confirmation.

It supports two expense types:

1. A project-backed request funded by a department's Project Allocation.
2. A non-project request funded by a Budget Line Unallocated Balance.

Both use the same approval, payment-confirmation, reporting, and Activity History workflow.

The product is a budget-execution control system. It does not execute bank transfers or determine general-ledger accounting recognition. An externally paid amount is reported as **Payment-Confirmed Spend**, not as an accounting expense.

## 2. Problem

Enterprise expense requests and cross-functional project budgets are often coordinated through spreadsheets, email, chat, and disconnected departmental records. This creates several risks:

- Requests may not identify the budget that will fund them.
- The requester's manager, the department's budget owner, and Finance may perform overlapping or unclear reviews.
- Pending and approved requests may be confused with Payment-Confirmed Spend.
- Project and department reports may count the same transaction differently.
- Finance may lack an auditable record connecting approval to external payment evidence.
- Project owners may not know which department owns each portion of a cross-functional budget.

## 3. Product Objective

Demonstrate that one expense request can move through an enterprise control workflow while remaining traceable to one Funding Source and reconciling across project, department, and annual reporting views.

The prototype succeeds when a reviewer can:

- create either a project-backed or non-project request;
- route it through three distinct approvals;
- see the projected budget impact before Finance approval;
- record external payment evidence through a separate Finance role;
- observe the correct commitment-to-spend reclassification;
- verify the same transaction in every relevant reporting view;
- inspect an immutable Activity History;
- refresh and continue the demo without losing structured state.

## 4. Product Boundary

### In scope

- Approved FY2027 company and department budgets from seeded data.
- Seeded budget lines, projects, and Project Allocations.
- Project-backed expense requests.
- Non-project expense requests against a Budget Line Unallocated Balance.
- Line Manager approval.
- Department Budget Owner approval.
- Finance approval with a live impact preview.
- Rejection with a mandatory reason.
- External Bank Transfer confirmation by a separate Finance Payment Processor.
- Mock transfer-proof validation and metadata capture.
- Derived annual, department, project, and allocation figures.
- Role-based queues, visibility, and actions through simulated role switching.
- Read-only Activity History.
- Browser-storage persistence and Reset Demo Data.
- Focused domain-level unit tests.
- Reviewer-facing README.

### If time permits

- `Revision Required` and resubmission. The approval restart policy must be decided before implementation.
- An `Overdue` badge for requests awaiting payment confirmation after their required date.
- Screenshots in the README.

### Out of scope

- Annual budget creation, negotiation, approval, or revision.
- Project creation, Project Allocation creation, and allocation-change governance.
- Real authentication, directory integration, or configurable approval matrices.
- Procurement, purchase orders, invoice matching, tax, payroll, or reimbursement.
- Bank or payment-system execution.
- General-ledger posting or accounting recognition.
- Payment methods other than Bank Transfer.
- Partial payments, payment batches, failed transfers, correction, cancellation, or reversal.
- Editing or deleting a confirmed payment.
- Persisting, previewing, or downloading transfer-proof file contents.
- Persisted request drafts.
- A `Payment Processing` lifecycle state.
- Separate alert, audit, project-portfolio, or department-detail modules.
- Notifications and advanced analytics.
- Browser-level end-to-end test automation.

## 5. Users and Responsibilities

All workflow actors are distinct people in the prototype. A requester cannot approve their own request.

| Role | Responsibility | Request visibility |
| --- | --- | --- |
| Requester | Creates requests against permitted Funding Sources | Requests they created |
| Line Manager | Confirms business need for direct reports | Requests from direct reports |
| Department Budget Owner | Authorizes consumption of the charged department's budget | Requests charged to Funding Sources they own |
| Finance Reviewer | Performs final financial-control approval | All requests |
| Finance Payment Processor | Records evidence of externally completed Bank Transfers | Requests awaiting payment confirmation and completed payment confirmations |
| Executive Viewer | Reviews company, department, project, and request information | All requests, read-only |

The Finance Reviewer cannot confirm payment. The Finance Payment Processor cannot perform Finance approval.

## 6. Domain Language

### Funding Source

The controlled budget authority against which an expense request is made. It is one of:

- **Project Allocation:** an amount reserved from one Budget Line for one project.
- **Budget Line Unallocated Balance:** the portion of one Budget Line that is not reserved by Project Allocations or consumed by non-project commitments and Payment-Confirmed Spend.

Every request references one Budget Line and one Funding Source. A project-backed request also references one Project Allocation. A non-project request has no project.

### Department Unallocated Budget

The sum of a department's Budget Line Unallocated Balances. It is a reporting total and cannot be selected directly as a request's Funding Source.

### Approved Unpaid Commitment

An expense request that has received Finance approval and consumes part of its Funding Source but has not been confirmed as paid.

### Payment-Confirmed Spend

An approved amount that a Finance Payment Processor confirms was paid through an external payment system. This is a budget-control classification, not a general-ledger-recognized expense.

### Available to Commit

The amount within a Funding Source that remains available for new commitments.

### Activity History

The immutable chronological record of meaningful business actions and decisions for one expense request.

## 7. Information Architecture

The prototype has three primary pages.

### 7.1 Overview

Purpose: present company and department budget position and provide entry points into projects and requests.

Required components:

- FY2027 summary.
- Company-level Approved Budget, Allocated to Projects, Department Unallocated Budget, Approved Unpaid Commitments, and Payment-Confirmed Spend.
- Department table with the same categories.
- Ramadan Campaign card or row.
- Global `New Request` action.
- Role switcher.
- `Reset Demo Data` action.

Technology details may expand inline or in a drawer. A separate Department Detail route is not required.

### 7.2 Project Detail

Purpose: show the consolidated position of one cross-functional project without losing departmental ownership.

Required components:

- Project name, owner, dates, and status.
- Total Project Allocation.
- Approved Unpaid Commitments.
- Payment-Confirmed Spend.
- Available to Commit.
- Department-allocation table.
- Project-related requests.
- `New Request` action prefilled with the selected Project Allocation.

A separate Project Portfolio route is not required.

### 7.3 Request Workspace

Purpose: combine request queues, request detail, approval actions, payment information, and Activity History.

Required components:

- Tabs: `All Requests`, `My Approvals`, and `Awaiting Payment Confirmation`.
- Request list and selected-request detail.
- Requester, department, Budget Line, Funding Source, and project when applicable.
- Vendor, requested amount, required date, and business justification.
- Current status and pending approver.
- Current and projected budget impact.
- Role-dependent `Approve` and `Reject` actions.
- `Record Payment` action for the Finance Payment Processor.
- Read-only Payment Information after confirmation.
- Read-only Activity History.

`New Request` and `Record Payment` are modals, not separate pages.

## 8. Request Creation

### Entry points

- The global `New Request` action supports both Funding Source types.
- `New Request` from Project Detail preselects the relevant Project Allocation.

### Required fields

- Request title.
- Funding-source type: Project or Non-project.
- Budget Line.
- Project Allocation when project-backed.
- Vendor or recipient.
- Requested amount.
- Required date.
- Business justification.

### Derived fields

- Requester and requester department.
- Direct Line Manager.
- Department Budget Owner.
- Project when derived from a Project Allocation.
- Current Available to Commit.
- Project Allocation or Budget Line relationship.

### Rules

- A requester may select only Funding Sources belonging to their own department.
- Valid department, Budget Line, Project Allocation, and project relationships come from seeded data; users cannot combine unrelated values.
- Requested amount must be greater than zero.
- Requested amount cannot exceed the Funding Source's current Available to Commit.
- Submission immediately creates `Awaiting Line Manager Approval`; drafts are not persisted.
- Submission creates no financial commitment.
- Submitted requests cannot be edited in the initial cut.

## 9. Approval Workflow

### Happy path

```text
Awaiting Line Manager Approval
→ Awaiting Budget Owner Approval
→ Awaiting Finance Approval
→ Approved — Awaiting Payment Confirmation
→ Payment Confirmed
```

### Approval purposes

| Decision | Actor | Purpose | Financial effect |
| --- | --- | --- | --- |
| Line Manager approval | Requester's direct manager | Confirms business need | None |
| Department Budget Owner approval | Owner of the Funding Source's department | Authorizes use of department budget | None |
| Finance approval | Finance Reviewer | Verifies prior approvals, classification, evidence, and current availability | Creates Approved Unpaid Commitment |
| Payment confirmation | Finance Payment Processor | Records evidence of external Bank Transfer | Reclassifies commitment as Payment-Confirmed Spend |

### Finance impact preview

Immediately before Finance approval, display:

- Funding Source amount.
- Current Approved Unpaid Commitments.
- Current Payment-Confirmed Spend.
- Current Available to Commit.
- Request amount.
- Projected Available to Commit after approval.

Finance approval performs a fresh availability check. Approval is blocked if the projection is negative.

Approval is all-or-nothing. Approvers cannot modify request amounts. At Finance approval, `approvedAmount = requestedAmount`.

### Rejection

Line Manager, Department Budget Owner, and Finance Reviewer may reject a request only when it is at their stage.

- Rejection is terminal in the initial cut.
- A rejection reason is mandatory.
- Rejection has no financial effect.
- The event appears in Activity History.

## 10. Payment Confirmation

Payment execution occurs outside the product. The product records the evidence and result.

### Preconditions

- Request status is `Approved — Awaiting Payment Confirmation`.
- Current actor is the Finance Payment Processor.
- No Payment Record already exists for the request.

### Required fields

- Payment date.
- Payment amount, read-only and equal to approved amount.
- Beneficiary.
- Destination bank.
- Transfer reference.
- Transfer-proof file.

### Transfer-proof behavior

- Accept PDF, PNG, JPG, and JPEG.
- Maximum size is 5 MB.
- Validate type and size immediately.
- Display filename, type, and size.
- Allow removal or replacement before confirmation.
- Persist only filename, type, and size after confirmation.
- Do not persist file contents or provide preview or download.

### Confirmation effect

- Create exactly one Payment Record.
- Change status to `Payment Confirmed`.
- Decrease Approved Unpaid Commitments by the approved amount.
- Increase Payment-Confirmed Spend by the same amount.
- Do not reduce Available to Commit a second time.
- Make payment details read-only.
- Add Payment Confirmed to Activity History with actor, timestamp, amount, bank, reference, and proof metadata.

Confirmed payments cannot be edited, deleted, corrected, or reversed in the prototype.

## 11. Financial Rules

### Project-backed Funding Source

```text
Available to Commit
= Project Allocation
− Approved Unpaid Commitments against the allocation
− Payment-Confirmed Spend against the allocation
```

### Non-project Funding Source

```text
Budget Line Unallocated Balance
= Budget Line Approved Amount
− Project Allocations under the Budget Line
− Non-project Approved Unpaid Commitments
− Non-project Payment-Confirmed Spend
```

### Department reporting

```text
Department Unallocated Budget
= Sum of Budget Line Unallocated Balances
```

Project spending must not reduce Department Unallocated Budget again because the Project Allocation already reserved that amount.

### General invariants

1. The sum of Project Allocations under a Budget Line cannot exceed that Budget Line's approved amount.
2. Pending requests do not reserve budget.
3. Submission checks current availability for early feedback.
4. Finance approval rechecks availability and is the only action that creates a commitment.
5. Payment confirmation changes classification but not total consumed budget.
6. One request and one Payment Record are stored once even when reported in multiple views.
7. Screen totals are derived from allocations, requests, and Payment Records; screens do not own mutable copies of totals.
8. Monetary values use integer Indonesian rupiah and are formatted consistently for display.
9. If projected utilization reaches 80%, show an inline warning without blocking approval.

## 12. Activity History

Record only meaningful business events:

- Request Submitted.
- Line Manager Approved.
- Department Budget Owner Approved.
- Finance Approved.
- Request Rejected.
- Payment Confirmed.

Each event includes:

- actor identity;
- actor role;
- system timestamp;
- resulting request status;
- required rejection reason when applicable;
- payment amount, bank, reference, and proof metadata for Payment Confirmed.

Do not create a duplicate generic `Status Changed` event. Events are immutable.

## 13. Data Model

### User

- `id`
- `name`
- `role`
- `departmentId`
- `managerId`

### DepartmentBudget

- `id`
- `departmentId`
- `financialYear`
- `approvedAmount`
- `budgetOwnerId`

### BudgetLine

- `id`
- `departmentBudgetId`
- `name`
- `approvedAmount`

### Project

- `id`
- `name`
- `ownerName`
- `startDate`
- `endDate`
- `status`

### ProjectAllocation

- `id`
- `projectId`
- `budgetLineId`
- `allocatedAmount`

### ExpenseRequest

- `id`
- `title`
- `requesterId`
- `departmentId`
- `lineManagerApproverId`
- `budgetOwnerApproverId`
- `budgetLineId`
- `fundingSourceType`: `PROJECT_ALLOCATION` or `BUDGET_LINE_UNALLOCATED`
- `projectAllocationId`, required only for a project-backed request
- `vendorName`
- `requestedAmount`
- `approvedAmount`, set only at Finance approval
- `requiredDate`
- `justification`
- `status`
- `createdAt`
- `approvedAt`
- `paymentConfirmedAt`

### PaymentRecord

- `id`
- `expenseRequestId`, unique
- `paymentDate`
- `confirmedAmount`
- `beneficiaryName`
- `destinationBank`
- `transferReference`
- `transferProofFileName`
- `transferProofFileType`
- `transferProofFileSize`
- `processedByUserId`
- `confirmedAt`

### ActivityEvent

- `id`
- `expenseRequestId`
- `eventType`
- `actorId`
- `actorRole`
- `timestamp`
- `resultingStatus`
- `comment`
- `metadata`

Committed, spent, available, and unallocated totals are derived values and are not independently mutated on each screen.

## 14. Persistence and Prototype Security

- Use simulated role switching; no real authentication is required.
- Persist structured budgets, requests, Payment Records, Activity Events, and proof metadata in browser storage.
- Provide `Reset Demo Data` to restore the canonical fixture.
- Do not persist uploaded file contents.
- Do not request or display full bank-account numbers.
- Role visibility and action guards must still be enforced in the prototype UI and domain transitions.
- Production would require identity integration, server-side authorization, encrypted file storage, access logging, and stronger segregation-of-duties controls.

## 15. Canonical Fixture

### FY2027 company budget

| Department | Approved budget |
| --- | ---: |
| Marketing | Rp120B |
| Technology | Rp60B |
| Operations | Rp80B |
| Creative | Rp25B |
| Finance | Rp40B |
| Other departments | Rp175B |
| **Total** | **Rp500B** |

### Technology Budget Lines

| Budget Line | Approved amount |
| --- | ---: |
| Core Systems | Rp20B |
| Infrastructure | Rp15B |
| Digital Products | Rp18B |
| Contingency | Rp7B |
| **Total** | **Rp60B** |

### Ramadan Campaign Project Allocations

| Department | Budget Line | Project Allocation |
| --- | --- | ---: |
| Marketing | Brand Campaigns | Rp2.5B |
| Technology | Digital Products | Rp800M |
| Operations | Campaign Operations | Rp1.2B |
| Creative | Content Production | Rp500M |
| **Total** |  | **Rp5B** |

Technology's Project Allocation begins with Rp200M of Payment-Confirmed Spend and no Approved Unpaid Commitment.

### Project request lifecycle

| Stage | Allocation | Approved unpaid | Payment-confirmed spend | Available to commit |
| --- | ---: | ---: | ---: | ---: |
| Initial | Rp800M | Rp0 | Rp200M | Rp600M |
| Rp150M request submitted | Rp800M | Rp0 | Rp200M | Rp600M |
| Finance approval | Rp800M | Rp150M | Rp200M | Rp450M |
| Payment Confirmed | Rp800M | Rp0 | Rp350M | Rp450M |

### Non-project starting balance

Digital Products begins with a Rp17.2B Budget Line Unallocated Balance:

```text
Rp18B approved − Rp800M Ramadan Project Allocation = Rp17.2B
```

A non-project request reduces that balance only when Finance approves it. Payment Confirmation does not reduce it again.

## 16. Acceptance Criteria

### Request creation

1. A Technology requester can create a project-backed request only against a Technology Project Allocation.
2. A Technology requester can create a non-project request only against a Technology Budget Line Unallocated Balance.
3. Selecting a Project Allocation displays its project; selecting Non-project displays no project.
4. Invalid department, Budget Line, project, and Funding Source combinations cannot be submitted.
5. A request above current Available to Commit is blocked.
6. A valid submission becomes `Awaiting Line Manager Approval` without changing financial totals.

### Approval and authorization

1. Only the requester's Line Manager can perform the first approval.
2. Only the selected Funding Source's Department Budget Owner can perform the second approval.
3. Only the Finance Reviewer can perform Finance approval.
4. Each approval is performed by a distinct actor; the requester cannot self-approve.
5. Line Manager and Budget Owner approvals do not change financial totals.
6. Finance sees current availability, request amount, and projected remaining amount before approval.
7. Finance approval is blocked when projected remaining is negative.
8. Valid Finance approval creates an Approved Unpaid Commitment equal to the requested amount.
9. Any approver at the active stage can reject with a required reason; rejection is terminal and has no financial effect.

### Payment confirmation

1. Only the Finance Payment Processor sees `Record Payment` for `Approved — Awaiting Payment Confirmation`.
2. The payment amount is read-only and equals the approved amount.
3. Confirmation is blocked without valid Bank Transfer details and proof metadata.
4. PDF, PNG, JPG, and JPEG files up to 5 MB are accepted; other types or larger files are rejected.
5. The same request cannot be confirmed twice.
6. Payment Confirmation changes Approved Unpaid Commitments from Rp150M to Rp0 and Payment-Confirmed Spend from Rp200M to Rp350M.
7. Available to Commit remains Rp450M after Payment Confirmation.
8. Confirmed payment details and proof metadata are read-only.

### Reporting and persistence

1. Project, department, and annual views derive their values from the same records.
2. The Rp150M transaction is not double counted across reporting views.
3. Refreshing the application preserves structured workflow and financial state.
4. `Reset Demo Data` restores the canonical fixture.
5. Activity History records each meaningful action once with the correct actor, role, timestamp, status, and metadata.

### Repository quality

1. Domain-level unit tests cover both Funding Source formulas and both request types.
2. Tests cover authorized transitions, invalid transitions, duplicate actions, commitment creation, and payment reclassification.
3. The README explains setup, tests, roles, financial terminology, demo steps, and deliberate scope decisions.

## 17. Primary Demo Scenario

1. Open Overview and show the FY2027 Rp500B company budget.
2. Show Technology's Rp60B budget and the Ramadan Campaign entry point.
3. Open Ramadan Campaign and show its Rp5B cross-department allocation.
4. Show Technology's Rp800M allocation: Rp200M Payment-Confirmed Spend and Rp600M Available to Commit.
5. Switch to the Technology Requester and create a Rp150M microsite request.
6. Show that submission does not change the financial figures.
7. Switch to the requester's Line Manager and approve.
8. Switch to Technology's Department Budget Owner and approve.
9. Switch to the Finance Reviewer.
10. Show the impact preview: Rp600M current availability, Rp150M request, Rp450M projected remaining.
11. Approve and show Rp150M Approved Unpaid Commitment with Rp450M Available to Commit.
12. Switch to the Finance Payment Processor.
13. Open `Awaiting Payment Confirmation`, enter Bank Transfer details, and select a valid proof file.
14. Confirm payment.
15. Show status `Payment Confirmed`, Rp350M Payment-Confirmed Spend, Rp0 Approved Unpaid Commitment, and unchanged Rp450M Available to Commit.
16. Show the same transaction in Project Detail and Overview.
17. Show the complete Activity History.
18. Briefly open `New Request` and demonstrate the functional Non-project Funding Source option without running a second presentation workflow.

## 18. Non-Functional Requirements

- Optimize for a polished desktop presentation; smaller layouts must not become unusable, but mobile optimization is not a priority.
- Use consistent Indonesian rupiah formatting.
- Use text labels in addition to color for statuses and warnings.
- Connect validation messages to their fields.
- Keep approval and payment actions visibly unavailable to unauthorized roles.
- Update local derived state immediately after actions.
- Keep the primary demo path free of dead controls and placeholder navigation.

## 19. Delivery Priorities

Implement in this order:

1. Domain entities, Funding Source calculations, state transitions, and tests.
2. Canonical fixture and browser-storage persistence.
3. Request Workspace with role switching and three approvals.
4. Finance impact preview and commitment creation.
5. Bank Transfer confirmation and proof metadata.
6. Overview and Project Detail derived reporting.
7. Rejection and Activity History.
8. README, reset behavior, validation polish, and presentation rehearsal.
9. If-time enhancements only after the required acceptance criteria pass.

## 20. Reviewer-Facing README

The repository README must contain:

- the Finance problem and primary users;
- the three-page product structure;
- the five-actor workflow and segregation of duties;
- Funding Source and financial-term definitions;
- setup and test commands;
- role-switching instructions;
- the canonical demo walkthrough;
- explicit prototype tradeoffs and out-of-scope capabilities;
- future enterprise extensions, including revision, payment reversal, and project-allocation governance.
