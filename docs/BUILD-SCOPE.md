# Six-Hour Prototype Scope

Working decisions from the PRD grilling session. Implementation should begin only after the interview reaches shared understanding.

## Required

- Treat the product as budget execution control, not accounting recognition.
- Optimize the primary experience for the Finance team, represented by Finance Reviewer and Finance Payment Processor roles.
- Use distinct actors for Requester, Line Manager, Department Budget Owner, Finance Reviewer, and Finance Payment Processor; the requester cannot approve their own request.
- Use this happy path: `Awaiting Line Manager Approval` -> `Awaiting Budget Owner Approval` -> `Awaiting Finance Approval` -> `Approved - Awaiting Payment Confirmation` -> `Payment Confirmed`.
- Line Manager approval confirms business need and has no financial effect.
- Department Budget Owner approval authorizes use of the charged Funding Source and has no financial effect.
- Pending requests do not reserve budget; their value may be shown separately as pending exposure.
- Finance approval performs a fresh availability check and creates an approved unpaid commitment.
- Before Finance approval, show an impact preview with the current available-to-commit amount, the request amount, and the projected amount remaining after approval; block approval if the projection is negative.
- Approval is all-or-nothing: approvers cannot edit financial fields, and Finance approval locks `approvedAmount` to `requestedAmount`.
- Payment confirmation reclassifies the commitment as payment-confirmed spend without reducing the amount available to commit again.
- Bank Transfer is the only functional payment method. Payment confirmation requires payment date, the locked approved amount, beneficiary, destination bank, transfer reference, and mock transfer-proof metadata.
- Transfer proof accepts PDF, PNG, JPG, or JPEG up to 5 MB; validate type and size immediately, display filename/type/size, and allow removal or replacement before confirmation.
- After Payment Confirmation, show the saved proof metadata in Payment Information and Activity History; do not provide preview or download.
- Persist workflow state, financial state, Activity History events, and transfer-proof filename/type/size in browser storage so the demo survives refresh.
- Provide a `Reset Demo Data` action that restores the seeded scenario.
- Allow any approver to reject a request as a terminal action; require a comment and record the event in Activity History.
- Record only meaningful business events: Request Submitted, Line Manager Approved, Department Budget Owner Approved, Finance Approved, Request Rejected, and Payment Confirmed; do not add duplicate generic status-change events.
- Every Activity History event records actor identity, actor role, system timestamp, resulting status, and any required comment or payment evidence metadata.
- Use four primary pages: Overview, Projects, Project Detail, and Request Workspace.
- Overview combines annual summary, department summary, and a project spotlight entry point; a separate Department Detail page is not required.
- Projects lists available projects and opens the selected Project Detail; it is the stable navigation destination for project records.
- Project Detail combines project financials, departmental allocations, requests, and a `Create Request` modal.
- Request Workspace combines All Requests, My Approvals, and Awaiting Payment tabs with the selected request's details, role-dependent actions, and Activity History.
- Use a `Record Payment` modal from the Request Workspace rather than a separate payment page.
- Show Activity History inside Request Workspace rather than building a separate audit screen.
- Store allocations, expense requests, approval events, and payment records once, and derive all Overview and Project Detail financial totals from that shared data rather than mutating screen-specific aggregates.
- Seed projects and Project Allocations as hardcoded demo data; the functional workflow begins after those allocations already exist.
- Annual and department summaries distinguish Approved, Allocated to Projects, Unallocated Budget, Approved Unpaid Commitments, and Payment-Confirmed Spend.
- Project and allocation views distinguish Allocation, Approved Unpaid Commitments, Payment-Confirmed Spend, and Available to Commit.
- Do not use the unqualified label `Available Budget`.
- Every expense request references one Funding Source: either a Project Allocation or a Budget Line Unallocated Balance within the requester's department.
- Project-backed and non-project requests use the same approval, financial, payment, and audit workflow.
- Both Funding Source types must function end to end in the repository, but the primary presentation completes only the project-backed Ramadan Campaign request; the non-project path is demonstrated briefly through the request form.
- Provide one global `New Request` form driven by funding-source type, department, budget line, and Project Allocation when applicable; show the project only for a project-backed request.
- Opening `New Request` from Project Detail preselects the relevant Project Allocation, while the global entry point supports both Project Allocation and Budget Line Unallocated Balance.
- Derive valid department, budget line, and project relationships from the selected Funding Source rather than allowing incompatible combinations.
- A requester may select only Funding Sources owned by their own department.
- Every request, including a non-project request, references one Budget Line; Department Unallocated Budget is a derived reporting total rather than a selectable Funding Source.
- Route Line Manager approval from the requester's reporting relationship and Department Budget Owner approval from the selected Funding Source's department; neither approver is manually selected by the requester.
- The required request fields are title, funding-source type, Project Allocation when project-backed, budget line, vendor or recipient, requested amount, required date, and business justification.
- Derive requester, requester department, Line Manager, Department Budget Owner, current availability, and project association from the signed-in role and selected Funding Source.
- Requesters see requests they created; Line Managers see requests from their direct reports and project allocations in their own department; Department Budget Owners see requests charged to allocations they own and their department overview; Finance Reviewers and Executive Viewers see all requests and company-wide reporting; Finance Payment Processors see requests awaiting payment and completed payment confirmations.
- Overview is available company-wide only to Finance Reviewers and Executive Viewers. Department Budget Owners receive a department-scoped Overview. Requesters, Line Managers, and Finance Payment Processors do not receive Overview access. Projects are scoped to the active user's department for Requesters, Line Managers, and Department Budget Owners.
- Executive access is read-only, and each approver may act only when a request is at their stage.
- Only the Finance Payment Processor may record payment, and only when a request is `Approved - Awaiting Payment Confirmation`; requesters cannot edit submitted requests in the initial cut.
- The Finance Reviewer cannot confirm payment on a request they approved, and the Finance Payment Processor cannot perform Finance approval.
- Include focused domain-level unit tests for both Funding Source calculations, commitment creation at Finance approval, payment reclassification without double reduction, transition authorization/idempotency, and both request types completing the shared workflow.
- Include a reviewer-facing README covering the Finance problem, three-page solution, role workflow, financial terminology, prototype tradeoffs, setup/test commands, seeded demo roles, and the exact walkthrough; the full PRD remains internal.
- Block request submission when the amount exceeds current availability, recheck and block Finance approval when projected availability is negative, warn inline when projected utilization reaches 80%, and block Payment Confirmation until all required Bank Transfer details and proof metadata are present.

## If Time

- Add `Revision Required` and resubmission. The approval restart policy remains to be decided.
- Show an `Overdue` badge for requests awaiting payment confirmation after their required date.
- Add screenshots to the README.

## Canonical Fixture

- FY2027 company approved budget: Rp500B.
- Technology approved budget: Rp60B, split into Core Systems Rp20B, Infrastructure Rp15B, Digital Products Rp18B, and Contingency Rp7B.
- Ramadan Campaign Project Allocations: Marketing Rp2.5B, Technology Rp800M, Operations Rp1.2B, and Creative Rp500M, totalling Rp5B.
- Technology's Ramadan Project Allocation begins with Rp200M Payment-Confirmed Spend, Rp0 Approved Unpaid Commitments, and Rp600M Available to Commit.
- Submitting the Rp150M microsite request leaves those figures unchanged.
- Finance approval produces Rp150M Approved Unpaid Commitments and Rp450M Available to Commit.
- Payment Confirmation produces Rp350M Payment-Confirmed Spend, Rp0 Approved Unpaid Commitments, and leaves Rp450M Available to Commit.
- Digital Products begins with Rp17.2B Budget Line Unallocated Balance: Rp18B approved less its Rp800M Ramadan Project Allocation. A non-project request consumes this balance only at Finance approval.

## Excluded From the Initial Cut

- Persisted drafts.
- `Payment Processing` as a lifecycle state.
- Virtual Account, Corporate Card, and Other payment-method workflows.
- Persistence of uploaded transfer-proof file contents.
- Editing or deleting a confirmed payment.
- Payment correction and reversal workflows; a production correction would create a separate auditable reversal instead of modifying the original confirmation.
- Project creation, Project Allocation creation, and allocation-change governance.
- Request workstream, expense category, request-stage attachment, reference number, related deliverable, cost breakdown, and notes.
- Browser-level end-to-end test automation.
- A separate alert center, notifications, uneven-utilization analysis, approval-age alerts, and a second 95% utilization threshold.
- Payment-amount mismatch handling; the confirmed amount is locked to the approved amount.
