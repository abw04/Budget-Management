import {
  STATUS,
  ROLE,
  FUNDING_SOURCE,
  EVENT_TYPE,
  createInitialState,
  loadState,
  saveState,
  resetState,
  getUser,
  getDepartment,
  getBudgetLine,
  deriveCompanyReport,
  deriveProjectReport,
  deriveFundingSourceMetrics,
  getProjectForRequest,
  getFinanceImpactPreview,
  getVisibleRequests,
  getActiveApproval,
  getQueueCounts,
  getFundingSourcesForRequester,
  getEventActor,
  createRequest,
  approveRequest,
  rejectRequest,
  confirmPayment,
  formatIDR,
} from './domain/store.js';

const root = document.querySelector('#root');
let state = loadState();
let activeUserId = 'user-finance-reviewer';
let page = 'overview';
let workspaceTab = 'all';
let selectedRequestId = state.requests[0]?.id;
let modal = null;
let toast = '';
let formError = '';
let formErrors = {};
let newRequestDraft = null;
let rejectDraft = { reason: '' };
let paymentDraft = { paymentDate: '2027-02-18', beneficiaryName: '', destinationBank: '', transferReference: '', proof: null };

const activeUser = () => getUser(state, activeUserId);
const e = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
const cn = (...names) => names.filter(Boolean).join(' ');
const compact = (value) => formatIDR(value, true);
const full = (value) => formatIDR(value);
const dateLabel = (value) => value ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}${value.length === 10 ? 'T00:00:00' : ''}`)) : '—';
const timeLabel = (value) => value ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '—';

function notify(message) {
  toast = message;
  render();
  window.setTimeout(() => { toast = ''; render(); }, 3600);
}

function pageHeader(kicker, title, description, action = '') {
  return `<header class="page-header"><div><span class="kicker">${e(kicker)}</span><h1>${e(title)}</h1><p>${e(description)}</p></div>${action}</header>`;
}

function metric(label, value, detail, tone = '') {
  return `<div class="metric ${tone}"><span class="metric-label">${e(label)}</span><strong>${e(value)}</strong><span class="metric-detail">${e(detail)}</span></div>`;
}

function statusBadge(status) {
  const tone = status === STATUS.PAYMENT_CONFIRMED ? 'teal' : status === STATUS.REJECTED ? 'red' : status === STATUS.APPROVED_AWAITING_PAYMENT ? 'amber' : 'blue';
  return `<span class="status status-${tone}"><span class="status-mark" aria-hidden="true"></span>${e(status)}</span>`;
}

function roleBadge(user) {
  return `<span class="role-badge">${e(user.role)} · ${e(getDepartment(state, user.departmentId).name)}</span>`;
}

function button(label, action, options = {}) {
  const { kind = 'secondary', disabled = false, extra = '', type = 'button' } = options;
  return `<button type="${type}" class="button button-${kind}" data-action="${e(action)}" ${disabled ? 'disabled' : ''} ${extra}>${e(label)}</button>`;
}

function renderShell(content) {
  const user = activeUser();
  const counts = getQueueCounts(state, user.id);
  return `<div class="app-shell">
    <aside class="sidebar">
      <div class="brand"><span class="brand-mark">BE</span><div><strong>Budget Execution</strong><span>Control room · ${e(state.company.financialYear)}</span></div></div>
      <nav aria-label="Primary navigation" class="primary-nav">
        <span class="nav-label">Workspace</span>
        ${navButton('overview', 'Overview', '⌂')}
        ${navButton('project', 'Ramadan Campaign', '◈')}
        ${navButton('workspace', 'Request Workspace', '≡', counts.myApprovals)}
      </nav>
      <div class="sidebar-foot">
        <div class="actor-card"><span class="nav-label">Simulated actor</span><strong>${e(user.name)}</strong><span>${e(user.role)}</span><select id="actor-select" aria-label="Switch simulated actor">${state.users.map((candidate) => `<option value="${e(candidate.id)}" ${candidate.id === user.id ? 'selected' : ''}>${e(candidate.name)} — ${e(candidate.role)}</option>`).join('')}</select></div>
        <div class="sidebar-utility">${button('Reset Demo Data', 'reset-demo', { kind: 'quiet' })}<span>Restores the canonical fixture</span></div>
      </div>
    </aside>
    <main class="main-content"><div class="topbar"><span class="breadcrumb">Budget Execution <span>/</span> ${page === 'overview' ? 'Overview' : page === 'project' ? 'Ramadan Campaign' : 'Request Workspace'}</span><span class="topbar-context">${e(user.name)} · ${e(user.role)}</span></div>${content}</main>
    <div class="sr-only" aria-live="polite">${e(toast)}</div>
    ${modal ? renderModal() : ''}
  </div>`;
}

function navButton(target, label, icon, count = 0) {
  return `<button class="nav-button ${page === target ? 'active' : ''}" data-page="${e(target)}"><span class="nav-icon" aria-hidden="true">${icon}</span><span>${e(label)}</span>${count ? `<span class="nav-count">${count}</span>` : ''}</button>`;
}

function renderOverview() {
  const report = deriveCompanyReport(state);
  const projectReport = deriveProjectReport(state, 'project-ramadan-campaign');
  return pageHeader('Overview · FY2027', 'Budget position', 'A traceable view of approved authority, project reservations, and confirmed external spend.', button('New Request', 'open-new-request', { kind: 'primary' })) + `<section class="position-strip" aria-labelledby="position-title"><div class="section-heading"><div><span class="eyebrow">Company position</span><h2 id="position-title">Every rupiah keeps its classification</h2></div><span class="definition">Amounts are derived from budgets, allocations, requests, and payment records.</span></div><div class="metric-grid">${metric('Approved Budget', compact(report.approvedBudget), 'FY2027 company authority')}${metric('Allocated to Projects', compact(report.allocatedToProjects), 'Reserved project authority')}${metric('Department Unallocated Budget', compact(report.departmentUnallocatedBudget), 'Budget lines not reserved to projects')}${metric('Approved unpaid commitments', compact(report.approvedUnpaidCommitments), 'Finance-approved, not confirmed paid', 'amber')}${metric('Payment-confirmed spend', compact(report.paymentConfirmedSpend), 'Externally paid and recorded', 'teal')}</div></section>
    <section class="ruled-section"><div class="section-heading"><div><span class="eyebrow">Department summary</span><h2>Budget ownership at a glance</h2></div><span class="definition">Department Unallocated Budget is a reporting total, not a selectable Funding Source.</span></div><div class="table-wrap"><table><thead><tr><th>Department</th><th class="align-right">Approved Budget</th><th class="align-right">Allocated to Projects</th><th class="align-right">Department Unallocated Budget</th><th class="align-right">Approved unpaid</th><th class="align-right">Payment-confirmed spend</th></tr></thead><tbody>${report.departments.map((row) => `<tr><th scope="row">${e(row.department.name)}${row.department.id === 'technology' ? '<span class="table-note">Primary demo department</span>' : ''}</th><td class="align-right">${full(row.approvedBudget)}</td><td class="align-right">${full(row.allocatedToProjects)}</td><td class="align-right">${full(row.departmentUnallocatedBudget)}</td><td class="align-right ${row.approvedUnpaidCommitments ? 'value-amber' : ''}">${full(row.approvedUnpaidCommitments)}</td><td class="align-right ${row.paymentConfirmedSpend ? 'value-teal' : ''}">${full(row.paymentConfirmedSpend)}</td></tr>`).join('')}</tbody></table></div></section>
    <section class="project-entry" data-page="project" tabindex="0" role="link"><div class="project-marker">R</div><div class="project-entry-copy"><span class="eyebrow">Project allocation · ${e(projectReport.project.status)}</span><h2>Ramadan Campaign</h2><p>${e(projectReport.project.ownerName)} · ${dateLabel(projectReport.project.startDate)} — ${dateLabel(projectReport.project.endDate)}</p></div><div class="project-entry-total"><span>Total Project Allocation</span><strong>${compact(projectReport.allocationAmount)}</strong><span>${compact(projectReport.availableToCommit)} available to commit</span></div><span class="arrow" aria-hidden="true">→</span></section>`;
}

function renderProject() {
  const report = deriveProjectReport(state, 'project-ramadan-campaign');
  const projectRequests = state.requests.filter((request) => getProjectForRequest(state, request)?.id === report.project.id);
  return pageHeader('Project Detail · cross-department control', 'Ramadan Campaign', `${report.project.ownerName} · ${dateLabel(report.project.startDate)} — ${dateLabel(report.project.endDate)} · ${report.project.status}`, button('New Request', 'open-project-request', { kind: 'primary' })) + `<section class="project-hero"><div class="project-hero-title"><span class="project-marker large">R</span><div><span class="eyebrow">Project Allocation</span><h2>${e(report.project.name)}</h2><p>One project view, four department owners, one derived financial position.</p></div></div><div class="equation"><div><span>Project Allocation</span><strong>${compact(report.allocationAmount)}</strong></div><span class="operator">−</span><div><span>Approved unpaid commitments</span><strong class="value-amber">${compact(report.approvedUnpaidCommitments)}</strong></div><span class="operator">−</span><div><span>Payment-confirmed spend</span><strong class="value-teal">${compact(report.paymentConfirmedSpend)}</strong></div><span class="operator">=</span><div class="equation-result"><span>Available to commit</span><strong>${compact(report.availableToCommit)}</strong></div></div></section>
    <section class="ruled-section"><div class="section-heading"><div><span class="eyebrow">Funding Sources</span><h2>Department allocations</h2></div><span class="definition">Selecting an allocation keeps its Budget Line and ownership visible.</span></div><div class="table-wrap"><table><thead><tr><th>Department</th><th>Budget Line</th><th class="align-right">Project Allocation</th><th class="align-right">Approved unpaid</th><th class="align-right">Payment-confirmed spend</th><th class="align-right">Available to commit</th></tr></thead><tbody>${report.allocations.map((row) => `<tr class="${row.departmentId === 'technology' ? 'highlight-row' : ''}"><th scope="row">${e(getDepartment(state, row.departmentId).name)}${row.departmentId === 'technology' ? '<span class="table-note">Selected demo path</span>' : ''}</th><td>${e(row.budgetLine.name)}</td><td class="align-right">${full(row.metrics.sourceAmount)}</td><td class="align-right ${row.metrics.approvedUnpaidCommitments ? 'value-amber' : ''}">${full(row.metrics.approvedUnpaidCommitments)}</td><td class="align-right ${row.metrics.paymentConfirmedSpend ? 'value-teal' : ''}">${full(row.metrics.paymentConfirmedSpend)}</td><td class="align-right strong-number">${full(row.metrics.availableToCommit)}</td></tr>`).join('')}</tbody></table></div></section>
    <section class="ruled-section"><div class="section-heading"><div><span class="eyebrow">Related requests</span><h2>Requests charged to Ramadan Campaign</h2></div><button class="text-button" data-page="workspace">Open Request Workspace →</button></div>${projectRequests.length ? `<div class="request-mini-list">${projectRequests.map((request) => requestRow(request, false)).join('')}</div>` : '<p class="empty-state">No requests have been submitted against this project yet.</p>'}</section>`;
}

function requestRow(request, selectable = true) {
  const next = getActiveApproval(state, request);
  const requester = getUser(state, request.requesterId);
  const project = getProjectForRequest(state, request);
  const attrs = selectable ? `data-action="select-request" data-request-id="${e(request.id)}"` : '';
  return `<div class="request-row" ${attrs} tabindex="${selectable ? '0' : '-1'}"><div class="request-row-main"><span class="request-id">${e(request.id)}</span><strong>${e(request.title)}</strong><span>${e(requester.name)} · ${e(request.vendorName)}</span></div><div class="request-row-context">${project ? `<span>${e(project.name)}</span>` : '<span>Non-project · Budget Line</span>'}<span class="row-amount">${compact(request.requestedAmount)}</span></div><div class="request-row-status">${statusBadge(request.status)}<span>${next ? `Next: ${e(next.actor?.role ?? next.role)}` : request.status === STATUS.PAYMENT_CONFIRMED ? 'Closed' : 'Terminal'}</span></div></div>`;
}

function renderWorkspace() {
  const user = activeUser();
  const visible = getVisibleRequests(state, user.id);
  let filtered = visible;
  if (workspaceTab === 'approvals') filtered = visible.filter((request) => getActiveApproval(state, request)?.actorId === user.id);
  if (workspaceTab === 'payment') filtered = visible.filter((request) => request.status === STATUS.APPROVED_AWAITING_PAYMENT);
  const selected = filtered.find((request) => request.id === selectedRequestId) ?? filtered[0] ?? visible.find((request) => request.id === selectedRequestId);
  selectedRequestId = selected?.id;
  return pageHeader('Request Workspace · role-owned work', 'Request Workspace', `The current view reflects ${user.name} acting as ${user.role}.`, button('New Request', 'open-new-request', { kind: 'primary' })) + `<section class="workspace-shell"><div class="workspace-list"><div class="tabs" role="tablist"><button class="tab ${workspaceTab === 'all' ? 'active' : ''}" data-tab="all" role="tab">All Requests <span>${getQueueCounts(state, user.id).all}</span></button><button class="tab ${workspaceTab === 'approvals' ? 'active' : ''}" data-tab="approvals" role="tab">My Approvals <span>${getQueueCounts(state, user.id).myApprovals}</span></button><button class="tab ${workspaceTab === 'payment' ? 'active' : ''}" data-tab="payment" role="tab">Awaiting Payment Confirmation <span>${getQueueCounts(state, user.id).awaitingPayment}</span></button></div><div class="list-caption"><span>${filtered.length} visible record${filtered.length === 1 ? '' : 's'}</span><span class="mono">${e(user.role)}</span></div>${filtered.length ? filtered.map((request) => requestRow(request)).join('') : '<div class="empty-state"><strong>No work in this queue</strong><span>Switch the simulated actor or tab to inspect another responsibility.</span></div>'}</div><div class="workspace-detail">${selected ? renderRequestDetail(selected) : '<div class="detail-empty"><span class="detail-empty-mark">◎</span><h2>Select a request</h2><p>Choose a request from the list to inspect its chain of custody.</p></div>'}</div></section>`;
}

function renderRequestDetail(request) {
  const requester = getUser(state, request.requesterId);
  const budgetLine = getBudgetLine(state, request.budgetLineId);
  const project = getProjectForRequest(state, request);
  const pending = getActiveApproval(state, request);
  const source = { type: request.fundingSourceType, id: request.fundingSourceType === FUNDING_SOURCE.PROJECT_ALLOCATION ? request.projectAllocationId : request.budgetLineId };
  const metrics = deriveFundingSourceMetrics(state, source);
  const preview = request.status === STATUS.AWAITING_FINANCE ? getFinanceImpactPreview(state, request.id) : null;
  const payment = state.payments.find((item) => item.expenseRequestId === request.id);
  const canApprove = pending && pending.actorId === activeUserId;
  const canPay = activeUser().role === ROLE.FINANCE_PAYMENT_PROCESSOR && request.status === STATUS.APPROVED_AWAITING_PAYMENT;
  const history = state.activityEvents.filter((event) => event.expenseRequestId === request.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const actionHint = pending && !canApprove ? `Available to ${e(pending.actor?.role ?? pending.role)} at this stage.` : activeUser().role === ROLE.EXECUTIVE_VIEWER ? 'Executive Viewer access is read-only.' : '';
  return `<div class="detail-header"><div><span class="request-id">${e(request.id)}</span><h2>${e(request.title)}</h2><p>${e(request.vendorName)} · required ${dateLabel(request.requiredDate)}</p></div><div class="detail-header-status">${statusBadge(request.status)}<span>${pending ? `Next responsible: ${e(pending.actor?.name ?? pending.role)}` : request.status === STATUS.APPROVED_AWAITING_PAYMENT ? 'Awaiting external payment evidence' : 'No next action'}</span></div></div>
    ${renderStatusLane(request)}
    <div class="action-bar">${canApprove ? button(request.status === STATUS.AWAITING_FINANCE ? 'Approve Finance commitment' : 'Approve request', 'open-approve', { kind: 'primary', extra: `data-request-id="${e(request.id)}"` }) + button('Reject request', 'open-reject', { kind: 'danger', extra: `data-request-id="${e(request.id)}"` }) : request.status === STATUS.APPROVED_AWAITING_PAYMENT && !canPay ? button('Record Payment', 'noop', { disabled: true, extra: 'aria-describedby="action-hint"' }) : canPay ? button('Record Payment', 'open-payment', { kind: 'primary', extra: `data-request-id="${e(request.id)}"` }) : '<span class="action-placeholder">No action required from this role</span>'}<span id="action-hint" class="action-hint">${e(actionHint)}</span></div>
    <section class="detail-section"><div class="section-heading compact-heading"><h3>Request facts</h3><span class="definition">Submitted requests are locked in the initial cut.</span></div><div class="facts-grid"><div><span>Requester</span><strong>${e(requester.name)}</strong><small>${e(getDepartment(state, requester.departmentId).name)}</small></div><div><span>Line Manager</span><strong>${e(getUser(state, request.lineManagerApproverId).name)}</strong><small>Business need approval</small></div><div><span>Department Budget Owner</span><strong>${e(getUser(state, request.budgetOwnerApproverId).name)}</strong><small>Funding Source authorization</small></div><div><span>Funding Source</span><strong>${project ? 'Project Allocation' : 'Budget Line Unallocated Balance'}</strong><small>${e(project ? project.name : budgetLine.name)} · ${e(budgetLine.name)}</small></div><div><span>Requested amount</span><strong class="money-large">${full(request.requestedAmount)}</strong><small>Integer rupiah · all-or-nothing approval</small></div><div><span>Business justification</span><strong class="fact-copy">${e(request.justification)}</strong></div></div></section>
    <section class="detail-section"><div class="section-heading compact-heading"><h3>Budget impact</h3><span class="definition">${e(project ? 'Project Allocation' : 'Budget Line Unallocated Balance')} · current values derive from shared records</span></div>${preview ? `<div class="impact-preview"><div><span>Funding Source amount</span><strong>${full(preview.sourceAmount)}</strong></div><div><span>Current Approved unpaid commitments</span><strong class="value-amber">${full(preview.approvedUnpaidCommitments)}</strong></div><div><span>Current Payment-confirmed spend</span><strong class="value-teal">${full(preview.paymentConfirmedSpend)}</strong></div><div><span>Current Available to commit</span><strong>${full(preview.availableToCommit)}</strong></div><div class="impact-delta"><span>Request amount</span><strong>− ${full(preview.requestAmount)}</strong></div><div class="impact-result"><span>Projected Available to commit</span><strong>${full(preview.projectedAvailableToCommit)}</strong></div></div>${preview.projectedUtilization >= 0.8 ? '<p class="warning-note"><span aria-hidden="true">!</span>Projected utilization reaches 80% of this Funding Source. Finance approval remains available after the impact review.</p>' : ''}` : `<div class="impact-inline"><div><span>Funding Source amount</span><strong>${full(metrics.sourceAmount)}</strong></div><div><span>Approved unpaid commitments</span><strong class="value-amber">${full(metrics.approvedUnpaidCommitments)}</strong></div><div><span>Payment-confirmed spend</span><strong class="value-teal">${full(metrics.paymentConfirmedSpend)}</strong></div><div><span>Available to commit</span><strong>${full(metrics.availableToCommit)}</strong></div></div>`}</section>
    ${payment ? `<section class="detail-section"><div class="section-heading compact-heading"><h3>Payment Information</h3><span class="definition">Read-only after Payment Confirmation · external payment system</span></div><div class="payment-info"><div><span>Payment status</span><strong class="value-teal">Payment Confirmed</strong></div><div><span>Confirmed amount</span><strong>${full(payment.confirmedAmount)}</strong></div><div><span>Payment date</span><strong>${dateLabel(payment.paymentDate)}</strong></div><div><span>Beneficiary</span><strong>${e(payment.beneficiaryName)}</strong></div><div><span>Destination bank</span><strong>${e(payment.destinationBank)}</strong></div><div><span>Transfer reference</span><strong class="mono">${e(payment.transferReference)}</strong></div><div><span>Processed by</span><strong>${e(getUser(state, payment.processedByUserId).name)}</strong><small>${timeLabel(payment.confirmedAt)}</small></div><div><span>Transfer proof metadata</span><strong>${e(payment.transferProofFileName)}</strong><small>${e(payment.transferProofFileType)} · ${formatBytes(payment.transferProofFileSize)}</small></div></div></section>` : request.status === STATUS.APPROVED_AWAITING_PAYMENT ? `<section class="detail-section payment-awaiting"><div><span class="eyebrow">Payment Information</span><h3>Awaiting Payment Confirmation</h3><p>The approved amount is locked at ${full(request.approvedAmount)}. Finance Payment Processor records external evidence here; this product does not execute the transfer.</p></div>${canPay ? button('Record Payment', 'open-payment', { kind: 'secondary', extra: `data-request-id="${e(request.id)}"` }) : ''}</section>` : ''}
    <section class="detail-section"><div class="section-heading compact-heading"><h3>Activity History</h3><span class="definition">Immutable meaningful business events only</span></div><div class="history">${history.map((event) => renderEvent(event)).join('')}</div></section>`;
}

function renderStatusLane(request) {
  const statuses = [STATUS.AWAITING_LINE_MANAGER, STATUS.AWAITING_BUDGET_OWNER, STATUS.AWAITING_FINANCE, STATUS.APPROVED_AWAITING_PAYMENT, STATUS.PAYMENT_CONFIRMED];
  if (request.status === STATUS.REJECTED) return `<div class="status-lane status-lane-rejected"><span class="lane-step active"><span class="lane-dot">×</span><span><strong>Rejected</strong><small>Terminal decision · no financial effect</small></span></span></div>`;
  const currentIndex = statuses.indexOf(request.status);
  return `<div class="status-lane" aria-label="Request status progression">${statuses.map((status, index) => `<span class="lane-step ${index < currentIndex ? 'complete' : ''} ${index === currentIndex ? 'active' : ''}"><span class="lane-dot">${index < currentIndex ? '✓' : index + 1}</span><span><strong>${e(status)}</strong><small>${index === currentIndex ? 'Current classification' : index < currentIndex ? 'Completed' : 'Upcoming stage'}</small></span></span>${index < statuses.length - 1 ? '<span class="lane-connector"></span>' : ''}`).join('')}</div>`;
}

function renderEvent(event) {
  const actor = getEventActor(state, event);
  const metadata = event.metadata || {};
  return `<article class="history-event"><div class="history-line"><span class="history-dot"></span></div><div class="history-event-body"><div class="history-event-top"><strong>${e(event.eventType)}</strong><time>${timeLabel(event.timestamp)}</time></div><p>${e(actor?.name ?? event.actorId)} · ${e(event.actorRole)}</p>${event.comment ? `<div class="event-comment">“${e(event.comment)}”</div>` : ''}${event.eventType === EVENT_TYPE.PAYMENT_CONFIRMED ? `<div class="event-meta">${full(metadata.amount)} · ${e(metadata.bank)} · <span class="mono">${e(metadata.reference)}</span> · ${e(metadata.proofFileName)}</div>` : ''}</div></article>`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderModal() {
  if (modal.type === 'new-request') return renderNewRequestModal();
  if (modal.type === 'approve') return renderApproveModal();
  if (modal.type === 'reject') return renderRejectModal();
  if (modal.type === 'payment') return renderPaymentModal();
  return '';
}

function modalShell(title, description, body, footer) {
  return `<div class="modal-backdrop" data-action="close-modal"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" data-modal-content><div class="modal-header"><div><span class="eyebrow">Focused decision</span><h2 id="modal-title">${e(title)}</h2><p>${e(description)}</p></div><button class="icon-button" data-action="close-modal" aria-label="Close dialog">×</button></div>${body}<div class="modal-footer">${footer}</div></div></div>`;
}

function renderNewRequestModal() {
  const user = activeUser();
  const canCreate = user.role === ROLE.REQUESTER;
  const type = newRequestDraft?.fundingSourceType ?? FUNDING_SOURCE.PROJECT_ALLOCATION;
  const options = canCreate ? getFundingSourcesForRequester(state, user.id, type) : [];
  const sourceId = newRequestDraft?.sourceId ?? options[0]?.id;
  const selected = options.find((option) => option.id === sourceId) ?? options[0];
  const selectedMetrics = selected?.metrics;
  const error = (field) => formErrors[field] ? `<span class="field-error" id="${field}-error">${e(formErrors[field])}</span>` : '';
  const input = (field, label, placeholder, type = 'text', extra = '') => `<label class="field ${formErrors[field] ? 'has-error' : ''}" for="new-${field}"><span>${e(label)}</span><input id="new-${field}" name="${e(field)}" type="${type}" value="${e(newRequestDraft?.[field] ?? '')}" placeholder="${e(placeholder)}" aria-describedby="${field}-help ${field}-error" ${extra}/>${error(field)}<small id="${field}-help">${field === 'requestedAmount' ? 'Use integer rupiah.' : ''}</small></label>`;
  return modalShell('New Expense Request', canCreate ? 'Make one Funding Source, its owner, and its approval chain explicit.' : 'Request creation is available to Requester roles only.', `<form id="new-request-form" class="form-body"><div class="form-context"><span class="eyebrow">Current actor</span><strong>${e(user.name)}</strong><span>${e(user.role)} · ${e(getDepartment(state, user.departmentId).name)}</span></div>${!canCreate ? '<p class="warning-note"><span>!</span>Switch to the Technology Requester to create a request. Other roles can inspect the saved workflow.</p>' : `<fieldset><legend>Funding Source</legend><div class="segmented"><label><input type="radio" name="fundingSourceType" value="PROJECT_ALLOCATION" ${type === FUNDING_SOURCE.PROJECT_ALLOCATION ? 'checked' : ''}/> <span>Project Allocation</span></label><label><input type="radio" name="fundingSourceType" value="BUDGET_LINE_UNALLOCATED" ${type === FUNDING_SOURCE.BUDGET_LINE_UNALLOCATED ? 'checked' : ''}/> <span>Budget Line Unallocated Balance</span></label></div><label class="field" for="new-source"><span>${type === FUNDING_SOURCE.PROJECT_ALLOCATION ? 'Project Allocation' : 'Budget Line'}</span><select id="new-source" name="sourceId" ${options.length ? '' : 'disabled'}>${options.map((option) => `<option value="${e(option.id)}" ${option.id === sourceId ? 'selected' : ''}>${e(type === FUNDING_SOURCE.PROJECT_ALLOCATION ? `${option.project.name} · ${option.budgetLine.name} · ${compact(option.allocatedAmount)}` : `${option.name} · ${compact(option.metrics.availableToCommit)} available`)}</option>`).join('')}</select>${error('sourceId')}<small>Only Funding Sources owned by your department are selectable.</small></label>${selected ? `<div class="derived-context"><div><span>Derived department</span><strong>${e(getDepartment(state, user.departmentId).name)}</strong></div><div><span>Budget Line</span><strong>${e(type === FUNDING_SOURCE.PROJECT_ALLOCATION ? selected.budgetLine.name : selected.name)}</strong></div><div><span>Current Available to commit</span><strong>${full(selectedMetrics.availableToCommit)}</strong></div>${type === FUNDING_SOURCE.PROJECT_ALLOCATION ? `<div><span>Project</span><strong>${e(selected.project.name)}</strong></div>` : '<div><span>Project</span><strong>None · non-project</strong></div>'}</div>` : ''}</fieldset><div class="form-grid">${input('title', 'Title', 'e.g. Ramadan microsite development')}${input('vendorName', 'Vendor or recipient', 'e.g. Digital Studio Indonesia')}${input('requestedAmount', 'Requested amount', '150000000', 'number', 'min="1" step="1"')}${input('requiredDate', 'Required date', '', 'date')}</div><label class="field ${formErrors.justification ? 'has-error' : ''}" for="new-justification"><span>Business justification</span><textarea id="new-justification" name="justification" rows="3" placeholder="Explain the business need and timing." aria-describedby="justification-error">${e(newRequestDraft?.justification ?? '')}</textarea>${error('justification')}</label>${formError ? `<p class="form-error" role="alert">${e(formError)}</p>` : ''}</form>`}${canCreate ? button('Cancel', 'close-modal', { kind: 'quiet' }) + button('Submit Request', 'submit-new-request', { kind: 'primary', extra: 'form="new-request-form"', type: 'submit' }) : button('Close', 'close-modal', { kind: 'primary' })}`);
}

function renderApproveModal() {
  const request = state.requests.find((item) => item.id === modal.requestId);
  const preview = request && request.status === STATUS.AWAITING_FINANCE ? getFinanceImpactPreview(state, request.id) : null;
  return modalShell('Approve request', preview ? 'Finance approval creates an approved unpaid commitment after a fresh availability check.' : 'Confirm the current approval stage and move the request to its next responsible actor.', `<div class="confirmation-copy"><div class="confirmation-request"><span class="request-id">${e(request.id)}</span><strong>${e(request.title)}</strong><span>${statusBadge(request.status)}</span></div>${preview ? `<div class="impact-preview modal-impact"><div><span>Funding Source amount</span><strong>${full(preview.sourceAmount)}</strong></div><div><span>Approved unpaid commitments</span><strong class="value-amber">${full(preview.approvedUnpaidCommitments)}</strong></div><div><span>Payment-confirmed spend</span><strong class="value-teal">${full(preview.paymentConfirmedSpend)}</strong></div><div><span>Current Available to commit</span><strong>${full(preview.availableToCommit)}</strong></div><div class="impact-delta"><span>Applied request amount</span><strong>− ${full(preview.requestAmount)}</strong></div><div class="impact-result"><span>Projected Available to commit</span><strong>${full(preview.projectedAvailableToCommit)}</strong></div></div><p class="confirmation-note">After approval: ${full(preview.requestAmount)} becomes an Approved unpaid commitment. Payment is not executed or confirmed here.</p>` : '<p class="confirmation-note">This approval changes business authorization only. It has no financial effect until Finance approval.</p>'}</div>`, button('Cancel', 'close-modal', { kind: 'quiet' }) + button(preview ? 'Create commitment' : 'Approve request', 'confirm-approve', { kind: 'primary', extra: `data-request-id="${e(request.id)}"` }));
}

function renderRejectModal() {
  const request = state.requests.find((item) => item.id === modal.requestId);
  return modalShell('Reject request', 'Rejection is terminal. A reason is required and will be retained in Activity History.', `<form id="reject-form" class="form-body"><div class="confirmation-request"><span class="request-id">${e(request.id)}</span><strong>${e(request.title)}</strong>${statusBadge(request.status)}</div><label class="field ${formErrors.reason ? 'has-error' : ''}" for="reject-reason"><span>Reason for rejection</span><textarea id="reject-reason" name="reason" rows="4" placeholder="Write the decision context for the requester." aria-describedby="reason-error">${e(rejectDraft.reason)}</textarea>${formErrors.reason ? `<span class="field-error" id="reason-error">${e(formErrors.reason)}</span>` : ''}</label>${formError ? `<p class="form-error" role="alert">${e(formError)}</p>` : ''}</form>`, button('Keep request', 'close-modal', { kind: 'quiet' }) + button('Reject request', 'confirm-reject', { kind: 'danger', extra: `data-request-id="${e(request.id)}" form="reject-form"` }));
}

function renderPaymentModal() {
  const request = state.requests.find((item) => item.id === modal.requestId);
  const proof = paymentDraft.proof;
  const error = (field) => formErrors[field] ? `<span class="field-error" id="payment-${field}-error">${e(formErrors[field])}</span>` : '';
  return modalShell('Record Payment', 'Record evidence of a Bank Transfer completed outside Budget Execution. The approved amount is locked.', `<form id="payment-form" class="form-body"><div class="payment-summary"><div><span class="request-id">${e(request.id)}</span><strong>${e(request.title)}</strong></div><div><span>Locked approved amount</span><strong class="money-large">${full(request.approvedAmount)}</strong></div></div><div class="form-grid">${paymentField('paymentDate', 'Payment date', 'date')}${paymentField('beneficiaryName', 'Beneficiary', 'text', 'Digital Studio Indonesia')}${paymentField('destinationBank', 'Destination bank', 'text', 'Bank Syariah Indonesia')}${paymentField('transferReference', 'Transfer reference', 'text', 'TRX-20270218-8491')}</div><div class="proof-upload ${formErrors.proof ? 'has-error' : ''}"><div><span class="field-label">Transfer proof</span><p>PDF, PNG, JPG, or JPEG · maximum 5 MB · metadata only</p></div><label class="upload-button"><input id="payment-proof" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"/>${proof ? 'Replace file' : 'Select file'}</label>${proof ? `<div class="proof-meta"><strong>${e(proof.name)}</strong><span>${e(proof.type || 'Unknown type')} · ${formatBytes(proof.size)}</span><button class="text-button" data-action="remove-proof">Remove</button></div>` : ''}${error('proof')}</div><div class="confirmation-note payment-note">This action will reclassify ${full(request.approvedAmount)} from Approved unpaid commitments to Payment-confirmed spend. Available to commit remains unchanged.</div>${formError ? `<p class="form-error" role="alert">${e(formError)}</p>` : ''}</form>`, button('Cancel', 'close-modal', { kind: 'quiet' }) + button('Confirm Payment', 'confirm-payment', { kind: 'primary', extra: `data-request-id="${e(request.id)}" form="payment-form"` }));
}

function paymentField(field, label, type, placeholder = '') {
  const error = formErrors[field] ? `<span class="field-error" id="payment-${field}-error">${e(formErrors[field])}</span>` : '';
  return `<label class="field ${formErrors[field] ? 'has-error' : ''}" for="payment-${field}"><span>${e(label)}</span><input id="payment-${field}" name="${e(field)}" type="${e(type)}" value="${e(paymentDraft[field] ?? '')}" placeholder="${e(placeholder)}" aria-describedby="payment-${field}-error"/>${error}</label>`;
}

function validateNewDraft() {
  const errors = {};
  if (!newRequestDraft.title?.trim()) errors.title = 'Title is required.';
  if (!newRequestDraft.vendorName?.trim()) errors.vendorName = 'Vendor or recipient is required.';
  if (!Number.isInteger(Number(newRequestDraft.requestedAmount)) || Number(newRequestDraft.requestedAmount) <= 0) errors.requestedAmount = 'Enter an amount greater than zero.';
  if (!newRequestDraft.requiredDate) errors.requiredDate = 'Required date is required.';
  if (!newRequestDraft.justification?.trim()) errors.justification = 'Business justification is required.';
  if (!newRequestDraft.sourceId) errors.sourceId = 'Select a valid Funding Source.';
  return errors;
}

function validatePaymentDraft() {
  const errors = {};
  if (!paymentDraft.paymentDate) errors.paymentDate = 'Payment date is required.';
  if (!paymentDraft.beneficiaryName?.trim()) errors.beneficiaryName = 'Beneficiary is required.';
  if (!paymentDraft.destinationBank?.trim()) errors.destinationBank = 'Destination bank is required.';
  if (!paymentDraft.transferReference?.trim()) errors.transferReference = 'Transfer reference is required.';
  if (!paymentDraft.proof) errors.proof = 'A valid transfer-proof file is required.';
  return errors;
}

function openNewRequest(prefill = {}) {
  formError = ''; formErrors = {};
  newRequestDraft = { title: '', vendorName: '', requestedAmount: '', requiredDate: '', justification: '', fundingSourceType: FUNDING_SOURCE.PROJECT_ALLOCATION, sourceId: '', ...prefill };
  const options = activeUser().role === ROLE.REQUESTER ? getFundingSourcesForRequester(state, activeUserId, newRequestDraft.fundingSourceType) : [];
  if (!newRequestDraft.sourceId) newRequestDraft.sourceId = options[0]?.id ?? '';
  modal = { type: 'new-request' }; render();
}

function syncFormFromDOM(form) {
  const data = new FormData(form);
  const values = Object.fromEntries(data.entries());
  if (form.id === 'new-request-form') newRequestDraft = { ...newRequestDraft, ...values, fundingSourceType: values.fundingSourceType, sourceId: values.sourceId, requestedAmount: values.requestedAmount ? Number(values.requestedAmount) : '' };
  if (form.id === 'reject-form') rejectDraft.reason = values.reason || '';
  if (form.id === 'payment-form') paymentDraft = { ...paymentDraft, ...values };
}

function handleAction(action, element) {
  if (action === 'close-modal') { modal = null; formError = ''; formErrors = {}; render(); return; }
  if (action === 'reset-demo') { if (window.confirm('Reset Demo Data to the canonical FY2027 fixture?')) { state = resetState(); activeUserId = 'user-finance-reviewer'; page = 'overview'; selectedRequestId = state.requests[0].id; notify('Demo data restored to the canonical fixture.'); } return; }
  if (action === 'open-new-request') { openNewRequest(); return; }
  if (action === 'open-project-request') { openNewRequest({ sourceId: 'allocation-technology-ramadan', fundingSourceType: FUNDING_SOURCE.PROJECT_ALLOCATION }); return; }
  if (action === 'select-request') { selectedRequestId = element.dataset.requestId; page = 'workspace'; render(); return; }
  if (action === 'open-approve') { formError = ''; modal = { type: 'approve', requestId: element.dataset.requestId }; render(); return; }
  if (action === 'confirm-approve') { try { approveRequest(state, element.dataset.requestId, activeUserId); saveState(state); modal = null; notify('Approval recorded. The request now belongs to its next responsible actor.'); } catch (error) { formError = error.message; } render(); return; }
  if (action === 'open-reject') { formError = ''; formErrors = {}; rejectDraft = { reason: '' }; modal = { type: 'reject', requestId: element.dataset.requestId }; render(); return; }
  if (action === 'confirm-reject') { const requestId = element.dataset.requestId; const errors = !rejectDraft.reason.trim() ? { reason: 'A rejection reason is required.' } : {}; if (Object.keys(errors).length) { formErrors = errors; render(); return; } try { rejectRequest(state, requestId, activeUserId, rejectDraft.reason); saveState(state); modal = null; notify('Request rejected and recorded in Activity History.'); } catch (error) { formError = error.message; } render(); return; }
  if (action === 'open-payment') { formError = ''; formErrors = {}; paymentDraft = { paymentDate: '2027-02-18', beneficiaryName: '', destinationBank: '', transferReference: '', proof: null }; modal = { type: 'payment', requestId: element.dataset.requestId }; render(); return; }
  if (action === 'remove-proof') { paymentDraft.proof = null; formErrors.proof = ''; render(); return; }
  if (action === 'confirm-payment') { const errors = validatePaymentDraft(); if (Object.keys(errors).length) { formErrors = errors; render(); return; } try { confirmPayment(state, element.dataset.requestId, activeUserId, paymentDraft); saveState(state); modal = null; notify('Payment confirmed. Commitment reclassified without reducing availability twice.'); } catch (error) { formError = error.message; } render(); return; }
}

root.addEventListener('click', (event) => {
  const pageTarget = event.target.closest('[data-page]');
  if (pageTarget) { page = pageTarget.dataset.page; if (page === 'workspace' && !selectedRequestId) selectedRequestId = getVisibleRequests(state, activeUserId)[0]?.id; render(); return; }
  const tab = event.target.closest('[data-tab]');
  if (tab) { workspaceTab = tab.dataset.tab; render(); return; }
  const target = event.target.closest('[data-action]');
  if (target) handleAction(target.dataset.action, target);
});

root.addEventListener('change', (event) => {
  if (event.target.id === 'actor-select') { activeUserId = event.target.value; const visible = getVisibleRequests(state, activeUserId); if (!visible.some((request) => request.id === selectedRequestId)) selectedRequestId = visible[0]?.id; notify(`Acting as ${getUser(state, activeUserId).name} · ${getUser(state, activeUserId).role}.`); return; }
  if (event.target.id === 'new-source') { newRequestDraft.sourceId = event.target.value; render(); return; }
  if (event.target.name === 'fundingSourceType') { newRequestDraft.fundingSourceType = event.target.value; const options = getFundingSourcesForRequester(state, activeUserId, event.target.value); newRequestDraft.sourceId = options[0]?.id ?? ''; render(); return; }
  if (event.target.id === 'payment-proof') { const file = event.target.files?.[0]; if (file) { paymentDraft.proof = { name: file.name, type: file.type, size: file.size }; formErrors.proof = ''; render(); } }
});

root.addEventListener('input', (event) => {
  if (!modal) return;
  const form = event.target.form;
  if (form?.id === 'new-request-form') { newRequestDraft[event.target.name] = event.target.name === 'requestedAmount' ? Number(event.target.value) : event.target.value; }
  if (form?.id === 'reject-form') rejectDraft.reason = event.target.value;
  if (form?.id === 'payment-form' && event.target.name) paymentDraft[event.target.name] = event.target.value;
});

root.addEventListener('submit', (event) => { event.preventDefault(); const form = event.target; syncFormFromDOM(form); if (form.id === 'new-request-form') { formErrors = validateNewDraft(); if (Object.keys(formErrors).length) { render(); return; } try { const request = createRequest(state, { actorId: activeUserId, ...newRequestDraft, requestedAmount: Number(newRequestDraft.requestedAmount), projectAllocationId: newRequestDraft.fundingSourceType === FUNDING_SOURCE.PROJECT_ALLOCATION ? newRequestDraft.sourceId : undefined, budgetLineId: newRequestDraft.fundingSourceType === FUNDING_SOURCE.PROJECT_ALLOCATION ? getBudgetLine(state, newRequestDraft.sourceId ? state.allocations.find((item) => item.id === newRequestDraft.sourceId).budgetLineId : '').id : newRequestDraft.sourceId }); selectedRequestId = request.id; saveState(state); modal = null; page = 'workspace'; notify('Request submitted. Financial figures remain unchanged until Finance approval.'); } catch (error) { formError = error.message; } render(); } });

root.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  const pageTarget = event.target.closest('[data-page]');
  if (pageTarget && event.target.tagName !== 'BUTTON') { event.preventDefault(); page = pageTarget.dataset.page; render(); return; }
  const requestTarget = event.target.closest('[data-action="select-request"]');
  if (requestTarget) { event.preventDefault(); selectedRequestId = requestTarget.dataset.requestId; page = 'workspace'; render(); }
});

function render() {
  const content = page === 'project' ? renderProject() : page === 'workspace' ? renderWorkspace() : renderOverview();
  root.innerHTML = renderShell(content);
  if (modal) {
    const dialog = root.querySelector('[data-modal-content]');
    dialog?.querySelector('input, textarea, select, button')?.focus();
  }
}

render();
