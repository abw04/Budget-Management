# Budget Execution

This context describes how approved departmental budgets fund cross-functional projects, become committed through approvals, and are reported after external payment confirmation. It deliberately does not model accounting recognition or general-ledger entries.

## Language

**Funding Source**:
The controlled budget authority against which an expense request is made. It is either a Project Allocation or Budget Line Unallocated Balance.
_Avoid_: Funding Allocation, budget source

**Project Allocation**:
A funding allocation reserved for a specific project.
_Avoid_: Project budget

**Budget Line Unallocated Balance**:
The portion of a budget line that is neither reserved by Project Allocations nor consumed by non-project commitments or payment-confirmed spend. It is the Funding Source for requests that have no project.
_Avoid_: Operational Allocation, available budget

**Department Unallocated Budget**:
The reporting total obtained by summing the department's Budget Line Unallocated Balances. It is not selected directly as an expense request's Funding Source.
_Avoid_: Department available budget

**Approved unpaid commitment**:
An approved expense request that consumes part of a Funding Source but has not been confirmed as paid.
_Avoid_: Committed amount, awaiting-payment amount

**Payment-confirmed spend**:
An approved amount that Finance has confirmed was paid through an external payment system. It is a budget-control classification, not a general-ledger-recognized expense.
_Avoid_: Actual expense, actual spending, paid expense

**Available to commit**:
The portion of a Funding Source that remains available for new commitments.
_Avoid_: Available budget

**Finance Reviewer**:
The Finance team member responsible for final financial-control approval after verifying prior authorization, sufficient Funding Source balance, classification, and supporting information.
_Avoid_: Finance user, Finance Payment Processor

**Finance Payment Processor**:
The Finance team member responsible for recording evidence that an approved request was paid through an external payment system.
_Avoid_: Finance Reviewer, payment approver

**Line Manager approval**:
The first approval of an expense request, performed by the manager one reporting level above the requester to confirm the request's business need.
_Avoid_: Manager approval

**Department Budget Owner approval**:
The approval that authorizes an expense request to consume the charged department Funding Source.
_Avoid_: Department Manager approval, budget approval

**Finance approval**:
The final financial-control decision that verifies prior authorization, sufficient Funding Source balance, and acceptable classification. It creates an approved unpaid commitment but does not execute or confirm payment.
_Avoid_: Payment approval, final approval

**Payment confirmation**:
A Finance-recorded confirmation that an approved expense request was paid outside the product. It reclassifies an approved unpaid commitment as payment-confirmed spend.
_Avoid_: Payment execution, payment processing

**Payment Confirmed**:
The terminal request status indicating that a Finance Payment Processor recorded evidence of external payment.
_Avoid_: Paid

**Activity History**:
The immutable chronological record of meaningful business actions and decisions for one expense request.
_Avoid_: Audit timeline, status history
