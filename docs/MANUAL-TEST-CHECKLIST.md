# Budget Execution — Manual Test Checklist

Use this checklist to test the browser prototype manually. Unless a test says otherwise, start from a clean fixture by selecting **Reset Demo Data** and confirming the reset.

## Test setup

1. Run `npm run dev`.
2. Open `http://localhost:4173` in a desktop browser.
3. Use the simulated actor selector in the left rail to change roles.
4. Record the result for each test: `Pass`, `Fail`, or `Blocked`, plus a short note or screenshot.

For the implementation-improvement regression cases, also keep a terminal available so you can inspect the server's loopback URL and request non-public paths manually.

### Viewport matrix

Run the responsive checks at 1440×900, 1280×720, 1024×768, 760×844, and 390×844. At each width, verify that essential content and actions are not clipped; intentional table overflow has a visible cue and a reachable final column.

### Seeded actors

| Actor | Role | Main responsibility |
| --- | --- | --- |
| Alya Pranata | Technology Requester | Creates requests |
| Maya Santoso | Marketing Requester | Creates requests and tests department isolation |
| Raka Wijaya | Technology Line Manager | Confirms business need and reviews Technology allocations |
| Bima Aditya | Marketing Line Manager | Confirms Marketing business need |
| Dewi Lestari | Technology Department Budget Owner | Authorizes Technology funding |
| Ratih Permata | Marketing Department Budget Owner | Authorizes Marketing funding |
| Nina Kurnia | Finance Reviewer | Performs Finance approval |
| Siti Rahma | Finance Payment Processor | Records external payment evidence |
| Fajar Hidayat | Executive Viewer | Read-only review |

### Canonical values

| View or funding source | Expected value |
| --- | ---: |
| FY2027 company Approved Budget | Rp500B |
| Ramadan Campaign total Project Allocation | Rp5B |
| Technology Ramadan Project Allocation | Rp800M |
| Technology opening Payment-confirmed spend | Rp200M |
| Technology opening Available to commit | Rp600M |
| Technology Digital Products Budget Line Unallocated Balance | Rp17.2B |
| Happy-path request amount | Rp150M |
| Happy-path post-Finance Available to commit | Rp450M |
| Happy-path post-payment Approved unpaid commitments | Rp0 |
| Happy-path post-payment Payment-confirmed spend | Rp350M |

### Reusable valid request

- Title: `Microsite development`
- Funding Source: Project Allocation
- Budget Line: `Digital Products`
- Project Allocation: Technology's Ramadan Campaign allocation
- Vendor: `Digital Studio Indonesia`
- Amount: `Rp150M`
- Required date: `2027-02-18`
- Justification: `Build the campaign microsite before launch.`

### Reusable valid payment

- Payment date: `2027-02-18`
- Beneficiary: `Digital Studio Indonesia`
- Destination bank: `Bank Syariah Indonesia`
- Transfer reference: `TRX-20270218-8491`
- Proof: a local PDF, PNG, JPG, or JPEG file no larger than 5 MB

## Smoke and navigation

### MT-001 — Application starts successfully

- [ ] Open the app URL.
- [ ] Confirm the page loads without a blank screen or console-visible fatal error.
- [ ] Confirm the persistent shell shows FY2027 context, navigation, active actor, and **Reset Demo Data**.
- **Expected:** Overview loads as the default page and the main controls are usable.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-002 — Primary navigation works

- [ ] Open **Overview**.
- [ ] Open **Projects**, then select **Ramadan Campaign** from the project list.
- [ ] Confirm the sidebar keeps **Projects** active while the project detail is open.
- [ ] Confirm the breadcrumb reads `Budget Execution / Projects / Ramadan Campaign` and its Projects segment returns to the list.
- [ ] Open **Request Workspace**.
- [ ] Return to each page using the primary navigation.
- **Expected:** Each destination renders the correct page, preserves the app shell, and does not cause a full-page error.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-003 — Overview baseline reporting

- [ ] On Overview, verify the FY2027 company position.
- [ ] Verify the company Approved Budget is `Rp500B`.
- [ ] Verify the company Remaining Budget is `Rp499.8B` and Technology's Remaining Budget is `Rp59.8B`.
- [ ] Verify the department table is present.
- [ ] Locate the Ramadan Campaign entry and its `Rp5B` total allocation.
- **Expected:** Values are readable, consistently formatted as Indonesian rupiah, and match the canonical fixture.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-004 — Project detail baseline reporting

- [ ] Open **Projects**, then select **Ramadan Campaign**.
- [ ] Confirm the project owner, dates, status, and total Project Allocation are shown.
- [ ] Locate Technology's allocation.
- [ ] Verify Technology shows `Rp800M` allocation, `Rp0` Approved unpaid commitments, `Rp200M` Payment-confirmed spend, and `Rp600M` Available to commit.
- [ ] Confirm the department-allocation table and related requests are visible.
- **Expected:** Project and department ownership are clear and the equation reconciles.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

## Request creation and funding-source rules

### MT-005 — Project request can be created from the global action

- [ ] Reset the fixture.
- [ ] Switch to Alya Pranata.
- [ ] Open **New Request** from Overview or Request Workspace.
- [ ] Select the Project Allocation funding-source type.
- [ ] Select Technology's Digital Products / Ramadan Campaign allocation.
- [ ] Complete the reusable valid request and submit it.
- **Expected:** The project, department, approvers, Funding Source, and current Available to commit are derived and displayed. Submission succeeds and status becomes **Awaiting Line Manager Approval**.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-006 — Project detail preselects its Funding Source

- [ ] Reset the fixture and switch to Alya Pranata.
- [ ] Open **Projects**, select Ramadan Campaign, and choose **New Request** there.
- [ ] Inspect the New Request modal before entering other fields.
- **Expected:** The relevant Ramadan Campaign Project Allocation is preselected and its project context is shown.
- [ ] Cancel the modal without submitting.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-007 — Non-project request path works

- [ ] Reset the fixture and switch to Alya Pranata.
- [ ] Open **New Request** and select **Budget Line Unallocated Balance**.
- [ ] Select the Technology `Digital Products` Budget Line.
- [ ] Verify the displayed starting balance is `Rp17.2B`.
- [ ] Confirm no project is displayed or required.
- [ ] Enter a valid non-project request for `Rp100M` and submit.
- **Expected:** The request is accepted, has no project, and enters **Awaiting Line Manager Approval** without changing the financial balance at submission.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-008 — Request form validates required fields

- [ ] Reset the fixture, switch to Alya Pranata, and open **New Request**.
- [ ] Try to submit with each required field empty: title, Budget Line/Funding Source, vendor, amount, required date, and justification.
- **Expected:** Submission is blocked and each missing field receives a clear, field-associated validation message. No request is created.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-009 — Request amount must be positive and available

- [ ] Reset the fixture and open a Project Allocation request as Alya.
- [ ] Try amount `0`, then a negative amount if the control permits it.
- [ ] Try an amount above the Technology allocation's `Rp600M` Available to commit, such as `Rp601M`.
- **Expected:** Each invalid amount is rejected. No request is submitted and the available balance remains unchanged.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-010 — Funding Source relationships cannot be mixed

- [ ] Reset the fixture and switch between project and non-project funding types.
- [ ] Try to select unrelated department, Budget Line, project, and allocation combinations if the UI exposes them.
- [ ] Try to submit a non-project request while a Project Allocation is selected, if possible.
- **Expected:** Incompatible choices are unavailable or submission is blocked with a clear error. A request cannot reference unrelated records or a project on a non-project request.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-011 — Submission does not reserve budget

- [ ] Reset the fixture and record Technology's baseline `Rp600M` Available to commit.
- [ ] Submit the reusable valid `Rp150M` request as Alya.
- [ ] Recheck Request Workspace, Project Detail, and Overview.
- **Expected:** The new request is visible, but Approved unpaid commitments, Payment-confirmed spend, and Available to commit remain at their baseline values. Only Finance approval creates a commitment.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

## Authorization and approval workflow

### MT-012 — Requester cannot self-approve

- [ ] Reset the fixture and submit the reusable valid request as Alya.
- [ ] Keep Alya selected and inspect the request action area.
- [ ] If an approval action is visible or reachable, try to use it.
- **Expected:** Alya cannot approve or reject the request at the Line Manager stage; the action is unavailable or the operation is rejected.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-013 — Only the active Line Manager can approve first

- [ ] With a submitted request at **Awaiting Line Manager Approval**, switch to each non-manager role and inspect the request.
- [ ] Switch to Raka Wijaya and approve it.
- **Expected:** Only Raka can perform the first approval. The request advances to **Awaiting Budget Owner Approval** and the approval is recorded once.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-014 — Only the Funding Source Budget Owner can approve second

- [ ] Continue from MT-013 or recreate the submitted request and complete the first approval.
- [ ] Inspect the request as Alya, Raka, Nina, Siti, and Fajar.
- [ ] Switch to Dewi Lestari and approve.
- **Expected:** Only Dewi can approve the Technology Funding Source at this stage. The request advances to **Awaiting Finance Approval**. This approval does not change financial totals.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-015 — Finance impact preview is accurate

- [ ] Continue with the request at **Awaiting Finance Approval**.
- [ ] Switch to Nina Kurnia and open the approval action.
- [ ] Verify the preview shows current Available to commit `Rp600M`, request amount `Rp150M`, and projected Available to commit `Rp450M`.
- [ ] Verify the preview distinguishes Approved unpaid commitments from Payment-confirmed spend.
- [ ] Cancel the modal.
- **Expected:** The preview is accurate and cancellation makes no state change.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-016 — Only Finance creates the commitment

- [ ] Reopen the Finance approval modal as Nina.
- [ ] Confirm the Finance approval.
- **Expected:** Status becomes **Approved — Awaiting Payment Confirmation**; approved amount is `Rp150M`; Approved unpaid commitments increase to `Rp150M`; Available to commit becomes `Rp450M`; Payment-confirmed spend remains `Rp200M`.
- [ ] Verify the same values in Request Workspace, Projects → Ramadan Campaign, and Overview.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-017 — Approval is blocked when the fresh Finance projection is negative

- [ ] Create or use a request that is initially within availability.
- [ ] Before Finance approval, cause the same Funding Source to have less available capacity if the UI allows a second workflow, or use the seeded/domain scenario that makes the projection negative.
- [ ] Open Finance approval and confirm the action.
- **Expected:** Finance approval is blocked when projected Available to commit is negative; no approved amount, commitment, status, or history event is created.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-018 — Rejection requires a reason and is terminal

- [ ] Reset the fixture and submit a valid request as Alya.
- [ ] As Raka, open **Reject request** and submit an empty or whitespace-only reason.
- **Expected:** Rejection is blocked with a required-reason message.
- [ ] Enter `Campaign scope needs revision.` and reject.
- [ ] Verify status becomes **Rejected**, the reason appears in Activity History, and financial totals are unchanged.
- [ ] Try to approve or reject the same request again.
- **Expected:** No further state transition is allowed.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

## Payment confirmation

### MT-019 — Payment action is restricted to the Payment Processor

- [ ] Complete the happy-path approvals through Finance approval.
- [ ] Inspect the request as Alya, Raka, Dewi, Nina, and Fajar.
- [ ] Switch to Siti Rahma and open **Awaiting Payment Confirmation**.
- **Expected:** Only Siti can use **Record Payment**. Other roles see no usable payment-confirmation action. Siti sees the approved request in the payment queue.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-020 — Payment modal locks the approved amount

- [ ] As Siti, open **Record Payment** for the approved `Rp150M` request.
- [ ] Inspect the payment summary and form controls.
- **Expected:** The approved amount is visibly `Rp150M` and read-only. The modal explains that the transfer happened outside the product and that Available to commit will remain unchanged.
- [ ] Cancel the modal and confirm no state changed.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-021 — Payment details are required

- [ ] Open **Record Payment** as Siti.
- [ ] Submit with payment date, beneficiary, destination bank, transfer reference, and proof omitted one at a time.
- **Expected:** Confirmation is blocked and each missing field shows a clear validation message. No payment record is created.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-022 — Transfer-proof type and size validation

- [ ] In the payment modal, select a valid PDF, PNG, JPG, and JPEG file up to 5 MB, one at a time.
- [ ] Verify each selected file displays filename, MIME type, and size.
- [ ] Try an unsupported file such as `.exe` or `.txt`.
- [ ] Try a file larger than 5 MB.
- **Expected:** Valid types and sizes are accepted. Unsupported or oversized files are rejected immediately with guidance. File contents are not previewed or downloadable.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-023 — Proof can be removed or replaced before confirmation

- [ ] Select a valid proof file.
- [ ] Use **Remove** and verify the metadata disappears and confirmation is blocked until another proof is selected.
- [ ] Select a different valid proof file.
- **Expected:** The new filename, type, and size replace the old metadata before confirmation.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-024 — Payment confirmation reclassifies without double reduction

- [ ] Complete the reusable valid payment as Siti.
- **Expected:** Status becomes **Payment Confirmed** and exactly one payment record is shown.
- [ ] Verify Approved unpaid commitments change from `Rp150M` to `Rp0`.
- [ ] Verify Payment-confirmed spend changes from `Rp200M` to `Rp350M`.
- [ ] On Overview, verify Remaining Budget changes from company `Rp499.8B` to `Rp499.65B` and Technology `Rp59.8B` to `Rp59.65B`.
- [ ] Verify Available to commit remains `Rp450M`.
- [ ] Confirm these values in Request Workspace, Projects → Ramadan Campaign, and Overview.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-025 — Confirmed payment is read-only and cannot be duplicated

- [ ] After MT-024, inspect the payment details as Siti and another role.
- [ ] Verify payment date, amount, beneficiary, bank, reference, processor, and proof metadata are displayed.
- [ ] Try to edit, delete, correct, reverse, or confirm the payment again.
- **Expected:** Confirmed payment details are read-only; no duplicate Payment Record or second reclassification can be created.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

## Reporting, history, persistence, and recovery

### MT-026 — Activity History is complete and immutable

- [ ] Run the happy path from submission through payment confirmation.
- [ ] Inspect Activity History on the request.
- **Expected:** The history contains exactly one meaningful event for submission, Line Manager approval, Budget Owner approval, Finance approval, and Payment Confirmation, in chronological order.
- [ ] Verify every event has actor, role, timestamp, and resulting status. Verify the payment event includes amount, bank, transfer reference, and proof metadata.
- [ ] Verify the rejection path records its required reason.
- **Expected:** There is no duplicate generic `Status Changed` event, and existing events cannot be edited.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-027 — Reporting views reconcile and do not double count

- [ ] After Finance approval, compare the `Rp150M` commitment in Request Workspace, Project Detail, and Overview.
- [ ] After Payment Confirmation, compare the `Rp350M` Payment-confirmed spend and `Rp450M` Available to commit in all three views.
- [ ] Check that the project allocation does not reduce Department Unallocated Budget a second time.
- **Expected:** All views derive the same transaction once and reconcile to the canonical figures.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-028 — Refresh preserves structured state

- [ ] Submit or complete part of the happy path.
- [ ] Refresh the browser tab.
- [ ] Navigate away and back to Request Workspace, Project Detail, and Overview.
- **Expected:** The active workflow state, requests, approvals, payment records, financial totals, and Activity History remain intact.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-029 — Reset restores the canonical fixture

- [ ] Mutate the app by submitting a request, approving it, or confirming payment.
- [ ] Select **Reset Demo Data**.
- [ ] Confirm the browser confirmation prompt.
- **Expected:** The app returns to the canonical fixture: Technology allocation `Rp800M`, Approved unpaid commitments `Rp0`, Payment-confirmed spend `Rp200M`, Available to commit `Rp600M`, and no test-created request or payment.
- [ ] Cancel the reset prompt in a second attempt.
- **Expected:** Canceling the prompt preserves the current state.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

## Responsive and usability smoke checks

### MT-030a — Dialog, overflow, and workspace viewport matrix

- [ ] At each viewport in the matrix, open New Request and verify the header, close control, form body, Cancel action, and Submit Request action remain reachable.
- [ ] At 390×844, verify the dialog has one vertical scrollbar, the document behind it does not scroll, and the footer remains above the safe-area inset.
- [ ] At 1024×768, verify Request Workspace stacks before the detail pane clips its four financial values; at 1280×720 and 1440×900 verify the split view has no permanent tab/status horizontal scrollbar.
- [ ] On Overview and Project Detail, scroll each intentional table overflow surface and verify the sticky Department column, cue, and final financial/action column.
- **Expected:** Every target viewport preserves essential content, action reachability, visible focus, and the established financial terminology.
- Result: `â˜ Pass  â˜ Fail  â˜ Blocked`  Notes: ____________________

### MT-030 — Narrow viewport remains usable

- [ ] Open browser responsive mode at approximately 760 px wide and then at a phone-sized width.
- [ ] Check navigation, role switcher, Overview, Project Detail, Request Workspace, New Request, approval, rejection, and payment modals.
- **Expected:** Content remains readable, controls remain reachable, dialogs do not hide required actions, and horizontal overflow does not prevent completing the core workflow.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-031 — Keyboard and visible-state smoke check

- [ ] Use Tab/Shift+Tab to move through navigation, forms, modal controls, and action buttons.
- [ ] Use Enter/Space to activate focused buttons and Escape or the close control to dismiss a modal where supported.
- [ ] Check that status labels and warnings are communicated by text, not color alone.
- **Expected:** Focus order is understandable, focused controls are visible, modal actions are reachable, and validation/status information is readable without relying only on color.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

## Implementation-improvement regression checks

### MT-032 — Finance approval is visible in the role-owned queue

- [ ] Reset the fixture and submit the reusable valid `Rp150M` request as Alya.
- [ ] Approve it as Raka, then Dewi.
- [ ] Switch to Nina Kurnia and open Request Workspace.
- **Expected:** **My Approvals** contains the request with count `1`; the detail shows an actionable **Approve Finance commitment** and **Reject request** action. Nina can open the Finance impact preview and complete the approval.
- [ ] Switch to a non-Finance role and verify the Finance approval action is not available.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-033 — Role-owned visibility and queue counts are consistent

- [ ] Create a request as Alya and leave it at **Awaiting Line Manager Approval**.
- [ ] Check the request and queue counts as Alya, Raka, Dewi, Nina, Siti, and Fajar.
- **Expected:** Alya sees her request; Raka sees the direct-report request and its approval; Dewi sees requests charged to her Funding Source; Nina and Fajar see all requests; Siti sees only requests awaiting or completed for payment confirmation. **My Approvals** counts only actions the current actor can perform.
- [ ] Confirm that a visible request without an assigned action remains read-only for that actor.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-034 — Project allocation selection drives related request context

- [ ] Reset the fixture, open **Projects**, and select **Ramadan Campaign**.
- [ ] Select Technology's allocation row.
- **Expected:** The row has a clear selected state and its related request context is emphasized or filtered.
- [ ] Use the allocation's request action, if shown.
- **Expected:** New Request opens with that Project Allocation preselected and the correct project, Budget Line, department, and available amount displayed.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-035 — Requested amount validation is immediate and field-linked

- [ ] As Alya, open a Project Allocation request and enter an amount above the current Available to commit.
- **Expected:** The amount field shows an immediate error that includes the current available amount and maximum valid amount; the form cannot be submitted.
- [ ] Change the amount to a valid value.
- **Expected:** The amount error clears immediately and the derived availability remains visible.
- [ ] Repeat with `0` and a negative value where the control allows it.
- **Expected:** Each invalid value is rejected with a message attached to the amount field rather than only a generic form error.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-036 — Transfer-proof validation happens on file selection

- [ ] Complete approvals through **Approved — Awaiting Payment Confirmation** and open **Record Payment** as Siti.
- [ ] Select an unsupported file type and then a file larger than 5 MB.
- **Expected:** Each invalid file is rejected immediately when selected; the proof metadata is not retained and the proof control remains the validation target.
- [ ] Select valid PDF, PNG, JPG, and JPEG files, including a file exactly 5 MB in size if available.
- **Expected:** Matching accepted type/extension files up to and including 5 MB are retained with filename, MIME type, and size displayed.
- [ ] If the browser/test fixture can provide conflicting metadata, try a PDF filename with an image MIME type and an image filename with a PDF MIME type.
- **Expected:** A provided MIME type must match the accepted extension; a conflicting pair is rejected.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-037 — Activity History includes resulting status and full evidence

- [ ] Complete the happy path through Finance approval and Payment Confirmation.
- [ ] Inspect every event in Activity History.
- **Expected:** Each event shows actor, role, timestamp, and resulting request status. Finance approval shows the approved amount where applicable.
- [ ] Inspect Payment Confirmation evidence.
- **Expected:** The event shows amount, bank, transfer reference, proof filename, proof MIME type, and proof size. No duplicate generic status-only event is present.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-038 — Server exposes only public application assets

- [ ] With the development server running, open these URLs in the browser:
  - `http://127.0.0.1:4173/`
  - `http://127.0.0.1:4173/src/main.js`
  - `http://127.0.0.1:4173/src/domain/store.js`
  - `http://127.0.0.1:4173/src/styles.css`
- **Expected:** The application entry point and public source assets load successfully.
- [ ] Try `http://127.0.0.1:4173/PRD.md`, `/README.md`, `/package.json`, `/.git/HEAD`, an unknown file, and encoded traversal such as `/%2e%2e/PRD.md`.
- **Expected:** Non-public, unknown, and traversal paths return **404 Not Found** and do not reveal repository contents.
- [ ] Confirm the server is advertised/listening on `127.0.0.1`, not a wildcard LAN address.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-039 — Modal interaction and focus management work by mouse and keyboard

- [ ] Open **New Request** and click into every text field, select, and textarea.
- **Expected:** The modal remains open and each clicked control can receive input.
- [ ] Open Reject and Payment modals and repeat the field-entry check.
- [ ] Press `Escape` inside a modal.
- **Expected:** Escape closes the modal without saving and focus returns to the control that opened it.
- [ ] Reopen a modal and Tab repeatedly through its controls.
- **Expected:** Focus stays within the modal until it is closed; the page behind the modal cannot be reached by keyboard while the modal is open.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-040 — Request rows and tabs are keyboard accessible

- [ ] In Request Workspace, focus a selectable request row using Tab.
- [ ] Activate it with Enter and Space.
- **Expected:** The selected request opens without requiring a mouse, and the row has a visible focus indicator.
- [ ] Focus each workspace tab and use the keyboard to activate it.
- **Expected:** The active tab is announced/visibly identified as selected, its request list is associated with the tab, and switching tabs preserves the selected request when it remains visible.
- [ ] Check the role selector, modal close button, upload button, and primary actions at a narrow viewport.
- **Expected:** Interactive targets are large enough to activate reliably, approximately 44 px where applicable.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-041 — Finance and payment transitions communicate the financial change

- [ ] Approve the `Rp150M` request as Nina.
- **Expected:** The UI communicates the transition from `Rp600M` current availability to `Rp450M` projected availability and from no commitment to a `Rp150M` Approved unpaid commitment.
- [ ] Confirm payment as Siti.
- **Expected:** The UI communicates the reclassification from `Rp150M` Approved unpaid commitments to `Rp0` and from `Rp200M` to `Rp350M` Payment-confirmed spend, while Available to commit stays `Rp450M`.
- [ ] Enable the browser/OS `prefers-reduced-motion` setting and repeat the transitions.
- **Expected:** The explanatory text and final state remain available; motion is reduced or removed.
- Result: `☐ Pass  ☐ Fail  ☐ Blocked`  Notes: ____________________

### MT-042 - Overview and navigation are role-scoped

- [ ] Reset the fixture as Nina and confirm company Overview shows the full company and department position.
- [ ] Switch to Maya Santoso.
- **Expected:** Maya lands in Request Workspace; Overview is absent from navigation and company totals are not rendered.
- [ ] Switch to Ratih Permata.
- **Expected:** Ratih sees a Department Overview containing Marketing only, not the company or Technology totals.
- [ ] Switch to Siti Rahma.
- **Expected:** Siti lands in the payment queue and has no Overview or Projects navigation.
- Result: `Pass / Fail / Blocked`  Notes: ____________________

### MT-043 - Requester isolation across departments

- [ ] As Maya, submit a valid non-project request against Marketing's `Brand Campaigns` Budget Line and leave it pending.
- [ ] Switch to Alya.
- **Expected:** Alya sees the Technology request only; Maya's Marketing request is absent from All Requests, My Approvals, project detail, and selected-request detail.
- [ ] Switch back to Maya.
- **Expected:** Maya sees her Marketing request and no Technology request.
- [ ] Switch to Nina or Fajar.
- **Expected:** The company-wide role can see both requests.
- Result: `Pass / Fail / Blocked`  Notes: ____________________

### MT-044 - Line Manager sees department allocations without cross-department requests

- [ ] Switch to Raka Wijaya and open Projects -> Ramadan Campaign.
- **Expected:** Raka sees Technology's `Rp800M` allocation and not Marketing's, Operations', or Creative's allocations.
- [ ] Check the related requests section.
- **Expected:** Raka sees only requests from direct reports, not every request in Technology and none from Marketing.
- Result: `Pass / Fail / Blocked`  Notes: ____________________

## Out-of-scope behavior to avoid filing as a defect

- The prototype does not execute real bank transfers or integrate with a bank/ERP.
- Transfer-proof file contents are intentionally not persisted; only filename, MIME type, and size are retained.
- Confirmed payments cannot be edited, deleted, corrected, or reversed.
- Partial payments, failed transfers, payment batches, notifications, authentication, and persisted request drafts are not implemented.
