# Budget Execution

Budget Execution is a presentation-ready prototype for Finance teams controlling company money from approved budget through external payment confirmation. It keeps the Funding Source, responsible actor, current status, and financial classification visible as one chain of custody.

## Run it

This repository has no external runtime dependencies. Use the bundled Node runtime or Node 20+:

```text
npm run dev
```

Then open `http://localhost:4173`. The domain test suite runs with:

```text
npm test
npm run build
```

## Product structure

- **Overview** shows the FY2027 company and department position, including Approved Budget, Allocated to Projects, Department Unallocated Budget, Approved unpaid commitments, and Payment-confirmed spend.
- **Ramadan Campaign** shows the `Rp5B` cross-department Project Allocation and the derived position for each department Funding Source.
- **Request Workspace** combines All Requests, My Approvals, Awaiting Payment Confirmation, request facts, role-authorized actions, Finance impact preview, Payment Information, and Activity History.

## Roles and segregation of duties

Use the persistent simulated actor control in the left rail. The seeded roles are Alya Pranata (Technology Requester), Raka Wijaya (Line Manager), Dewi Lestari (Department Budget Owner), Nina Kurnia (Finance Reviewer), Siti Rahma (Finance Payment Processor), and Fajar Hidayat (Executive Viewer).

The Requester submits. The Line Manager confirms business need. The Department Budget Owner authorizes the selected Funding Source. The Finance Reviewer performs the final availability check and creates an Approved unpaid commitment. The Finance Payment Processor records evidence of an external Bank Transfer. The Finance Reviewer and Payment Processor are separate actors; Executive Viewer is read-only.

## Financial language

- **Funding Source** is either a Project Allocation or a Budget Line Unallocated Balance.
- **Department Unallocated Budget** is a derived reporting total and cannot be selected on a request.
- **Approved unpaid commitment** is an approved request not yet confirmed paid.
- **Payment-confirmed spend** is an approved amount that Finance has confirmed was paid outside the product.
- **Available to commit** is the Funding Source amount less Approved unpaid commitments and Payment-confirmed spend.

Pending requests do not reserve budget. Payment Confirmation reclassifies an existing commitment; it does not reduce Available to commit a second time. Uploaded transfer-proof contents are not persisted—only filename, MIME type, and size are retained.

## Canonical walkthrough

1. Open Overview and show the FY2027 `Rp500B` Approved Budget.
2. Open Ramadan Campaign and locate Technology's `Rp800M` Project Allocation, `Rp200M` Payment-confirmed spend, and `Rp600M` Available to commit.
3. Switch to Alya Pranata and create the project-backed `Rp150M` microsite request. Submission leaves the financial figures unchanged.
4. Switch to Raka Wijaya and approve, then Dewi Lestari and approve.
5. Switch to Nina Kurnia. Inspect the Finance impact preview (`Rp600M` current, `Rp150M` request, `Rp450M` projected) and approve.
6. Switch to Siti Rahma. Open Awaiting Payment Confirmation, record the Bank Transfer details, select a PDF/PNG/JPG/JPEG proof up to 5 MB, and confirm.
7. Verify `Payment Confirmed`, `Rp0` Approved unpaid commitments, `Rp350M` Payment-confirmed spend, and unchanged `Rp450M` Available to commit in Request Workspace, Ramadan Campaign, and Overview.
8. Inspect the complete Activity History, then briefly open New Request and switch Funding Source to Budget Line Unallocated Balance to see the functional non-project path.

Reset Demo Data restores this exact seeded fixture after submissions, approvals, rejections, or payment confirmation.

## Prototype boundaries

The browser store is intentionally local and simulated. There is no real authentication, bank integration, ERP posting, file storage, notification delivery, payment execution, partial payment, payment correction/reversal, or editing after submission/confirmation. Revision and resubmission, overdue badges, and Project Allocation governance are future enterprise extensions rather than hidden features of this prototype.
