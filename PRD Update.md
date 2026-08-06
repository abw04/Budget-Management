# PRD Update: Payment Status and Transfer Proof

## Updated Product Scope

The prototype will cover the budget execution lifecycle from approved annual budget through expense payment confirmation:

```text
Approved Annual Budget
→ Department Budget
→ Project Allocation
→ Expense Request
→ Approval
→ Payment Confirmation
```

Payment execution itself occurs outside the application through the company’s banking or payment system.

The application records payment completion using payment details and uploaded transfer proof.

---

## Updated Financial Lifecycle

### Before approval

An expense request has no financial impact on the available budget.

### After final approval

The approved request becomes a **commitment**.

```text
Available Budget
= Allocation
− Actual Spending
− Approved but Unpaid Commitments
```

### After payment confirmation

The payment amount moves from commitment to actual spending.

Example:

Before payment:

* Project allocation: Rp800M
* Actual spending: Rp200M
* Approved but unpaid commitments: Rp150M
* Available budget: Rp450M

After the Rp150M payment is confirmed:

* Project allocation: Rp800M
* Actual spending: Rp350M
* Approved but unpaid commitments: Rp0
* Available budget: Rp450M

Payment confirmation changes the classification of the amount but does not reduce the available budget for a second time.

---

## Updated Request Statuses

The prototype will use the following statuses:

* Draft
* Awaiting Manager Approval
* Awaiting Finance Review
* Revision Required
* Rejected
* Approved — Awaiting Payment
* Payment Processing
* Paid

Primary workflow:

```text
Draft
→ Awaiting Manager Approval
→ Awaiting Finance Review
→ Approved — Awaiting Payment
→ Payment Processing
→ Paid
```

For a simpler implementation, `Payment Processing` may be omitted:

```text
Approved — Awaiting Payment
→ Paid
```

---

## Payment Status Definitions

### Approved — Awaiting Payment

The request has received all required approvals and is recorded as a commitment.

Finance has not yet confirmed that payment has been completed.

### Payment Processing

Finance has begun processing the payment outside the application.

This status is optional for the prototype.

### Paid

Finance has confirmed that payment was completed and uploaded transfer proof.

The amount is recorded as actual spending rather than an unpaid commitment.

---

## Finance Payment Confirmation

Finance users must be able to record payment for a fully approved expense request.

### Preconditions

The payment action is available only when:

* the request has received Manager approval;
* the request has received Finance approval;
* the request status is `Approved — Awaiting Payment`;
* the current user is acting as Finance.

### Required fields

Finance must enter:

* payment date;
* paid amount;
* payment method;
* recipient or beneficiary name;
* destination bank or payment channel;
* transfer reference number;
* transfer-proof attachment.

### Optional fields

Finance may enter:

* bank-account suffix;
* payment notes;
* internal voucher number.

To avoid exposing sensitive information in the prototype, the full bank-account number is not required.

Example:

> Account ending in 4821

### Supported payment methods

For the prototype:

* Bank Transfer
* Virtual Account
* Corporate Card
* Other

Bank Transfer should be used in the main demo scenario.

---

## Payment Validation Rules

The system must:

1. allow payment confirmation only for fully approved requests;

2. require transfer proof before marking a bank transfer as paid;

3. prevent a paid amount of zero or less;

4. prevent the paid amount from exceeding the approved amount;

5. warn when the paid amount differs from the approved amount;

6. require a Finance comment when the paid amount differs from the approved amount;

7. prevent the same request from being marked as paid twice;

8. record the user and timestamp of the payment confirmation.

For the one-day prototype, partial payment is out of scope.

Therefore:

```text
Paid Amount = Approved Amount
```

A mismatched amount should produce a warning and block completion.

---

## Transfer-Proof Upload

The transfer-proof field represents evidence that Finance completed the payment outside the system.

### Prototype behavior

The prototype does not need real file storage.

The upload component may:

* accept a local file;
* display its filename;
* display file type and size;
* show a mock upload-success state;
* provide a preview placeholder;
* allow the user to remove or replace the file before submission.

### Supported mock formats

* PDF
* PNG
* JPG or JPEG

### Example attachment

> transfer-proof-RMD-2027-0042.pdf

---

## Updated Approval Detail Screen

After final approval, the request-detail page should display a **Payment Information** section.

### Before payment

Display:

* payment status: Awaiting Payment;
* approved amount;
* recipient;
* requested payment date;
* button: `Record Payment`.

### After payment

Display:

* payment status: Paid;
* payment date;
* paid amount;
* payment method;
* beneficiary;
* destination bank;
* transfer reference;
* transfer-proof filename;
* Finance processor;
* processing timestamp.

The page should include an action to view the transfer-proof placeholder.

---

## Record Payment Modal or Page

Finance selects `Record Payment` from an approved request.

The interface should contain:

### Request summary

* request ID;
* request title;
* project;
* department;
* approved amount;
* recipient or vendor;
* required date.

### Payment form

* payment date;
* paid amount;
* payment method;
* beneficiary name;
* destination bank;
* transfer reference;
* transfer-proof upload;
* notes.

### Confirmation summary

Before submission, display:

> This action will mark the request as paid and move Rp150M from committed funds to actual spending.

### Actions

* Cancel
* Confirm Payment

After confirmation:

* request status becomes `Paid`;
* commitment decreases by the paid amount;
* actual spending increases by the paid amount;
* project dashboard updates;
* department dashboard updates;
* payment activity is added to the audit history.

---

## Updated Functional Requirement: Payment Management

### Payment Queue

Finance should be able to see approved requests awaiting payment.

Required columns:

* request ID;
* request title;
* project;
* department;
* recipient;
* approved amount;
* required date;
* days awaiting payment;
* payment status.

Finance can:

* open a request;
* filter by project;
* filter by department;
* filter by required date;
* record payment.

For the prototype, this can be implemented as an `Awaiting Payment` tab within the Approvals or Requests page rather than as a separate module.

---

## Updated Requests List

Add the following columns or information:

* approval status;
* payment status;
* payment date;
* paid amount.

Suggested combined statuses:

| Request status              | Meaning                                           |
| --------------------------- | ------------------------------------------------- |
| Awaiting Manager Approval   | Business approval is pending                      |
| Awaiting Finance Review     | Finance validation is pending                     |
| Approved — Awaiting Payment | Fully approved and recorded as a commitment       |
| Paid                        | Payment confirmed and recorded as actual spending |
| Rejected                    | Request will not proceed                          |
| Revision Required           | Request must be edited and resubmitted            |

Avoid creating separate approval and payment status models in the visible interface for the prototype. One combined request status is simpler for users and faster to build.

---

## Updated Activity and Audit History

The activity history should support the following payment events:

* payment processing started;
* transfer proof uploaded;
* payment confirmed;
* payment status changed;
* payment details edited.

Example:

```text
18 February 2027, 14:32
Payment confirmed by Siti Rahma — Finance

Amount: Rp150M
Method: Bank Transfer
Reference: TRX-20270218-8491
Attachment: transfer-proof-RMD-2027-0042.pdf
```

For the prototype, payment details should become read-only after confirmation.

---

## Updated Dashboard Metrics

### Annual and department dashboards

Add:

* approved but unpaid commitments;
* actual paid expenses;
* requests awaiting payment;
* overdue payments.

### Project dashboard

Add:

* committed amount;
* paid amount;
* awaiting-payment amount;
* available budget.

Example:

| Metric                    | Amount |
| ------------------------- | -----: |
| Project allocation        |   Rp5B |
| Paid expenses             | Rp2.1B |
| Approved awaiting payment | Rp700M |
| Available budget          | Rp2.2B |

---

## Updated Alerts

The prototype may display:

* five approved requests are awaiting payment;
* two payments have passed their required date;
* transfer proof is missing;
* payment amount does not match the approved amount.

Example:

> Microsite Development has been approved but remains unpaid three days after its required date.

---

## Updated Data Model

### ExpenseRequest

Add or retain:

* approvedAmount
* requiredDate
* status
* approvedAt
* paidAt

### PaymentRecord

Fields:

* id
* expenseRequestId
* paymentDate
* paidAmount
* paymentMethod
* beneficiaryName
* destinationBank
* bankAccountSuffix
* transferReference
* transferProofFileName
* transferProofUrl
* notes
* processedBy
* createdAt

For the mock prototype, `transferProofUrl` may contain a placeholder or local preview value.

Each expense request may have no more than one PaymentRecord.

---

## Updated Business Rules

1. Only fully approved requests can proceed to payment.

2. Final approval creates a commitment.

3. Payment confirmation converts the commitment into actual spending.

4. Payment confirmation must not reduce the available budget twice.

5. Only Finance can record payment.

6. Transfer proof is mandatory for bank-transfer payments.

7. The paid amount must equal the approved amount in the prototype.

8. A request may only be paid once.

9. Paid requests cannot be edited.

10. Payment confirmation must appear in the audit history.

11. The same paid amount must appear consistently in the project, department, and annual-budget views.

---

## Updated Acceptance Criteria

### Payment queue

* Finance can view fully approved requests awaiting payment.
* Finance can open one request and select `Record Payment`.

### Payment recording

* Finance can enter payment details.
* Finance can upload a mock transfer-proof file.
* The system prevents submission without mandatory information.
* The system displays a confirmation message before finalizing payment.
* Finance can mark the request as paid.

### Financial effect

* Before payment, the approved request appears as a commitment.
* After payment, the commitment decreases by the paid amount.
* Actual spending increases by the same amount.
* Available budget does not decrease again.
* Updated numbers appear in both project and department views.

### Auditability

* Payment confirmation records the Finance user.
* Payment confirmation records a timestamp.
* Payment details and transfer-proof filename are visible.
* The payment event appears in the request activity history.

---

## Updated Demo Scenario

1. Open the FY2027 annual budget dashboard.

2. Open the Technology department budget.

3. Open Technology’s Rp800M Ramadan Campaign allocation.

4. Submit a Rp150M request for microsite development.

5. Approve the request as Department Manager.

6. Approve the request as Finance Reviewer.

7. Show that the Rp150M is now categorized as:

   * approved;
   * awaiting payment;
   * committed.

8. Open the Finance payment queue.

9. Select the microsite request.

10. Enter:

    * Payment date: 18 February 2027
    * Paid amount: Rp150M
    * Method: Bank Transfer
    * Beneficiary: Digital Studio Indonesia
    * Destination bank: Bank Syariah Indonesia
    * Transfer reference: TRX-20270218-8491

11. Upload:

    * transfer-proof-RMD-2027-0042.pdf

12. Confirm payment.

13. Show that:

    * the request status becomes `Paid`;
    * the Rp150M commitment is removed;
    * actual project spending increases by Rp150M;
    * Technology actual spending also increases by Rp150M;
    * available budget is not reduced for a second time;
    * the transfer proof appears in the audit timeline.

---

## Updated One-Day Scope

### Must build

* final approval changes request to `Approved — Awaiting Payment`;
* Finance payment queue or filter;
* payment-confirmation form;
* mock transfer-proof upload;
* payment status;
* commitment-to-actual update;
* payment audit entry.

### Can be visually mocked

* real bank transfer;
* file storage;
* attachment download;
* bank-account validation;
* ERP posting;
* notification delivery.

### Remains out of scope

* partial payments;
* payment batches;
* payment cancellation;
* payment reversal;
* failed transfer handling;
* multiple transfer proofs;
* payment authorization matrix;
* bank API integration;
* invoice matching;
* tax withholding;
* accounting journals;
* reconciliation with bank statements.
