import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APPROVED_UNPAID,
  PAYMENT_CONFIRMED,
  STATUS,
  FUNDING_SOURCE,
  createInitialState,
  assertAllocationInvariant,
  deriveFundingSourceMetrics,
  createRequest,
  approveRequest,
  confirmPayment,
  rejectRequest,
  getVisibleRequests,
} from '../src/domain/store.js';

const requestInput = {
  title: 'Microsite development',
  fundingSourceType: 'PROJECT_ALLOCATION',
  projectAllocationId: 'allocation-technology-ramadan',
  budgetLineId: 'budget-line-digital-products',
  vendorName: 'Digital Studio Indonesia',
  requestedAmount: 150_000_000,
  requiredDate: '2027-02-18',
  justification: 'Build the campaign microsite before launch.',
};

test('opening Technology project allocation derives the canonical values', () => {
  const state = createInitialState();
  assert.deepEqual(deriveFundingSourceMetrics(state, {
    type: 'PROJECT_ALLOCATION',
    id: 'allocation-technology-ramadan',
  }), {
    sourceAmount: 800_000_000,
    approvedUnpaidCommitments: 0,
    paymentConfirmedSpend: 200_000_000,
    availableToCommit: 600_000_000,
  });
});
test('project allocation cannot exceed its budget line', () => {
  const state = createInitialState();
  state.allocations.push({ id: 'invalid-allocation', projectId: 'project-ramadan-campaign', budgetLineId: 'budget-line-digital-products', allocatedAmount: 18_000_000_001 });
  assert.throws(() => assertAllocationInvariant(state), /cannot exceed/);
  assert.throws(() => createRequest(state, {
    actorId: 'user-technology-requester',
    ...requestInput,
    projectAllocationId: 'allocation-technology-ramadan',
    requestedAmount: 601_000_000,
  }), /available to commit/);
});

test('submission creates one event without reserving budget', () => {
  const state = createInitialState();
  const request = createRequest(state, { actorId: 'user-technology-requester', ...requestInput });
  assert.equal(request.status, STATUS.AWAITING_LINE_MANAGER);
  assert.equal(state.activityEvents.length, 2); // opening payment + submission
  assert.equal(deriveFundingSourceMetrics(state, { type: 'PROJECT_ALLOCATION', id: request.projectAllocationId }).availableToCommit, 600_000_000);
});

test('only the active actor can advance each approval stage and finance creates commitment', () => {
  const state = createInitialState();
  const request = createRequest(state, { actorId: 'user-technology-requester', ...requestInput });
  assert.throws(() => approveRequest(state, request.id, 'user-technology-requester'), /not authorized/);
  approveRequest(state, request.id, 'user-technology-line-manager');
  approveRequest(state, request.id, 'user-technology-budget-owner');
  assert.equal(deriveFundingSourceMetrics(state, { type: 'PROJECT_ALLOCATION', id: request.projectAllocationId }).availableToCommit, 600_000_000);
  approveRequest(state, request.id, 'user-finance-reviewer');
  assert.equal(request.status, STATUS.APPROVED_AWAITING_PAYMENT);
  assert.equal(request.approvedAmount, 150_000_000);
  const metrics = deriveFundingSourceMetrics(state, { type: 'PROJECT_ALLOCATION', id: request.projectAllocationId });
  assert.equal(metrics.approvedUnpaidCommitments, 150_000_000);
  assert.equal(metrics.availableToCommit, 450_000_000);
  assert.equal(state.activityEvents.filter((event) => event.expenseRequestId === request.id).length, 4);
});

test('payment confirmation reclassifies once without reducing availability twice', () => {
  const state = createInitialState();
  const request = createRequest(state, { actorId: 'user-technology-requester', ...requestInput });
  approveRequest(state, request.id, 'user-technology-line-manager');
  approveRequest(state, request.id, 'user-technology-budget-owner');
  approveRequest(state, request.id, 'user-finance-reviewer');
  confirmPayment(state, request.id, 'user-finance-payment-processor', {
    paymentDate: '2027-02-18',
    beneficiaryName: 'Digital Studio Indonesia',
    destinationBank: 'Bank Syariah Indonesia',
    transferReference: 'TRX-20270218-8491',
    proof: { name: 'transfer-proof.pdf', type: 'application/pdf', size: 1024 },
  });
  assert.equal(request.status, STATUS.PAYMENT_CONFIRMED);
  assert.equal(state.payments.length, 2);
  const metrics = deriveFundingSourceMetrics(state, { type: 'PROJECT_ALLOCATION', id: request.projectAllocationId });
  assert.deepEqual(metrics, {
    sourceAmount: 800_000_000,
    approvedUnpaidCommitments: 0,
    paymentConfirmedSpend: 350_000_000,
    availableToCommit: 450_000_000,
  });
  assert.throws(() => confirmPayment(state, request.id, 'user-finance-payment-processor', {}), /already confirmed/);
});

test('payment confirmation requires a valid Bank Transfer proof and processor role', () => {
  const state = createInitialState();
  const request = createRequest(state, { actorId: 'user-technology-requester', ...requestInput });
  approveRequest(state, request.id, 'user-technology-line-manager');
  approveRequest(state, request.id, 'user-technology-budget-owner');
  approveRequest(state, request.id, 'user-finance-reviewer');
  const details = { paymentDate: '2027-02-18', beneficiaryName: 'Digital Studio Indonesia', destinationBank: 'Bank Syariah Indonesia', transferReference: 'TRX-20270218-8491' };
  assert.throws(() => confirmPayment(state, request.id, 'user-finance-reviewer', { ...details, proof: { name: 'proof.pdf', type: 'application/pdf', size: 100 } }), /Payment Processor/);
  assert.throws(() => confirmPayment(state, request.id, 'user-finance-payment-processor', { ...details, proof: { name: 'proof.exe', type: 'application/octet-stream', size: 100 } }), /Transfer proof/);
  assert.throws(() => confirmPayment(state, request.id, 'user-finance-payment-processor', { ...details, proof: { name: 'proof.pdf', type: 'application/pdf', size: 5 * 1024 * 1024 + 1 } }), /Transfer proof/);
  assert.equal(state.payments.length, 1);
});

test('non-project funding source starts at the budget-line unallocated balance', () => {
  const state = createInitialState();
  const metrics = deriveFundingSourceMetrics(state, {
    type: 'BUDGET_LINE_UNALLOCATED',
    id: 'budget-line-digital-products',
  });
  assert.equal(metrics.sourceAmount, 17_200_000_000);
  const request = createRequest(state, {
    actorId: 'user-technology-requester',
    ...requestInput,
    title: 'Software subscriptions',
    fundingSourceType: 'BUDGET_LINE_UNALLOCATED',
    projectAllocationId: undefined,
    requestedAmount: 100_000_000,
  });
  approveRequest(state, request.id, 'user-technology-line-manager');
  approveRequest(state, request.id, 'user-technology-budget-owner');
  approveRequest(state, request.id, 'user-finance-reviewer');
  assert.equal(deriveFundingSourceMetrics(state, { type: 'BUDGET_LINE_UNALLOCATED', id: request.budgetLineId }).availableToCommit, 17_100_000_000);
});

test('non-project requests use the shared lifecycle and do not double-reduce the balance on payment', () => {
  const state = createInitialState();
  const request = createRequest(state, {
    actorId: 'user-technology-requester',
    ...requestInput,
    title: 'Software subscriptions',
    fundingSourceType: FUNDING_SOURCE.BUDGET_LINE_UNALLOCATED,
    projectAllocationId: undefined,
    requestedAmount: 100_000_000,
  });
  approveRequest(state, request.id, 'user-technology-line-manager');
  approveRequest(state, request.id, 'user-technology-budget-owner');
  approveRequest(state, request.id, 'user-finance-reviewer');
  confirmPayment(state, request.id, 'user-finance-payment-processor', {
    paymentDate: '2027-02-18', beneficiaryName: 'SaaS Vendor', destinationBank: 'Bank Central Asia', transferReference: 'TRX-NONPROJECT-01', proof: { name: 'non-project.png', type: 'image/png', size: 2048 },
  });
  assert.equal(request.status, STATUS.PAYMENT_CONFIRMED);
  assert.deepEqual(deriveFundingSourceMetrics(state, { type: FUNDING_SOURCE.BUDGET_LINE_UNALLOCATED, id: request.budgetLineId }), {
    sourceAmount: 17_200_000_000,
    approvedUnpaidCommitments: 0,
    paymentConfirmedSpend: 100_000_000,
    availableToCommit: 17_100_000_000,
  });
});

test('active approver can reject with a reason and rejection has no financial effect', () => {
  const state = createInitialState();
  const request = createRequest(state, { actorId: 'user-technology-requester', ...requestInput });
  assert.throws(() => rejectRequest(state, request.id, 'user-technology-line-manager', ' '), /reason/);
  rejectRequest(state, request.id, 'user-technology-line-manager', 'Campaign scope needs revision.');
  assert.equal(request.status, STATUS.REJECTED);
  assert.equal(state.payments.length, 1);
  assert.equal(deriveFundingSourceMetrics(state, { type: 'PROJECT_ALLOCATION', id: request.projectAllocationId }).availableToCommit, 600_000_000);
  assert.throws(() => rejectRequest(state, request.id, 'user-technology-line-manager', 'Again'), /terminal/);
});

test('request visibility follows the active simulated role', () => {
  const state = createInitialState();
  const request = createRequest(state, { actorId: 'user-technology-requester', ...requestInput });
  assert.equal(getVisibleRequests(state, 'user-technology-requester').some((item) => item.id === request.id), true);
  assert.equal(getVisibleRequests(state, 'user-finance-payment-processor').some((item) => item.id === request.id), false);
});
