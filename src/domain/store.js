export const STORAGE_KEY = 'budget-execution-state-v1';

export const STATUS = Object.freeze({
  AWAITING_LINE_MANAGER: 'Awaiting Line Manager Approval',
  AWAITING_BUDGET_OWNER: 'Awaiting Budget Owner Approval',
  AWAITING_FINANCE: 'Awaiting Finance Approval',
  APPROVED_AWAITING_PAYMENT: 'Approved — Awaiting Payment Confirmation',
  PAYMENT_CONFIRMED: 'Payment Confirmed',
  REJECTED: 'Rejected',
});

export const ROLE = Object.freeze({
  REQUESTER: 'Requester',
  LINE_MANAGER: 'Line Manager',
  BUDGET_OWNER: 'Department Budget Owner',
  FINANCE_REVIEWER: 'Finance Reviewer',
  FINANCE_PAYMENT_PROCESSOR: 'Finance Payment Processor',
  EXECUTIVE_VIEWER: 'Executive Viewer',
});

export const FUNDING_SOURCE = Object.freeze({
  PROJECT_ALLOCATION: 'PROJECT_ALLOCATION',
  BUDGET_LINE_UNALLOCATED: 'BUDGET_LINE_UNALLOCATED',
});

export const EVENT_TYPE = Object.freeze({
  SUBMITTED: 'Request Submitted',
  LINE_MANAGER_APPROVED: 'Line Manager Approved',
  BUDGET_OWNER_APPROVED: 'Department Budget Owner Approved',
  FINANCE_APPROVED: 'Finance Approved',
  REJECTED: 'Request Rejected',
  PAYMENT_CONFIRMED: 'Payment Confirmed',
});

export const APPROVED_UNPAID = 'approvedUnpaidCommitments';
export const PAYMENT_CONFIRMED = 'paymentConfirmedSpend';

const DAY = 86_400_000;
const now = () => new Date().toISOString();
const dateFromSeed = (daysAgo) => new Date(Date.now() - daysAgo * DAY).toISOString();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nextId(prefix, records) {
  return `${prefix}-${String(records.length + 1).padStart(4, '0')}`;
}

function requireRecord(records, id, label) {
  const record = records.find((item) => item.id === id);
  if (!record) throw new Error(`${label} not found.`);
  return record;
}

export function createInitialState() {
  const users = [
    { id: 'user-technology-requester', name: 'Alya Pranata', role: ROLE.REQUESTER, departmentId: 'technology', managerId: 'user-technology-line-manager' },
    { id: 'user-technology-line-manager', name: 'Raka Wijaya', role: ROLE.LINE_MANAGER, departmentId: 'technology', managerId: null },
    { id: 'user-technology-budget-owner', name: 'Dewi Lestari', role: ROLE.BUDGET_OWNER, departmentId: 'technology', managerId: null },
    { id: 'user-finance-reviewer', name: 'Nina Kurnia', role: ROLE.FINANCE_REVIEWER, departmentId: 'finance', managerId: null },
    { id: 'user-finance-payment-processor', name: 'Siti Rahma', role: ROLE.FINANCE_PAYMENT_PROCESSOR, departmentId: 'finance', managerId: null },
    { id: 'user-executive-viewer', name: 'Fajar Hidayat', role: ROLE.EXECUTIVE_VIEWER, departmentId: 'finance', managerId: null },
  ];

  const departments = [
    { id: 'marketing', name: 'Marketing' },
    { id: 'technology', name: 'Technology' },
    { id: 'operations', name: 'Operations' },
    { id: 'creative', name: 'Creative' },
    { id: 'finance', name: 'Finance' },
    { id: 'other', name: 'Other departments' },
  ];

  const departmentBudgets = [
    { id: 'budget-marketing', departmentId: 'marketing', financialYear: 'FY2027', approvedAmount: 120_000_000_000, budgetOwnerId: 'user-marketing-budget-owner' },
    { id: 'budget-technology', departmentId: 'technology', financialYear: 'FY2027', approvedAmount: 60_000_000_000, budgetOwnerId: 'user-technology-budget-owner' },
    { id: 'budget-operations', departmentId: 'operations', financialYear: 'FY2027', approvedAmount: 80_000_000_000, budgetOwnerId: 'user-operations-budget-owner' },
    { id: 'budget-creative', departmentId: 'creative', financialYear: 'FY2027', approvedAmount: 25_000_000_000, budgetOwnerId: 'user-creative-budget-owner' },
    { id: 'budget-finance', departmentId: 'finance', financialYear: 'FY2027', approvedAmount: 40_000_000_000, budgetOwnerId: 'user-finance-budget-owner' },
    { id: 'budget-other', departmentId: 'other', financialYear: 'FY2027', approvedAmount: 175_000_000_000, budgetOwnerId: 'user-other-budget-owner' },
  ];

  const budgetLines = [
    { id: 'budget-line-brand-campaigns', departmentBudgetId: 'budget-marketing', name: 'Brand Campaigns', approvedAmount: 120_000_000_000 },
    { id: 'budget-line-core-systems', departmentBudgetId: 'budget-technology', name: 'Core Systems', approvedAmount: 20_000_000_000 },
    { id: 'budget-line-infrastructure', departmentBudgetId: 'budget-technology', name: 'Infrastructure', approvedAmount: 15_000_000_000 },
    { id: 'budget-line-digital-products', departmentBudgetId: 'budget-technology', name: 'Digital Products', approvedAmount: 18_000_000_000 },
    { id: 'budget-line-contingency', departmentBudgetId: 'budget-technology', name: 'Contingency', approvedAmount: 7_000_000_000 },
    { id: 'budget-line-campaign-operations', departmentBudgetId: 'budget-operations', name: 'Campaign Operations', approvedAmount: 80_000_000_000 },
    { id: 'budget-line-content-production', departmentBudgetId: 'budget-creative', name: 'Content Production', approvedAmount: 25_000_000_000 },
    { id: 'budget-line-finance-operations', departmentBudgetId: 'budget-finance', name: 'Finance Operations', approvedAmount: 40_000_000_000 },
    { id: 'budget-line-general', departmentBudgetId: 'budget-other', name: 'General Operations', approvedAmount: 175_000_000_000 },
  ];

  const projects = [{
    id: 'project-ramadan-campaign',
    name: 'Ramadan Campaign',
    ownerName: 'Nadia Pranoto',
    startDate: '2027-01-10',
    endDate: '2027-03-31',
    status: 'In delivery',
  }];

  const allocations = [
    { id: 'allocation-marketing-ramadan', projectId: 'project-ramadan-campaign', budgetLineId: 'budget-line-brand-campaigns', allocatedAmount: 2_500_000_000 },
    { id: 'allocation-technology-ramadan', projectId: 'project-ramadan-campaign', budgetLineId: 'budget-line-digital-products', allocatedAmount: 800_000_000 },
    { id: 'allocation-operations-ramadan', projectId: 'project-ramadan-campaign', budgetLineId: 'budget-line-campaign-operations', allocatedAmount: 1_200_000_000 },
    { id: 'allocation-creative-ramadan', projectId: 'project-ramadan-campaign', budgetLineId: 'budget-line-content-production', allocatedAmount: 500_000_000 },
  ];

  const requests = [{
    id: 'request-initial-technology-payment',
    title: 'Creator retainer — Ramadan Campaign',
    requesterId: 'user-technology-requester',
    departmentId: 'technology',
    lineManagerApproverId: 'user-technology-line-manager',
    budgetOwnerApproverId: 'user-technology-budget-owner',
    budgetLineId: 'budget-line-digital-products',
    fundingSourceType: FUNDING_SOURCE.PROJECT_ALLOCATION,
    projectAllocationId: 'allocation-technology-ramadan',
    vendorName: 'Nusantara Creators',
    requestedAmount: 200_000_000,
    approvedAmount: 200_000_000,
    requiredDate: '2027-01-30',
    justification: 'Opening creator production retainer seeded for the campaign.',
    status: STATUS.PAYMENT_CONFIRMED,
    createdAt: dateFromSeed(35),
    approvedAt: dateFromSeed(34),
    paymentConfirmedAt: dateFromSeed(30),
  }];

  const payments = [{
    id: 'payment-initial-technology',
    expenseRequestId: 'request-initial-technology-payment',
    paymentDate: '2027-01-30',
    confirmedAmount: 200_000_000,
    beneficiaryName: 'Nusantara Creators',
    destinationBank: 'Bank Syariah Indonesia',
    transferReference: 'TRX-20270130-2001',
    transferProofFileName: 'opening-proof.pdf',
    transferProofFileType: 'application/pdf',
    transferProofFileSize: 2048,
    processedByUserId: 'user-finance-payment-processor',
    confirmedAt: dateFromSeed(30),
  }];

  const activityEvents = [{
    id: 'event-initial-technology-payment',
    expenseRequestId: 'request-initial-technology-payment',
    eventType: EVENT_TYPE.PAYMENT_CONFIRMED,
    actorId: 'user-finance-payment-processor',
    actorRole: ROLE.FINANCE_PAYMENT_PROCESSOR,
    timestamp: dateFromSeed(30),
    resultingStatus: STATUS.PAYMENT_CONFIRMED,
    comment: 'Opening campaign payment already confirmed outside the product.',
    metadata: { amount: 200_000_000, bank: 'Bank Syariah Indonesia', reference: 'TRX-20270130-2001', proofFileName: 'opening-proof.pdf', proofFileType: 'application/pdf', proofFileSize: 2048 },
  }];

  return { version: 1, company: { name: 'Budget Execution', financialYear: 'FY2027', approvedAmount: 500_000_000_000 }, departments, users, departmentBudgets, budgetLines, projects, allocations, requests, payments, activityEvents };
}

export function cloneState(state) {
  return clone(state);
}

export function assertAllocationInvariant(state) {
  for (const line of state.budgetLines) {
    const allocatedAmount = state.allocations.filter((allocation) => allocation.budgetLineId === line.id).reduce((sum, allocation) => sum + allocation.allocatedAmount, 0);
    if (allocatedAmount > line.approvedAmount) throw new Error(`Project Allocations cannot exceed the approved amount for ${line.name}.`);
  }
  return true;
}

export function loadState(storage = globalThis.localStorage) {
  if (!storage) return createInitialState();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    const state = raw ? JSON.parse(raw) : createInitialState();
    assertAllocationInvariant(state);
    return state;
  } catch {
    return createInitialState();
  }
}

export function saveState(state, storage = globalThis.localStorage) {
  if (storage) storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState(storage = globalThis.localStorage) {
  const state = createInitialState();
  saveState(state, storage);
  return state;
}

export function getUser(state, userId) {
  return requireRecord(state.users, userId, 'User');
}

export function getDepartment(state, departmentId) {
  return requireRecord(state.departments, departmentId, 'Department');
}

export function getBudgetLine(state, budgetLineId) {
  return requireRecord(state.budgetLines, budgetLineId, 'Budget Line');
}

export function getProjectAllocation(state, allocationId) {
  return requireRecord(state.allocations, allocationId, 'Project Allocation');
}

function budgetLineDepartmentId(state, budgetLineId) {
  const line = getBudgetLine(state, budgetLineId);
  return requireRecord(state.departmentBudgets, line.departmentBudgetId, 'Department budget').departmentId;
}

function requestPayment(state, requestId) {
  return state.payments.find((payment) => payment.expenseRequestId === requestId);
}

function requestSpend(state, request) {
  return requestPayment(state, request.id)?.confirmedAmount ?? 0;
}

function requestCommitment(request) {
  return request.status === STATUS.APPROVED_AWAITING_PAYMENT ? request.approvedAmount ?? request.requestedAmount : 0;
}

export function deriveFundingSourceMetrics(state, source) {
  let sourceAmount = 0;
  let matches = [];
  if (source.type === FUNDING_SOURCE.PROJECT_ALLOCATION) {
    const allocation = getProjectAllocation(state, source.id);
    sourceAmount = allocation.allocatedAmount;
    matches = state.requests.filter((request) => request.projectAllocationId === source.id);
  } else if (source.type === FUNDING_SOURCE.BUDGET_LINE_UNALLOCATED) {
    const line = getBudgetLine(state, source.id);
    const allocatedToProjects = state.allocations.filter((allocation) => allocation.budgetLineId === line.id).reduce((sum, allocation) => sum + allocation.allocatedAmount, 0);
    sourceAmount = line.approvedAmount - allocatedToProjects;
    matches = state.requests.filter((request) => request.fundingSourceType === FUNDING_SOURCE.BUDGET_LINE_UNALLOCATED && request.budgetLineId === source.id);
  } else {
    throw new Error('Unknown Funding Source type.');
  }
  const approvedUnpaidCommitments = matches.reduce((sum, request) => sum + requestCommitment(request), 0);
  const paymentConfirmedSpend = matches.reduce((sum, request) => sum + requestSpend(state, request), 0);
  return { sourceAmount, approvedUnpaidCommitments, paymentConfirmedSpend, availableToCommit: sourceAmount - approvedUnpaidCommitments - paymentConfirmedSpend };
}

export function deriveProjectReport(state, projectId) {
  const project = requireRecord(state.projects, projectId, 'Project');
  const allocations = state.allocations.filter((allocation) => allocation.projectId === projectId);
  const rows = allocations.map((allocation) => {
    const line = getBudgetLine(state, allocation.budgetLineId);
    const departmentId = budgetLineDepartmentId(state, allocation.budgetLineId);
    const metrics = deriveFundingSourceMetrics(state, { type: FUNDING_SOURCE.PROJECT_ALLOCATION, id: allocation.id });
    return { allocation, budgetLine: line, departmentId, metrics };
  });
  return {
    project,
    allocations: rows,
    allocationAmount: rows.reduce((sum, row) => sum + row.metrics.sourceAmount, 0),
    approvedUnpaidCommitments: rows.reduce((sum, row) => sum + row.metrics.approvedUnpaidCommitments, 0),
    paymentConfirmedSpend: rows.reduce((sum, row) => sum + row.metrics.paymentConfirmedSpend, 0),
    availableToCommit: rows.reduce((sum, row) => sum + row.metrics.availableToCommit, 0),
  };
}

export function deriveDepartmentReports(state) {
  return state.departments.map((department) => {
    const budget = state.departmentBudgets.find((item) => item.departmentId === department.id);
    const lines = state.budgetLines.filter((line) => line.departmentBudgetId === budget?.id);
    const lineIds = new Set(lines.map((line) => line.id));
    const allocatedToProjects = state.allocations.filter((allocation) => lineIds.has(allocation.budgetLineId)).reduce((sum, allocation) => sum + allocation.allocatedAmount, 0);
    const requests = state.requests.filter((request) => request.departmentId === department.id);
    return {
      department,
      approvedBudget: budget?.approvedAmount ?? 0,
      allocatedToProjects,
      departmentUnallocatedBudget: (budget?.approvedAmount ?? 0) - allocatedToProjects,
      approvedUnpaidCommitments: requests.reduce((sum, request) => sum + requestCommitment(request), 0),
      paymentConfirmedSpend: requests.reduce((sum, request) => sum + requestSpend(state, request), 0),
    };
  });
}

export function deriveCompanyReport(state) {
  const departments = deriveDepartmentReports(state);
  return {
    approvedBudget: state.company.approvedAmount,
    allocatedToProjects: departments.reduce((sum, row) => sum + row.allocatedToProjects, 0),
    departmentUnallocatedBudget: departments.reduce((sum, row) => sum + row.departmentUnallocatedBudget, 0),
    approvedUnpaidCommitments: departments.reduce((sum, row) => sum + row.approvedUnpaidCommitments, 0),
    paymentConfirmedSpend: departments.reduce((sum, row) => sum + row.paymentConfirmedSpend, 0),
    departments,
  };
}

export function getProjectForRequest(state, request) {
  return request.projectAllocationId ? getProjectAllocation(state, request.projectAllocationId) && state.projects.find((project) => project.id === getProjectAllocation(state, request.projectAllocationId).projectId) : null;
}

function validateRequestFields(input) {
  if (!input.title?.trim()) throw new Error('Title is required.');
  if (!input.vendorName?.trim()) throw new Error('Vendor or recipient is required.');
  if (!Number.isInteger(input.requestedAmount) || input.requestedAmount <= 0) throw new Error('Requested amount must be greater than zero.');
  if (!input.requiredDate) throw new Error('Required date is required.');
  if (!input.justification?.trim()) throw new Error('Business justification is required.');
}

export function createRequest(state, input) {
  const requester = getUser(state, input.actorId);
  if (requester.role !== ROLE.REQUESTER) throw new Error('Only a Requester can submit a request.');
  validateRequestFields(input);
  if (!Object.values(FUNDING_SOURCE).includes(input.fundingSourceType)) throw new Error('Funding Source type is required.');
  const budgetLine = getBudgetLine(state, input.budgetLineId);
  const departmentId = budgetLineDepartmentId(state, input.budgetLineId);
  if (departmentId !== requester.departmentId) throw new Error('Funding Source must belong to the requester department.');
  let projectAllocationId;
  if (input.fundingSourceType === FUNDING_SOURCE.PROJECT_ALLOCATION) {
    const allocation = getProjectAllocation(state, input.projectAllocationId);
    if (allocation.budgetLineId !== input.budgetLineId) throw new Error('Project Allocation and Budget Line must be related.');
    projectAllocationId = allocation.id;
  } else if (input.projectAllocationId) {
    throw new Error('Non-project requests cannot include a Project Allocation.');
  }
  const source = { type: input.fundingSourceType, id: input.fundingSourceType === FUNDING_SOURCE.PROJECT_ALLOCATION ? projectAllocationId : input.budgetLineId };
  const metrics = deriveFundingSourceMetrics(state, source);
  if (input.requestedAmount > metrics.availableToCommit) throw new Error('Requested amount exceeds the Funding Source available to commit.');
  const budget = state.departmentBudgets.find((item) => item.departmentId === departmentId);
  const request = {
    id: nextId('request', state.requests),
    title: input.title.trim(),
    requesterId: requester.id,
    departmentId,
    lineManagerApproverId: requester.managerId,
    budgetOwnerApproverId: budget?.budgetOwnerId,
    budgetLineId: input.budgetLineId,
    fundingSourceType: input.fundingSourceType,
    projectAllocationId,
    vendorName: input.vendorName.trim(),
    requestedAmount: input.requestedAmount,
    approvedAmount: null,
    requiredDate: input.requiredDate,
    justification: input.justification.trim(),
    status: STATUS.AWAITING_LINE_MANAGER,
    createdAt: now(),
    approvedAt: null,
    paymentConfirmedAt: null,
  };
  state.requests.push(request);
  addEvent(state, request, EVENT_TYPE.SUBMITTED, requester, STATUS.AWAITING_LINE_MANAGER, { comment: 'Request submitted for business approval.' });
  return request;
}

function activeApproval(request) {
  if (request.status === STATUS.AWAITING_LINE_MANAGER) return { role: ROLE.LINE_MANAGER, actorId: request.lineManagerApproverId, nextStatus: STATUS.AWAITING_BUDGET_OWNER, eventType: EVENT_TYPE.LINE_MANAGER_APPROVED };
  if (request.status === STATUS.AWAITING_BUDGET_OWNER) return { role: ROLE.BUDGET_OWNER, actorId: request.budgetOwnerApproverId, nextStatus: STATUS.AWAITING_FINANCE, eventType: EVENT_TYPE.BUDGET_OWNER_APPROVED };
  if (request.status === STATUS.AWAITING_FINANCE) return { role: ROLE.FINANCE_REVIEWER, nextStatus: STATUS.APPROVED_AWAITING_PAYMENT, eventType: EVENT_TYPE.FINANCE_APPROVED };
  return null;
}

function assertApprovalActor(state, request, actorId) {
  const actor = getUser(state, actorId);
  if ([STATUS.REJECTED, STATUS.PAYMENT_CONFIRMED].includes(request.status)) throw new Error('Request is terminal and cannot be changed.');
  const current = activeApproval(request);
  if (!current) throw new Error('This request is not at an active approval stage.');
  if (actor.role !== current.role || (current.actorId && actor.id !== current.actorId)) throw new Error('Actor is not authorized for this approval stage.');
  return { actor, current };
}

function addEvent(state, request, eventType, actor, resultingStatus, metadata = {}) {
  const event = {
    id: nextId('event', state.activityEvents),
    expenseRequestId: request.id,
    eventType,
    actorId: actor.id,
    actorRole: actor.role,
    timestamp: now(),
    resultingStatus,
    comment: metadata.comment ?? null,
    metadata: { ...metadata },
  };
  delete event.metadata.comment;
  state.activityEvents.push(event);
  return event;
}

export function getFinanceImpactPreview(state, requestId) {
  const request = requireRecord(state.requests, requestId, 'Expense request');
  const source = { type: request.fundingSourceType, id: request.fundingSourceType === FUNDING_SOURCE.PROJECT_ALLOCATION ? request.projectAllocationId : request.budgetLineId };
  const metrics = deriveFundingSourceMetrics(state, source);
  const projectedAvailableToCommit = metrics.availableToCommit - request.requestedAmount;
  return { ...metrics, requestAmount: request.requestedAmount, projectedAvailableToCommit, projectedUtilization: metrics.sourceAmount ? (metrics.sourceAmount - projectedAvailableToCommit) / metrics.sourceAmount : 0 };
}

export function approveRequest(state, requestId, actorId) {
  const request = requireRecord(state.requests, requestId, 'Expense request');
  const { actor, current } = assertApprovalActor(state, request, actorId);
  if (request.status === STATUS.AWAITING_FINANCE) {
    const preview = getFinanceImpactPreview(state, request.id);
    if (preview.projectedAvailableToCommit < 0) throw new Error('Finance approval is blocked because projected available to commit is negative.');
    request.approvedAmount = request.requestedAmount;
    request.approvedAt = now();
  }
  request.status = current.nextStatus;
  addEvent(state, request, current.eventType, actor, request.status, { amount: current.role === ROLE.FINANCE_REVIEWER ? request.approvedAmount : undefined });
  return request;
}

export function rejectRequest(state, requestId, actorId, reason) {
  const request = requireRecord(state.requests, requestId, 'Expense request');
  const { actor } = assertApprovalActor(state, request, actorId);
  if (!reason?.trim()) throw new Error('A rejection reason is required.');
  request.status = STATUS.REJECTED;
  addEvent(state, request, EVENT_TYPE.REJECTED, actor, request.status, { comment: reason.trim(), reason: reason.trim() });
  return request;
}

function validateProof(proof) {
  if (!proof?.name || !proof?.type || !Number.isFinite(proof.size)) throw new Error('Transfer proof is required.');
  const acceptedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
  const acceptedExtension = /\.(pdf|png|jpe?g)$/i.test(proof.name);
  if ((!acceptedTypes.includes(proof.type) && !acceptedExtension) || proof.size > 5 * 1024 * 1024) throw new Error('Transfer proof must be PDF, PNG, JPG, or JPEG up to 5 MB.');
}

export function confirmPayment(state, requestId, actorId, input) {
  const request = requireRecord(state.requests, requestId, 'Expense request');
  const actor = getUser(state, actorId);
  if (actor.role !== ROLE.FINANCE_PAYMENT_PROCESSOR) throw new Error('Only the Finance Payment Processor can confirm payment.');
  if (request.status === STATUS.PAYMENT_CONFIRMED || requestPayment(state, request.id)) throw new Error('Payment is already confirmed for this request.');
  if (request.status !== STATUS.APPROVED_AWAITING_PAYMENT) throw new Error('Only an approved request can receive payment confirmation.');
  if (!input?.paymentDate || !input.beneficiaryName?.trim() || !input.destinationBank?.trim() || !input.transferReference?.trim()) throw new Error('Payment date, beneficiary, destination bank, and transfer reference are required.');
  validateProof(input.proof);
  const payment = {
    id: nextId('payment', state.payments),
    expenseRequestId: request.id,
    paymentDate: input.paymentDate,
    confirmedAmount: request.approvedAmount,
    beneficiaryName: input.beneficiaryName.trim(),
    destinationBank: input.destinationBank.trim(),
    transferReference: input.transferReference.trim(),
    transferProofFileName: input.proof.name,
    transferProofFileType: input.proof.type,
    transferProofFileSize: input.proof.size,
    processedByUserId: actor.id,
    confirmedAt: now(),
  };
  state.payments.push(payment);
  request.status = STATUS.PAYMENT_CONFIRMED;
  request.paymentConfirmedAt = payment.confirmedAt;
  addEvent(state, request, EVENT_TYPE.PAYMENT_CONFIRMED, actor, request.status, {
    amount: payment.confirmedAmount,
    bank: payment.destinationBank,
    reference: payment.transferReference,
    proofFileName: payment.transferProofFileName,
    proofFileType: payment.transferProofFileType,
    proofFileSize: payment.transferProofFileSize,
  });
  return payment;
}

export function getVisibleRequests(state, actorId) {
  const actor = getUser(state, actorId);
  if (actor.role === ROLE.REQUESTER) return state.requests.filter((request) => request.requesterId === actor.id);
  if (actor.role === ROLE.LINE_MANAGER) return state.requests.filter((request) => request.lineManagerApproverId === actor.id);
  if (actor.role === ROLE.BUDGET_OWNER) return state.requests.filter((request) => request.budgetOwnerApproverId === actor.id);
  if (actor.role === ROLE.FINANCE_PAYMENT_PROCESSOR) return state.requests.filter((request) => [STATUS.APPROVED_AWAITING_PAYMENT, STATUS.PAYMENT_CONFIRMED].includes(request.status));
  return state.requests;
}

export function getActiveApproval(state, request) {
  const current = activeApproval(request);
  if (!current) return null;
  const actor = state.users.find((user) => user.id === current.actorId) ?? state.users.find((user) => user.role === current.role);
  return { ...current, actor };
}

export function getQueueCounts(state, actorId) {
  const requests = getVisibleRequests(state, actorId);
  return {
    all: requests.length,
    myApprovals: requests.filter((request) => getActiveApproval(state, request)?.actorId === actorId).length,
    awaitingPayment: requests.filter((request) => request.status === STATUS.APPROVED_AWAITING_PAYMENT).length,
  };
}

export function getFundingSourcesForRequester(state, actorId, fundingSourceType) {
  const actor = getUser(state, actorId);
  if (actor.role !== ROLE.REQUESTER) return [];
  if (fundingSourceType === FUNDING_SOURCE.PROJECT_ALLOCATION) {
    return state.allocations.filter((allocation) => budgetLineDepartmentId(state, allocation.budgetLineId) === actor.departmentId).map((allocation) => ({ ...allocation, budgetLine: getBudgetLine(state, allocation.budgetLineId), project: state.projects.find((project) => project.id === allocation.projectId), metrics: deriveFundingSourceMetrics(state, { type: FUNDING_SOURCE.PROJECT_ALLOCATION, id: allocation.id }) }));
  }
  return state.budgetLines.filter((line) => budgetLineDepartmentId(state, line.id) === actor.departmentId).map((line) => ({ ...line, metrics: deriveFundingSourceMetrics(state, { type: FUNDING_SOURCE.BUDGET_LINE_UNALLOCATED, id: line.id }) }));
}

export function getEventActor(state, event) {
  return state.users.find((user) => user.id === event.actorId);
}

export function formatIDR(amount, compact = false) {
  if (compact) {
    if (amount >= 1_000_000_000) return `Rp${Number((amount / 1_000_000_000).toFixed(1)).toLocaleString('id-ID')}B`;
    if (amount >= 1_000_000) return `Rp${Number((amount / 1_000_000).toFixed(1)).toLocaleString('id-ID')}M`;
  }
  return `Rp${new Intl.NumberFormat('id-ID').format(amount)}`;
}
