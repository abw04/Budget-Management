import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APPROVED_UNPAID,
  PAYMENT_CONFIRMED,
  STATUS,
  PAGE,
  FUNDING_SOURCE,
  createInitialState,
  assertAllocationInvariant,
  deriveFundingSourceMetrics,
  createRequest,
  approveRequest,
  confirmPayment,
  rejectRequest,
  getVisibleRequests,
  getActiveApproval,
  getQueueCounts,
  canActorActOnRequest,
  canActorAccessPage,
  getDefaultPageForActor,
  deriveOverviewReportForActor,
  deriveProjectReportForActor,
  getFundingSourcesForRequester,
  deriveDepartmentReports,
  deriveCompanyReport,
  deriveProjectReport,
  deriveProjectsReport,
  getProjectAllocationForRequester,
  validateProofMetadata,
  validateRequestedAmount,
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

test('project summaries are data-driven and preserve each project report', () => {
  const state = createInitialState();
  state.projects.push({ id: 'project-empty', name: 'Empty Project', ownerName: 'Test Owner', startDate: '2027-04-01', endDate: '2027-04-30', status: 'Planning' });
  const reports = deriveProjectsReport(state);
  assert.equal(reports.length, 2);
  assert.equal(reports[0].project.id, 'project-ramadan-campaign');
  assert.equal(reports[0].allocationAmount, deriveProjectReport(state, 'project-ramadan-campaign').allocationAmount);
  assert.equal(reports[0].requestCount, 1);
  assert.equal(reports[1].allocationAmount, 0);
  assert.equal(reports[1].requestCount, 0);
});

test('project allocation selection is scoped to the requester and project', () => {
  const state = createInitialState();
  assert.equal(getProjectAllocationForRequester(state, 'project-ramadan-campaign', 'user-technology-requester').id, 'allocation-technology-ramadan');
  assert.equal(getProjectAllocationForRequester(state, 'project-ramadan-campaign', 'user-finance-reviewer'), null);
  assert.equal(getProjectAllocationForRequester(state, 'missing-project', 'user-technology-requester'), null);
});

test('Alya can use only Technology-owned Funding Sources', () => {
  const state = createInitialState();
  const projectSources = getFundingSourcesForRequester(state, 'user-technology-requester', FUNDING_SOURCE.PROJECT_ALLOCATION);
  const budgetSources = getFundingSourcesForRequester(state, 'user-technology-requester', FUNDING_SOURCE.BUDGET_LINE_UNALLOCATED);
  assert.deepEqual(projectSources.map((source) => source.id), ['allocation-technology-ramadan']);
  assert.equal(budgetSources.every((source) => source.departmentBudgetId === 'budget-technology'), true);
});

test('an ineligible Project Allocation is rejected rather than substituted', () => {
  const state = createInitialState();
  assert.throws(() => createRequest(state, {
    actorId: 'user-technology-requester',
    ...requestInput,
    projectAllocationId: 'allocation-marketing-ramadan',
    budgetLineId: 'budget-line-brand-campaigns',
  }), /requester department/);
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

test('department boundaries scope requester visibility and project allocations', () => {
  const state = createInitialState();
  const marketingRequest = createRequest(state, {
    actorId: 'user-marketing-requester',
    ...requestInput,
    title: 'Marketing partnership support',
    fundingSourceType: FUNDING_SOURCE.BUDGET_LINE_UNALLOCATED,
    projectAllocationId: undefined,
    budgetLineId: 'budget-line-brand-campaigns',
    requestedAmount: 50_000_000,
  });

  const technologyRequests = getVisibleRequests(state, 'user-technology-requester');
  const marketingRequests = getVisibleRequests(state, 'user-marketing-requester');
  assert.equal(technologyRequests.some((request) => request.id === marketingRequest.id), false);
  assert.equal(marketingRequests.some((request) => request.id === marketingRequest.id), true);
  assert.equal(marketingRequests.some((request) => request.id === 'request-initial-technology-payment'), false);
  assert.equal(getVisibleRequests(state, 'user-finance-reviewer').length, 2);

  assert.equal(getFundingSourcesForRequester(state, 'user-marketing-requester', FUNDING_SOURCE.PROJECT_ALLOCATION).every((source) => source.budgetLine.departmentBudgetId === 'budget-marketing'), true);
  const technologyProject = deriveProjectReportForActor(state, 'project-ramadan-campaign', 'user-technology-line-manager');
  assert.deepEqual(technologyProject.allocations.map((row) => row.departmentId), ['technology']);
  assert.equal(technologyProject.allocationAmount, 800_000_000);
  const marketingProject = deriveProjectReportForActor(state, 'project-ramadan-campaign', 'user-marketing-requester');
  assert.deepEqual(marketingProject.allocations.map((row) => row.departmentId), ['marketing']);
  assert.equal(marketingProject.allocationAmount, 2_500_000_000);
});

test('page access and overview scope follow the financial visibility policy', () => {
  const state = createInitialState();
  assert.equal(canActorAccessPage(state, 'user-finance-reviewer', PAGE.OVERVIEW), true);
  assert.equal(canActorAccessPage(state, 'user-executive-viewer', PAGE.OVERVIEW), true);
  assert.equal(canActorAccessPage(state, 'user-technology-budget-owner', PAGE.OVERVIEW), true);
  assert.equal(canActorAccessPage(state, 'user-technology-line-manager', PAGE.OVERVIEW), false);
  assert.equal(canActorAccessPage(state, 'user-marketing-requester', PAGE.OVERVIEW), false);
  assert.equal(canActorAccessPage(state, 'user-technology-line-manager', PAGE.PROJECTS), true);
  assert.equal(canActorAccessPage(state, 'user-marketing-requester', PAGE.PROJECTS), true);
  assert.equal(canActorAccessPage(state, 'user-finance-payment-processor', PAGE.PROJECTS), false);
  assert.equal(getDefaultPageForActor(state, 'user-finance-reviewer'), PAGE.OVERVIEW);
  assert.equal(getDefaultPageForActor(state, 'user-marketing-requester'), PAGE.WORKSPACE);

  const technologyOverview = deriveOverviewReportForActor(state, 'user-technology-budget-owner');
  assert.equal(technologyOverview.scope, 'department');
  assert.deepEqual(technologyOverview.departments.map((row) => row.department.id), ['technology']);
  const companyOverview = deriveOverviewReportForActor(state, 'user-finance-reviewer');
  assert.equal(companyOverview.scope, 'company');
  assert.equal(companyOverview.departments.length, state.departments.length);
});

test('Finance approval is role-owned in the queue and action policy', () => {
  const state = createInitialState();
  const request = createRequest(state, { actorId: 'user-technology-requester', ...requestInput });
  approveRequest(state, request.id, 'user-technology-line-manager');
  approveRequest(state, request.id, 'user-technology-budget-owner');
  const pending = getActiveApproval(state, request);
  assert.equal(pending.actorId, 'user-finance-reviewer');
  assert.equal(getQueueCounts(state, 'user-finance-reviewer').myApprovals, 1);
  assert.equal(canActorActOnRequest(state, request, 'user-finance-reviewer'), true);
  assert.equal(canActorActOnRequest(state, request, 'user-finance-payment-processor'), false);
});

test('department and company unallocated budgets consume non-project commitments once', () => {
  const state = createInitialState();
  const request = createRequest(state, {
    actorId: 'user-technology-requester',
    ...requestInput,
    title: 'Technology subscription',
    fundingSourceType: FUNDING_SOURCE.BUDGET_LINE_UNALLOCATED,
    projectAllocationId: undefined,
    requestedAmount: 100_000_000,
  });
  const reportBefore = deriveDepartmentReports(state).find((row) => row.department.id === 'technology');
  assert.equal(reportBefore.departmentUnallocatedBudget, 59_200_000_000);
  approveRequest(state, request.id, 'user-technology-line-manager');
  approveRequest(state, request.id, 'user-technology-budget-owner');
  approveRequest(state, request.id, 'user-finance-reviewer');
  const reportAfterApproval = deriveDepartmentReports(state).find((row) => row.department.id === 'technology');
  assert.equal(reportAfterApproval.departmentUnallocatedBudget, 59_100_000_000);
  confirmPayment(state, request.id, 'user-finance-payment-processor', {
    paymentDate: '2027-02-18', beneficiaryName: 'SaaS Vendor', destinationBank: 'Bank Central Asia', transferReference: 'TRX-REPORT-01', proof: { name: 'report-proof.pdf', type: 'application/pdf', size: 1024 },
  });
  const reportAfterPayment = deriveDepartmentReports(state).find((row) => row.department.id === 'technology');
  const company = deriveCompanyReport(state);
  assert.equal(reportAfterPayment.departmentUnallocatedBudget, 59_100_000_000);
  assert.equal(company.departmentUnallocatedBudget, 494_900_000_000);
});

test('remaining budget subtracts payment-confirmed spend from approved budget', () => {
  const state = createInitialState();
  const initialCompany = deriveCompanyReport(state);
  const initialTechnology = initialCompany.departments.find((row) => row.department.id === 'technology');
  assert.equal(initialCompany.remainingBudget, 499_800_000_000);
  assert.equal(initialTechnology.remainingBudget, 59_800_000_000);

  const request = createRequest(state, { actorId: 'user-technology-requester', ...requestInput });
  approveRequest(state, request.id, 'user-technology-line-manager');
  approveRequest(state, request.id, 'user-technology-budget-owner');
  approveRequest(state, request.id, 'user-finance-reviewer');
  const afterApproval = deriveCompanyReport(state);
  assert.equal(afterApproval.remainingBudget, initialCompany.remainingBudget);

  confirmPayment(state, request.id, 'user-finance-payment-processor', {
    paymentDate: '2027-02-18', beneficiaryName: 'Digital Studio Indonesia', destinationBank: 'Bank Central Asia', transferReference: 'TRX-REMAINING-01', proof: { name: 'remaining-proof.pdf', type: 'application/pdf', size: 1024 },
  });
  const afterPayment = deriveCompanyReport(state);
  const technologyAfterPayment = afterPayment.departments.find((row) => row.department.id === 'technology');
  assert.equal(afterPayment.remainingBudget, 499_650_000_000);
  assert.equal(technologyAfterPayment.remainingBudget, 59_650_000_000);
});

test('proof metadata requires matching accepted MIME and extension at the 5 MB boundary', () => {
  assert.equal(validateProofMetadata({ name: 'proof.pdf', type: 'application/pdf', size: 5 * 1024 * 1024 }), true);
  assert.equal(validateProofMetadata({ name: 'proof.PNG', type: '', size: 1 }), true);
  assert.throws(() => validateProofMetadata({ name: 'proof.png', type: 'application/pdf', size: 1 }), /matching/);
  assert.throws(() => validateProofMetadata({ name: 'proof.pdf', type: 'application/pdf', size: 5 * 1024 * 1024 + 1 }), /up to 5 MB/);
});

test('amount validation reports current availability and maximum valid amount', () => {
  const state = createInitialState();
  assert.throws(() => validateRequestedAmount(state, { type: FUNDING_SOURCE.PROJECT_ALLOCATION, id: 'allocation-technology-ramadan' }, 601_000_000), /Available to commit: Rp600\.000\.000.*Maximum valid amount: Rp600\.000\.000/);
});

test('Finance performs a fresh availability check after earlier approvals', () => {
  const state = createInitialState();
  const target = createRequest(state, { actorId: 'user-technology-requester', ...requestInput });
  const earlier = createRequest(state, { actorId: 'user-technology-requester', ...requestInput, title: 'Earlier commitment', requestedAmount: 500_000_000 });
  approveRequest(state, earlier.id, 'user-technology-line-manager');
  approveRequest(state, earlier.id, 'user-technology-budget-owner');
  approveRequest(state, earlier.id, 'user-finance-reviewer');
  approveRequest(state, target.id, 'user-technology-line-manager');
  approveRequest(state, target.id, 'user-technology-budget-owner');
  assert.throws(() => approveRequest(state, target.id, 'user-finance-reviewer'), /projected available|Available to commit/);
});
