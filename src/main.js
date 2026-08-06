import {
  STATUS,
  ROLE,
  PAGE,
  FUNDING_SOURCE,
  EVENT_TYPE,
  createInitialState,
  loadState,
  saveState,
  resetState,
  getUser,
  getDepartment,
  getBudgetLine,
  deriveOverviewReportForActor,
  deriveProjectReportForActor,
  deriveProjectsReportForActor,
  deriveFundingSourceMetrics,
  getProjectForRequest,
  getFinanceImpactPreview,
  getVisibleRequests,
  canActorActOnRequest,
  getActiveApproval,
  getQueueCounts,
  getDefaultPageForActor,
  getDefaultWorkspaceTab,
  canActorAccessPage,
  getFundingSourcesForRequester,
  getProjectAllocationForRequester,
  getEventActor,
  createRequest,
  approveRequest,
  rejectRequest,
  confirmPayment,
  validateProofMetadata,
  validateRequestedAmount,
  formatIDR,
} from './domain/store.js';

const root = document.querySelector('#root');
let state = loadState();
let activeUserId = 'user-finance-reviewer';
let page = getDefaultPageForActor(state, activeUserId);
let selectedProjectId = state.projects[0]?.id;
let workspaceTab = getDefaultWorkspaceTab(state, activeUserId);
let selectedRequestId = state.requests[0]?.id;
let modal = null;
let toast = '';
let formError = '';
let formErrors = {};
let lastFocusedElement = null;
let lastFocusedAction = '';
let modalFocusPending = false;
let focusTargetId = '';
let modalScrollTop = 0;
let newRequestDraft = null;
let rejectDraft = { reason: '' };
let paymentDraft = { paymentDate: '2027-02-18', beneficiaryName: '', destinationBank: '', transferReference: '', proof: null };
let selectedAllocationId = 'allocation-technology-ramadan';

const activeUser = () => getUser(state, activeUserId);
const e = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
const cleanModalMarkup = (value) => String(value ?? '').replace(/\b(?:undefined|null)\b/gi, '');
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
  return `<header class="page-header"><div><span class="kicker">${e(kicker)}</span><h1 id="page-title" tabindex="-1">${e(title)}</h1><p>${e(description)}</p></div>${action}</header>`;
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

function selectedProject() {
  return state.projects.find((project) => project.id === selectedProjectId) ?? state.projects[0] ?? null;
}

function normalizeViewState() {
  if (!canActorAccessPage(state, activeUserId, page)) page = getDefaultPageForActor(state, activeUserId);
  const visibleRequests = getVisibleRequests(state, activeUserId);
  if (!visibleRequests.some((request) => request.id === selectedRequestId)) selectedRequestId = visibleRequests[0]?.id;
  const visibleProjects = deriveProjectsReportForActor(state, activeUserId);
  if (!visibleProjects.some((report) => report.project.id === selectedProjectId)) selectedProjectId = visibleProjects[0]?.project.id;
}

function renderBreadcrumb() {
  if (page === PAGE.PROJECT) {
    const project = selectedProject();
    return `Budget Execution <span>/</span><button class="breadcrumb-link" data-page="projects">Projects</button><span>/</span><strong>${e(project?.name ?? 'Project Detail')}</strong>`;
  }
  const label = page === PAGE.OVERVIEW ? (activeUser().role === ROLE.BUDGET_OWNER ? 'Department Overview' : 'Overview') : page === PAGE.PROJECTS ? 'Projects' : 'Request Workspace';
  return `Budget Execution <span>/</span><strong>${e(label)}</strong>`;
}

function renderShell(content) {
  const user = activeUser();
  const counts = getQueueCounts(state, user.id);
  const backgroundState = modal ? 'inert aria-hidden="true"' : '';
  return `<div class="app-shell">
    <aside class="sidebar" ${backgroundState}>
      <div class="brand"><span class="brand-mark">BE</span><div><strong>Budget Execution</strong><span>Control room · ${e(state.company.financialYear)}</span></div></div>
      <nav aria-label="Primary navigation" class="primary-nav">
        <span class="nav-label">Workspace</span>
        ${canActorAccessPage(state, user.id, PAGE.OVERVIEW) ? navButton(PAGE.OVERVIEW, user.role === ROLE.BUDGET_OWNER ? 'Department Overview' : 'Overview', '⌂') : ''}
        ${canActorAccessPage(state, user.id, PAGE.PROJECTS) ? navButton(PAGE.PROJECTS, 'Projects', '◈') : ''}
        ${navButton(PAGE.WORKSPACE, 'Request Workspace', '≡', counts.myApprovals)}
      </nav>
      <div class="sidebar-foot">
        <div class="actor-card"><span class="nav-label">Simulated actor</span><strong>${e(user.name)}</strong><span>${e(user.role)}</span><select id="actor-select" aria-label="Switch simulated actor">${state.users.map((candidate) => `<option value="${e(candidate.id)}" ${candidate.id === user.id ? 'selected' : ''}>${e(candidate.name)} — ${e(candidate.role)}</option>`).join('')}</select></div>
        <div class="sidebar-utility">${button('Reset Demo Data', 'reset-demo', { kind: 'quiet' })}<span>Restores the canonical fixture</span></div>
      </div>
    </aside>
    <main class="main-content"><div class="topbar"><span class="breadcrumb">${renderBreadcrumb()}</span><span class="topbar-context">${e(user.name)} · ${e(user.role)}</span></div>${content}</main>
    <div class="sr-only" aria-live="polite">${e(toast)}</div>
    ${modal ? renderModal() : ''}
  </div>`;
}

function navButton(target, label, icon, count = 0) {
  const active = target === PAGE.PROJECTS ? page === PAGE.PROJECTS || page === PAGE.PROJECT : page === target;
  return `<button class="nav-button ${active ? 'active' : ''}" data-page="${e(target)}" ${active ? 'aria-current="page"' : ''}><span class="nav-icon" aria-hidden="true">${icon}</span><span>${e(label)}</span>${count ? `<span class="nav-count">${count}</span>` : ''}</button>`;
}

function requestAction(action = 'open-new-request') {
  if (activeUser().role !== ROLE.REQUESTER) return '';
  if (action === 'open-project-request' && !getProjectAllocationForRequester(state, selectedProjectId, activeUserId)) return '';
  return button('New Request', action, { kind: 'primary' });
}

function projectRequestAction() {
  return activeUser().role === ROLE.REQUESTER && getProjectAllocationForRequester(state, selectedProjectId, activeUserId)
    ? requestAction('open-project-request')
    : '';
}

function allocationRequestAction(allocationId) {
  const allocation = state.allocations.find((item) => item.id === allocationId);
  const departmentId = allocation ? getBudgetLine(state, allocation.budgetLineId)?.departmentBudgetId : '';
  const department = state.departmentBudgets.find((budget) => budget.id === departmentId)?.departmentId;
  const eligible = activeUser().role === ROLE.REQUESTER && getFundingSourcesForRequester(state, activeUserId, FUNDING_SOURCE.PROJECT_ALLOCATION).some((item) => item.id === allocationId);
  if (eligible) return `<button type="button" class="text-button allocation-request-link" data-action="open-allocation-request" data-allocation-id="${e(allocationId)}">Create request</button>`;
  if (activeUser().role === ROLE.REQUESTER && department) return `<span class="action-placeholder">Owned by ${e(getDepartment(state, department).name)}</span>`;
  return '<span class="action-placeholder">View only</span>';
}

function renderOverview() {
  const user = activeUser();
  const report = deriveOverviewReportForActor(state, user.id);
  const projectReport = deriveProjectsReportForActor(state, user.id)[0];
  const department = report?.scopeDepartmentId ? getDepartment(state, report.scopeDepartmentId) : null;
  const scopeName = department?.name ?? 'Company';
  const scopeLabel = report?.scope === 'department' ? `${scopeName} position` : 'Company position';
  const overviewTitle = report?.scope === 'department' ? `${scopeName} Overview · FY2027` : 'Overview · FY2027';
  const projectEntry = projectReport
    ? `<button type="button" class="project-entry" data-action="open-project" data-project-id="${e(projectReport.project.id)}" aria-label="Open ${e(projectReport.project.name)} project"><span class="project-marker">R</span><span class="project-entry-copy"><span class="eyebrow">Project allocation · ${e(projectReport.project.status)}</span><strong>${e(projectReport.project.name)}</strong><span>${e(projectReport.project.ownerName)} · ${dateLabel(projectReport.project.startDate)} — ${dateLabel(projectReport.project.endDate)}</span></span><span class="project-entry-total"><span>Total Project Allocation</span><strong>${compact(projectReport.allocationAmount)}</strong><span>${compact(projectReport.availableToCommit)} available to commit</span></span><span class="arrow" aria-hidden="true">→</span></button>`
    : '<section class="project-entry empty-state"><strong>No projects yet</strong><span>Project allocations will appear here when they are created.</span></section>';
  return pageHeader(overviewTitle, 'Budget position', 'A traceable view of approved authority, project reservations, and confirmed external spend.', '') + `<section class="position-strip" aria-labelledby="position-title"><div class="section-heading"><div><span class="eyebrow">${e(scopeLabel)}</span><h2 id="position-title">Every rupiah keeps its classification</h2></div><span class="definition">Amounts are derived from budgets, allocations, requests, and payment records.</span></div><div class="metric-grid">${metric('Approved Budget', compact(report.approvedBudget), `${scopeName} approved authority`)}${metric('Allocated to Projects', compact(report.allocatedToProjects), 'Reserved project authority')}${metric('Department Unallocated Budget', compact(report.departmentUnallocatedBudget), 'Budget lines not reserved to projects')}${metric('Approved unpaid commitments', compact(report.approvedUnpaidCommitments), 'Finance-approved, not confirmed paid', 'amber')}${metric('Payment-confirmed spend', compact(report.paymentConfirmedSpend), 'Externally paid and recorded', 'teal')}</div></section>
    <section class="ruled-section"><div class="section-heading"><div><span class="eyebrow">${report.scope === 'department' ? 'Department position' : 'Department summary'}</span><h2>Budget ownership at a glance</h2></div><span class="definition">Department Unallocated Budget is a reporting total, not a selectable Funding Source.</span></div><div class="table-wrap table-wrap-sticky-first"><div class="table-overflow-cue" role="note">Scroll for more columns <span aria-hidden="true">→</span></div><table><thead><tr><th>Department</th><th class="align-right">Approved Budget</th><th class="align-right">Allocated to Projects</th><th class="align-right">Department Unallocated Budget</th><th class="align-right">Approved unpaid</th><th class="align-right">Payment-confirmed spend</th></tr></thead><tbody>${report.departments.map((row) => `<tr><th scope="row">${e(row.department.name)}${row.department.id === 'technology' ? '<span class="table-note">Primary demo department</span>' : ''}</th><td class="align-right">${full(row.approvedBudget)}</td><td class="align-right">${full(row.allocatedToProjects)}</td><td class="align-right">${full(row.departmentUnallocatedBudget)}</td><td class="align-right ${row.approvedUnpaidCommitments ? 'value-amber' : ''}">${full(row.approvedUnpaidCommitments)}</td><td class="align-right ${row.paymentConfirmedSpend ? 'value-teal' : ''}">${full(row.paymentConfirmedSpend)}</td></tr>`).join('')}</tbody></table></div></section>
    <section class="ruled-section"><div class="section-heading"><div><span class="eyebrow">Project spotlight</span><h2>Follow a project allocation</h2></div><button class="text-button" data-page="projects">View all projects →</button></div>${projectEntry}</section>`;
}

function renderProjects() {
  const reports = deriveProjectsReportForActor(state, activeUserId);
  return pageHeader('Projects · cross-department control', 'Projects', 'Review project allocations, commitments, confirmed spend, and remaining authority in one place.', requestAction()) + `<section class="projects-page" aria-labelledby="projects-title"><div class="section-heading"><div><span class="eyebrow">Project portfolio</span><h2 id="projects-title">All projects</h2></div><span class="definition">Open a project to inspect its department allocations and related requests.</span></div>${reports.length ? `<div class="project-list">${reports.map((report) => `<button type="button" class="project-list-row" data-action="open-project" data-project-id="${e(report.project.id)}" aria-label="Open ${e(report.project.name)} project"><div class="project-list-main"><span class="project-marker">${e(report.project.name.slice(0, 1))}</span><span><span class="eyebrow">${e(report.project.status)}</span><strong>${e(report.project.name)}</strong><span>${e(report.project.ownerName)} · ${dateLabel(report.project.startDate)} — ${dateLabel(report.project.endDate)}</span></span></div><div class="project-list-metric"><span>Allocation</span><strong>${compact(report.allocationAmount)}</strong></div><div class="project-list-metric"><span>Available to commit</span><strong>${compact(report.availableToCommit)}</strong></div><div class="project-list-metric"><span>Related requests</span><strong>${report.requestCount}</strong></div><span class="arrow" aria-hidden="true">→</span></button>`).join('')}</div>` : '<div class="empty-state project-list-empty"><strong>No projects yet</strong><span>Project allocations will appear here when they are created.</span></div>'}</section>`;
}

function renderProject() {
  const report = selectedProject() ? deriveProjectReportForActor(state, selectedProject().id, activeUserId) : null;
  if (!report) return pageHeader('Project Detail', 'Project unavailable', 'This project no longer exists.', button('Back to Projects', 'open-projects', { kind: 'secondary' }));
  const visibleRequestIds = new Set(getVisibleRequests(state, activeUserId).map((request) => request.id));
  if (!report.allocations.some((row) => row.allocation.id === selectedAllocationId)) selectedAllocationId = report.allocations[0]?.allocation.id ?? '';
  const selectedAllocation = report.allocations.find((row) => row.allocation.id === selectedAllocationId);
  const projectRequests = state.requests.filter((request) => visibleRequestIds.has(request.id) && getProjectForRequest(state, request)?.id === report.project.id && (!selectedAllocationId || request.projectAllocationId === selectedAllocationId));
  return pageHeader('Project Detail · cross-department control', report.project.name, `${report.project.ownerName} · ${dateLabel(report.project.startDate)} — ${dateLabel(report.project.endDate)} · ${report.project.status}`, requestAction('open-project-request')) + `<section class="project-hero"><div class="project-hero-title"><span class="project-marker large">${e(report.project.name.slice(0, 1))}</span><div><span class="eyebrow">Project Allocation</span><h2>${e(report.project.name)}</h2><p>One project view, its department owners, and one derived financial position.</p></div></div><div class="equation"><div><span>Project Allocation</span><strong>${compact(report.allocationAmount)}</strong></div><span class="operator">−</span><div><span>Approved unpaid commitments</span><strong class="value-amber">${compact(report.approvedUnpaidCommitments)}</strong></div><span class="operator">−</span><div><span>Payment-confirmed spend</span><strong class="value-teal">${compact(report.paymentConfirmedSpend)}</strong></div><span class="operator">=</span><div class="equation-result"><span>Available to commit</span><strong>${compact(report.availableToCommit)}</strong></div></div></section>
    <section class="ruled-section"><div class="section-heading"><div><span class="eyebrow">Funding Sources</span><h2>Department allocations</h2></div><span class="definition">Selecting an allocation keeps its Budget Line and ownership visible.</span></div><div class="table-wrap"><table><thead><tr><th>Department</th><th>Budget Line</th><th class="align-right">Project Allocation</th><th class="align-right">Approved unpaid</th><th class="align-right">Payment-confirmed spend</th><th class="align-right">Available to commit</th><th></th></tr></thead><tbody>${report.allocations.length ? report.allocations.map((row) => `<tr class="${row.departmentId === 'technology' ? 'highlight-row' : ''} ${row.allocation.id === selectedAllocationId ? 'selected-allocation' : ''}" data-action="select-allocation" data-allocation-id="${e(row.allocation.id)}" role="button" tabindex="0" aria-selected="${row.allocation.id === selectedAllocationId}"><th scope="row">${e(getDepartment(state, row.departmentId).name)}${row.departmentId === 'technology' ? '<span class="table-note">Selected demo path</span>' : ''}</th><td>${e(row.budgetLine.name)}</td><td class="align-right">${full(row.metrics.sourceAmount)}</td><td class="align-right ${row.metrics.approvedUnpaidCommitments ? 'value-amber' : ''}">${full(row.metrics.approvedUnpaidCommitments)}</td><td class="align-right ${row.metrics.paymentConfirmedSpend ? 'value-teal' : ''}">${full(row.metrics.paymentConfirmedSpend)}</td><td class="align-right strong-number">${full(row.metrics.availableToCommit)}</td><td>${allocationRequestAction(row.allocation.id)}</td></tr>`).join('') : '<tr><td colspan="7"><div class="empty-state">No department allocations yet.</div></td></tr>'}</tbody></table></div></section>
    <section class="ruled-section"><div class="section-heading"><div><span class="eyebrow">Related requests</span><h2>Requests charged to ${e(report.project.name)}</h2></div><button class="text-button" data-page="workspace">Open Request Workspace →</button></div>${projectRequests.length ? `<div class="request-mini-list">${projectRequests.map((request) => requestRow(request, false)).join('')}</div>` : '<p class="empty-state">No requests have been submitted against this project yet.</p>'}</section>`;
}

function requestRow(request, selectable = true) {
  const next = getActiveApproval(state, request);
  const requester = getUser(state, request.requesterId);
  const project = getProjectForRequest(state, request);
  const attrs = selectable ? `data-action="select-request" data-request-id="${e(request.id)}"` : '';
  if (selectable) {
    return `<button type="button" class="request-row" ${attrs} aria-label="Open ${e(request.title)}"><div class="request-row-main"><span class="request-id">${e(request.id)}</span><strong>${e(request.title)}</strong><span>${e(requester.name)} · ${e(request.vendorName)}</span></div><div class="request-row-context">${project ? `<span>${e(project.name)}</span>` : '<span>Non-project · Budget Line</span>'}<span class="row-amount">${compact(request.requestedAmount)}</span></div><div class="request-row-status">${statusBadge(request.status)}<span>${next ? `Next: ${e(next.actor?.role ?? next.role)}` : request.status === STATUS.PAYMENT_CONFIRMED ? 'Closed' : 'Terminal'}</span></div></button>`;
  }
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
  return pageHeader('Request Workspace · role-owned work', 'Request Workspace', `The current view reflects ${user.name} acting as ${user.role}.`, requestAction()) + `<section class="workspace-shell"><div class="workspace-list"><div class="tabs" role="tablist"><button class="tab ${workspaceTab === 'all' ? 'active' : ''}" data-tab="all" role="tab">All Requests <span>${getQueueCounts(state, user.id).all}</span></button><button class="tab ${workspaceTab === 'approvals' ? 'active' : ''}" data-tab="approvals" role="tab">My Approvals <span>${getQueueCounts(state, user.id).myApprovals}</span></button><button class="tab ${workspaceTab === 'payment' ? 'active' : ''}" data-tab="payment" role="tab">Awaiting Payment Confirmation <span>${getQueueCounts(state, user.id).awaitingPayment}</span></button></div><div class="list-caption"><span>${filtered.length} visible record${filtered.length === 1 ? '' : 's'}</span><span class="mono">${e(user.role)}</span></div>${filtered.length ? filtered.map((request) => requestRow(request)).join('') : '<div class="empty-state"><strong>No work in this queue</strong><span>Switch the simulated actor or tab to inspect another responsibility.</span></div>'}</div><div class="workspace-detail">${selected ? renderRequestDetail(selected) : '<div class="detail-empty"><span class="detail-empty-mark">◎</span><h2>Select a request</h2><p>Choose a request from the list to inspect its chain of custody.</p></div>'}</div></section>`;
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
  const canApprove = canActorActOnRequest(state, request, activeUserId);
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

function legacyModalShell(title, description, body, footer) {
  return `<div class="modal-backdrop" data-action="close-modal"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" data-modal-content><div class="modal-header"><div><span class="eyebrow">Focused decision</span><h2 id="modal-title">${e(title)}</h2><p>${e(description)}</p></div><button class="icon-button" data-action="close-modal" aria-label="Close dialog">×</button></div>${body}<div class="modal-footer">${footer}</div></div></div>`;
}

function modalShell(title, description, body = '', footer = '') {
  const descriptionId = 'modal-description';
  return `<div class="modal-backdrop" data-action="close-modal"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="${descriptionId}" data-modal-content><div class="modal-header"><div><span class="eyebrow">Expense request</span><h2 id="modal-title">${e(title)}</h2><p id="${descriptionId}">${e(description)}</p></div><button type="button" class="icon-button" data-action="close-modal" aria-label="Close dialog">×</button></div><div class="modal-body">${cleanModalMarkup(body)}</div><div class="modal-footer">${cleanModalMarkup(footer)}</div></div></div>`;
}

function requestFundingOptions(type) {
  if (activeUser().role !== ROLE.REQUESTER) return [];
  const options = getFundingSourcesForRequester(state, activeUserId, type);
  return type === FUNDING_SOURCE.PROJECT_ALLOCATION && newRequestDraft?.projectId
    ? options.filter((option) => option.projectId === newRequestDraft.projectId)
    : options;
}

function renderNewRequestModal() {
  const user = activeUser();
  const canCreate = user.role === ROLE.REQUESTER;
  const type = newRequestDraft?.fundingSourceType ?? FUNDING_SOURCE.PROJECT_ALLOCATION;
  const options = canCreate ? requestFundingOptions(type) : [];
  const sourceId = newRequestDraft?.sourceId ?? options[0]?.id;
  const selected = options.find((option) => option.id === sourceId) ?? options[0];
  const selectedMetrics = selected?.metrics;
  const error = (field) => formErrors[field] ? `<span class="field-error" id="new-${field}-error">${e(formErrors[field])}</span>` : '';
  const describedBy = (field, helper = '') => [helper ? `new-${field}-help` : '', formErrors[field] ? `new-${field}-error` : ''].filter(Boolean).join(' ');
  const input = (field, label, placeholder, type = 'text', extra = '', required = true) => {
    const helper = field === 'requestedAmount' ? 'Use integer rupiah.' : '';
    const ids = describedBy(field, helper);
    return `<label class="field ${formErrors[field] ? 'has-error' : ''}" for="new-${field}"><span>${e(label)}</span><input id="new-${field}" name="${e(field)}" type="${type}" value="${e(newRequestDraft?.[field] ?? '')}" placeholder="${e(placeholder)}" ${ids ? `aria-describedby="${ids}"` : ''} ${formErrors[field] ? 'aria-invalid="true"' : ''} ${required ? 'required' : ''} ${extra}/>${error(field)}${helper ? `<small id="new-${field}-help">${helper}</small>` : ''}</label>`;
  };
  return modalShell('New Expense Request', canCreate ? 'Make one Funding Source, its owner, and its approval chain explicit.' : 'Request creation is available to Requester roles only.', `<form id="new-request-form" class="form-body"><div class="form-context"><span class="eyebrow">Current actor</span><strong>${e(user.name)}</strong><span>${e(user.role)} · ${e(getDepartment(state, user.departmentId).name)}</span></div>${newRequestDraft?.projectId ? `<p class="project-context-note">Project context: <strong>${e(state.projects.find((project) => project.id === newRequestDraft.projectId)?.name ?? 'Selected project')}</strong>. Project Allocation options are limited to this project.</p>` : ''}${!canCreate ? '<p class="warning-note"><span>!</span>Switch to a Requester role to create a request. Other roles can inspect the saved workflow.</p>' : `<fieldset><legend>Funding Source</legend><div class="segmented"><label><input type="radio" name="fundingSourceType" value="PROJECT_ALLOCATION" ${type === FUNDING_SOURCE.PROJECT_ALLOCATION ? 'checked' : ''}/> <span>Project Allocation</span></label><label><input type="radio" name="fundingSourceType" value="BUDGET_LINE_UNALLOCATED" ${type === FUNDING_SOURCE.BUDGET_LINE_UNALLOCATED ? 'checked' : ''}/> <span>Budget Line Unallocated Balance</span></label></div><label class="field" for="new-source"><span>${type === FUNDING_SOURCE.PROJECT_ALLOCATION ? 'Project Allocation' : 'Budget Line'}</span><select id="new-source" name="sourceId" ${options.length ? '' : 'disabled'}>${options.map((option) => `<option value="${e(option.id)}" ${option.id === sourceId ? 'selected' : ''}>${e(type === FUNDING_SOURCE.PROJECT_ALLOCATION ? `${option.project.name} · ${option.budgetLine.name} · ${compact(option.allocatedAmount)}` : `${option.name} · ${compact(option.metrics.availableToCommit)} available`)}</option>`).join('')}</select>${error('sourceId')}<small>${newRequestDraft?.projectId && type === FUNDING_SOURCE.PROJECT_ALLOCATION ? 'Only allocations in the selected project and your department are selectable.' : 'Only Funding Sources owned by your department are selectable.'}</small></label>${selected ? `<div class="derived-context"><div><span>Derived department</span><strong>${e(getDepartment(state, user.departmentId).name)}</strong></div><div><span>Budget Line</span><strong>${e(type === FUNDING_SOURCE.PROJECT_ALLOCATION ? selected.budgetLine.name : selected.name)}</strong></div><div><span>Current Available to commit</span><strong>${full(selectedMetrics.availableToCommit)}</strong></div>${type === FUNDING_SOURCE.PROJECT_ALLOCATION ? `<div><span>Project</span><strong>${e(selected.project.name)}</strong></div>` : '<div><span>Project</span><strong>None · non-project</strong></div>'}</div>` : ''}</fieldset><div class="form-grid">${input('title', 'Title', 'e.g. Ramadan microsite development')}${input('vendorName', 'Vendor or recipient', 'e.g. Digital Studio Indonesia')}${input('requestedAmount', 'Requested amount', '150000000', 'number', 'min="1" step="1"')}${input('requiredDate', 'Required date', '', 'date')}</div><label class="field ${formErrors.justification ? 'has-error' : ''}" for="new-justification"><span>Business justification</span><textarea id="new-justification" name="justification" rows="3" placeholder="Explain the business need and timing." aria-describedby="justification-error">${e(newRequestDraft?.justification ?? '')}</textarea>${error('justification')}</label>${formError ? `<p class="form-error" role="alert">${e(formError)}</p>` : ''}</form>`}`, canCreate ? button('Cancel', 'close-modal', { kind: 'quiet' }) + button('Submit Request', 'submit-new-request', { kind: 'primary', extra: 'form="new-request-form"', type: 'submit' }) : button('Close', 'close-modal', { kind: 'primary' }));
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

function draftFundingSource() {
  if (!newRequestDraft?.sourceId) return null;
  if (newRequestDraft.fundingSourceType === FUNDING_SOURCE.PROJECT_ALLOCATION) return { type: FUNDING_SOURCE.PROJECT_ALLOCATION, id: newRequestDraft.sourceId };
  return { type: FUNDING_SOURCE.BUDGET_LINE_UNALLOCATED, id: newRequestDraft.sourceId };
}

function validateNewDraft() {
  const errors = {};
  if (!newRequestDraft.title?.trim()) errors.title = 'Title is required.';
  if (!newRequestDraft.vendorName?.trim()) errors.vendorName = 'Vendor or recipient is required.';
  if (!Number.isInteger(Number(newRequestDraft.requestedAmount)) || Number(newRequestDraft.requestedAmount) <= 0) errors.requestedAmount = 'Enter an amount greater than zero.';
  if (!newRequestDraft.requiredDate) errors.requiredDate = 'Required date is required.';
  if (!newRequestDraft.justification?.trim()) errors.justification = 'Business justification is required.';
  const eligibleSource = requestFundingOptions(newRequestDraft.fundingSourceType).some((option) => option.id === newRequestDraft.sourceId);
  if (!newRequestDraft.sourceId || !eligibleSource) errors.sourceId = 'Select a Funding Source owned by your department.';
  const amount = Number(newRequestDraft.requestedAmount);
  const source = draftFundingSource();
  if (!errors.requestedAmount && source && Number.isInteger(amount) && amount > 0) {
    try {
      validateRequestedAmount(state, source, amount);
    } catch (error) {
      errors.requestedAmount = error.message;
    }
  }
  return errors;
}

function validatePaymentDraft() {
  const errors = {};
  if (!paymentDraft.paymentDate) errors.paymentDate = 'Payment date is required.';
  if (!paymentDraft.beneficiaryName?.trim()) errors.beneficiaryName = 'Beneficiary is required.';
  if (!paymentDraft.destinationBank?.trim()) errors.destinationBank = 'Destination bank is required.';
  if (!paymentDraft.transferReference?.trim()) errors.transferReference = 'Transfer reference is required.';
  if (!paymentDraft.proof) errors.proof = 'A valid transfer-proof file is required.';
  else {
    try { validateProofMetadata(paymentDraft.proof); } catch (error) { errors.proof = error.message; }
  }
  return errors;
}

function openModal(nextModal) {
  if (!modal) {
    lastFocusedElement = document.activeElement;
    lastFocusedAction = lastFocusedElement?.dataset?.action ?? '';
  }
  modal = nextModal;
  modalFocusPending = true;
  focusTargetId = '';
  render();
}

function closeModal() {
  const restoreId = lastFocusedElement?.id;
  modal = null;
  formError = '';
  formErrors = {};
  modalFocusPending = false;
  modalScrollTop = 0;
  render();
  const replacement = (restoreId ? document.getElementById(restoreId) : null) ?? (lastFocusedAction ? root.querySelector(`[data-action="${lastFocusedAction}"]`) : null);
  if (replacement) replacement.focus();
  lastFocusedElement = null;
  lastFocusedAction = '';
}

function openNewRequest(prefill = {}) {
  formError = ''; formErrors = {};
  newRequestDraft = { title: '', vendorName: '', requestedAmount: '', requiredDate: '', justification: '', fundingSourceType: FUNDING_SOURCE.PROJECT_ALLOCATION, sourceId: '', projectId: '', ...prefill };
  const options = requestFundingOptions(newRequestDraft.fundingSourceType);
  if (!newRequestDraft.sourceId) newRequestDraft.sourceId = options[0]?.id ?? '';
  openModal({ type: 'new-request' });
}

function syncFormFromDOM(form) {
  const data = new FormData(form);
  const values = Object.fromEntries(data.entries());
  if (form.id === 'new-request-form') newRequestDraft = { ...newRequestDraft, ...values, fundingSourceType: values.fundingSourceType, sourceId: values.sourceId, requestedAmount: values.requestedAmount ? Number(values.requestedAmount) : '' };
  if (form.id === 'reject-form') rejectDraft.reason = values.reason || '';
  if (form.id === 'payment-form') paymentDraft = { ...paymentDraft, ...values };
}

function handleAction(action, element) {
  if (action === 'close-modal') { closeModal(); return; }
  if (action === 'reset-demo') { if (window.confirm('Reset Demo Data to the canonical FY2027 fixture?')) { state = resetState(); activeUserId = 'user-finance-reviewer'; page = PAGE.OVERVIEW; workspaceTab = getDefaultWorkspaceTab(state, activeUserId); selectedProjectId = state.projects[0]?.id; selectedRequestId = state.requests[0].id; notify('Demo data restored to the canonical fixture.'); } return; }
  if (action === 'open-new-request') { if (activeUser().role !== ROLE.REQUESTER) return; openNewRequest(); return; }
  if (action === 'open-projects') { if (!canActorAccessPage(state, activeUserId, PAGE.PROJECTS)) return; page = PAGE.PROJECTS; focusTargetId = 'page-title'; render(); return; }
  if (action === 'open-project') { if (!deriveProjectsReportForActor(state, activeUserId).some((report) => report.project.id === element.dataset.projectId)) return; selectedProjectId = element.dataset.projectId; selectedAllocationId = state.allocations.find((allocation) => allocation.projectId === selectedProjectId)?.id ?? ''; page = PAGE.PROJECT; focusTargetId = 'page-title'; render(); return; }
  if (action === 'open-project-request') {
    if (activeUser().role !== ROLE.REQUESTER) return;
    const allocation = getProjectAllocationForRequester(state, selectedProjectId, activeUserId);
    openNewRequest({ projectId: selectedProjectId, sourceId: allocation?.id ?? '', fundingSourceType: FUNDING_SOURCE.PROJECT_ALLOCATION });
    return;
  }
  if (action === 'select-allocation') { selectedAllocationId = element.dataset.allocationId; render(); return; }
  if (action === 'open-allocation-request') { const eligible = activeUser().role === ROLE.REQUESTER && getFundingSourcesForRequester(state, activeUserId, FUNDING_SOURCE.PROJECT_ALLOCATION).some((allocation) => allocation.id === element.dataset.allocationId && allocation.projectId === selectedProjectId); if (!eligible) { notify('That Project Allocation is not available to the current requester.'); return; } openNewRequest({ projectId: selectedProjectId, sourceId: element.dataset.allocationId, fundingSourceType: FUNDING_SOURCE.PROJECT_ALLOCATION }); return; }
  if (action === 'select-request') { if (!getVisibleRequests(state, activeUserId).some((request) => request.id === element.dataset.requestId)) return; selectedRequestId = element.dataset.requestId; page = PAGE.WORKSPACE; render(); return; }
  if (action === 'open-approve') { formError = ''; openModal({ type: 'approve', requestId: element.dataset.requestId }); return; }
  if (action === 'confirm-approve') { try { approveRequest(state, element.dataset.requestId, activeUserId); saveState(state); modal = null; notify('Approval recorded. The request now belongs to its next responsible actor.'); } catch (error) { formError = error.message; } render(); return; }
  if (action === 'open-reject') { formError = ''; formErrors = {}; rejectDraft = { reason: '' }; openModal({ type: 'reject', requestId: element.dataset.requestId }); return; }
  if (action === 'confirm-reject') { const requestId = element.dataset.requestId; const errors = !rejectDraft.reason.trim() ? { reason: 'A rejection reason is required.' } : {}; if (Object.keys(errors).length) { formErrors = errors; render(); return; } try { rejectRequest(state, requestId, activeUserId, rejectDraft.reason); saveState(state); modal = null; notify('Request rejected and recorded in Activity History.'); } catch (error) { formError = error.message; } render(); return; }
  if (action === 'open-payment') { formError = ''; formErrors = {}; paymentDraft = { paymentDate: '2027-02-18', beneficiaryName: '', destinationBank: '', transferReference: '', proof: null }; openModal({ type: 'payment', requestId: element.dataset.requestId }); return; }
  if (action === 'remove-proof') { paymentDraft.proof = null; formErrors.proof = ''; render(); return; }
  if (action === 'confirm-payment') { const errors = validatePaymentDraft(); if (Object.keys(errors).length) { formErrors = errors; render(); return; } try { confirmPayment(state, element.dataset.requestId, activeUserId, paymentDraft); saveState(state); modal = null; notify('Payment confirmed. Commitment reclassified without reducing availability twice.'); } catch (error) { formError = error.message; } render(); return; }
}

root.addEventListener('click', (event) => {
  const modalBackdrop = event.target.closest?.('.modal-backdrop');
  if (modalBackdrop && event.target === modalBackdrop) { closeModal(); return; }
  const pageTarget = event.target.closest('[data-page]');
  if (pageTarget) { page = pageTarget.dataset.page; if (page === PAGE.WORKSPACE && !selectedRequestId) selectedRequestId = getVisibleRequests(state, activeUserId)[0]?.id; if (page === PAGE.PROJECTS) focusTargetId = 'page-title'; render(); return; }
  const tab = event.target.closest('[data-tab]');
  if (tab) { workspaceTab = tab.dataset.tab; render(); return; }
  const target = event.target.closest('[data-action]');
  if (target && target !== modalBackdrop) handleAction(target.dataset.action, target);
});

root.addEventListener('change', (event) => {
  if (event.target.id === 'actor-select') { activeUserId = event.target.value; page = getDefaultPageForActor(state, activeUserId); workspaceTab = getDefaultWorkspaceTab(state, activeUserId); const visible = getVisibleRequests(state, activeUserId); selectedRequestId = visible[0]?.id; notify(`Acting as ${getUser(state, activeUserId).name} · ${getUser(state, activeUserId).role}.`); return; }
  if (event.target.id === 'new-source') { newRequestDraft.sourceId = event.target.value; focusTargetId = event.target.id; render(); return; }
  if (event.target.name === 'fundingSourceType') { newRequestDraft.fundingSourceType = event.target.value; const options = requestFundingOptions(event.target.value); newRequestDraft.sourceId = options[0]?.id ?? ''; focusTargetId = event.target.id; render(); return; }
  if (event.target.id === 'payment-proof') {
    const file = event.target.files?.[0];
    if (file) {
      const proof = { name: file.name, type: file.type, size: file.size };
      try {
        validateProofMetadata(proof);
        paymentDraft.proof = proof;
        formErrors.proof = '';
      } catch (error) {
        paymentDraft.proof = null;
        formErrors.proof = error.message;
        focusTargetId = 'payment-proof';
      }
      render();
    }
  }
});

root.addEventListener('input', (event) => {
  if (!modal) return;
  const form = event.target.form;
  if (form?.id === 'new-request-form') { newRequestDraft[event.target.name] = event.target.name === 'requestedAmount' ? Number(event.target.value) : event.target.value; }
  if (form?.id === 'reject-form') rejectDraft.reason = event.target.value;
  if (form?.id === 'payment-form' && event.target.name) paymentDraft[event.target.name] = event.target.value;
});

root.addEventListener('input', (event) => {
  const form = event.target.form;
  if (!modal || form?.id !== 'new-request-form' || !event.target.name) return;
  const nextError = validateNewDraft()[event.target.name];
  if (nextError === formErrors[event.target.name]) return;
  if (nextError) formErrors[event.target.name] = nextError;
  else delete formErrors[event.target.name];
  focusTargetId = event.target.id;
  render();
});

  root.addEventListener('submit', (event) => {
    const form = event.target;
    if (form.id === 'new-request-form') {
      syncFormFromDOM(form);
      const errors = validateNewDraft();
      if (Object.keys(errors).length) focusTargetId = `new-${errors.title ? 'title' : Object.keys(errors)[0]}`;
    }
  }, true);

  root.addEventListener('submit', (event) => { event.preventDefault(); const form = event.target; syncFormFromDOM(form); if (form.id === 'new-request-form') { formErrors = validateNewDraft(); if (Object.keys(formErrors).length) { render(); return; } try { const request = createRequest(state, { actorId: activeUserId, ...newRequestDraft, requestedAmount: Number(newRequestDraft.requestedAmount), projectAllocationId: newRequestDraft.fundingSourceType === FUNDING_SOURCE.PROJECT_ALLOCATION ? newRequestDraft.sourceId : undefined, budgetLineId: newRequestDraft.fundingSourceType === FUNDING_SOURCE.PROJECT_ALLOCATION ? getBudgetLine(state, newRequestDraft.sourceId ? state.allocations.find((item) => item.id === newRequestDraft.sourceId).budgetLineId : '').id : newRequestDraft.sourceId }); selectedRequestId = request.id; saveState(state); modal = null; page = PAGE.WORKSPACE; notify('Request submitted. Financial figures remain unchanged until Finance approval.'); } catch (error) { formError = error.message; } render(); } });

root.addEventListener('keydown', (event) => {
  if (modal) {
    if (event.key === 'Escape') { event.preventDefault(); closeModal(); return; }
    if (event.key === 'Tab') {
      const dialog = root.querySelector('[data-modal-content]');
      const focusable = [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) { event.preventDefault(); dialog.focus(); return; }
      const currentIndex = focusable.indexOf(document.activeElement);
      const nextIndex = event.shiftKey
        ? (currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1)
        : (currentIndex === focusable.length - 1 ? 0 : currentIndex + 1);
      event.preventDefault();
      focusable[nextIndex].focus();
    }
    return;
  }
  const allocationTarget = event.target.closest('[data-action="select-allocation"]');
  if (allocationTarget && event.target === allocationTarget && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    handleAction('select-allocation', allocationTarget);
    return;
  }
  if (event.key !== 'Enter') return;
  const pageTarget = event.target.closest('[data-page]');
  if (pageTarget && event.target.tagName !== 'BUTTON') { event.preventDefault(); page = pageTarget.dataset.page; render(); return; }
  const requestTarget = event.target.closest('[data-action="select-request"]');
  if (requestTarget) { event.preventDefault(); selectedRequestId = requestTarget.dataset.requestId; page = PAGE.WORKSPACE; render(); }
});

function enhanceRenderedMarkup() {
  document.body.classList.toggle('modal-open', Boolean(modal));
  const modalTitle = root.querySelector('#modal-title');
  if (modalTitle?.textContent === 'New Expense Request') modalTitle.textContent = 'New expense request';

  root.querySelectorAll('.table-wrap').forEach((wrapper) => {
    if (!wrapper.querySelector('.table-overflow-cue')) {
      const cue = document.createElement('div');
      cue.className = 'table-overflow-cue';
      cue.setAttribute('role', 'note');
      cue.innerHTML = 'Scroll for more columns <span aria-hidden="true">→</span>';
      wrapper.prepend(cue);
    }
  });

  if (page === PAGE.PROJECT) {
    const table = root.querySelector('.project-hero + .ruled-section .table-wrap table');
    const wrapper = table?.closest('.table-wrap');
    wrapper?.classList.add('table-wrap-sticky-first');
    const actionHeader = table?.querySelector('thead th:last-child');
    if (actionHeader) actionHeader.textContent = 'Actions';
    table?.querySelectorAll('tbody tr[data-action="select-allocation"]').forEach((row) => {
      const allocationId = row.dataset.allocationId;
      const allocation = state.allocations.find((item) => item.id === allocationId);
      const budgetLine = allocation ? getBudgetLine(state, allocation.budgetLineId) : null;
      const departmentBudget = state.departmentBudgets.find((item) => item.id === budgetLine?.departmentBudgetId);
      const department = departmentBudget ? getDepartment(state, departmentBudget.departmentId) : null;
      const departmentCell = row.querySelector('th[scope="row"]');
      if (!allocation || !department || !departmentCell) return;
      row.classList.remove('highlight-row');
      row.removeAttribute('data-action');
      row.removeAttribute('data-allocation-id');
      row.removeAttribute('role');
      row.removeAttribute('tabindex');
      row.removeAttribute('aria-selected');
      departmentCell.innerHTML = `<button type="button" class="allocation-select" data-action="select-allocation" data-allocation-id="${e(allocation.id)}" aria-pressed="${String(allocation.id === selectedAllocationId)}" aria-label="Select ${e(department.name)} allocation"><span>${e(department.name)}</span>${department.id === 'technology' ? '<small>Primary demo allocation</small>' : ''}</button>`;
    });
  }

  const form = root.querySelector('#new-request-form');
  if (form) {
    form.noValidate = true;
    const fieldIds = { title: 'new-title', vendorName: 'new-vendorName', requestedAmount: 'new-requestedAmount', requiredDate: 'new-requiredDate', justification: 'new-justification', sourceId: 'new-source' };
    Object.entries(fieldIds).forEach(([field, controlId]) => {
      const control = form.querySelector(`#${controlId}`);
      if (!control) return;
      control.required = true;
      const errorNode = form.querySelector(`#new-${field}-error`);
      const helperNode = form.querySelector(`#new-${field}-help`) ?? (field === 'sourceId' ? control.parentElement.querySelector('small') : null);
      if (helperNode && !helperNode.id) helperNode.id = `new-${field}-help`;
      const describedBy = [helperNode?.id, errorNode?.id].filter(Boolean).join(' ');
      if (describedBy) control.setAttribute('aria-describedby', describedBy);
      else control.removeAttribute('aria-describedby');
      if (errorNode) control.setAttribute('aria-invalid', 'true');
      else control.removeAttribute('aria-invalid');
    });
    const projectRadio = form.querySelector('input[name="fundingSourceType"][value="PROJECT_ALLOCATION"]');
    const budgetRadio = form.querySelector('input[name="fundingSourceType"][value="BUDGET_LINE_UNALLOCATED"]');
    if (projectRadio) projectRadio.id = 'new-funding-project';
    if (budgetRadio) budgetRadio.id = 'new-funding-budget';
    if (Object.keys(formErrors).length && !form.querySelector('#new-request-errors')) {
      const summary = document.createElement('div');
      summary.id = 'new-request-errors';
      summary.className = 'form-error form-error-summary';
      summary.setAttribute('role', 'alert');
      summary.tabIndex = -1;
      summary.innerHTML = `<strong>There are errors in the request form.</strong><ul>${Object.entries(formErrors).map(([field, message]) => `<li><a href="#${fieldIds[field] ?? `new-${field}`}">${e(message)}</a></li>`).join('')}</ul>`;
      form.prepend(summary);
    }
  }

  root.querySelectorAll('.segmented input').forEach((input) => {
    input.setAttribute('aria-label', input.value === FUNDING_SOURCE.PROJECT_ALLOCATION ? 'Project Allocation' : 'Budget Line Unallocated Balance');
  });
  root.querySelectorAll('#reject-form textarea[name="reason"]').forEach((control) => { control.required = true; });
  root.querySelectorAll('#payment-form input[name]').forEach((control) => { control.required = true; });
}

function render() {
  normalizeViewState();
  if (modal) modalScrollTop = root.querySelector('.modal-body')?.scrollTop ?? modalScrollTop;
  const content = page === PAGE.PROJECTS ? renderProjects() : page === PAGE.PROJECT ? renderProject() : page === PAGE.WORKSPACE ? renderWorkspace() : renderOverview();
  root.innerHTML = renderShell(content);
  enhanceRenderedMarkup();
  renderOverviewDerivedValues();
  const backgroundNodes = [root.querySelector('.sidebar'), root.querySelector('.main-content')].filter(Boolean);
  backgroundNodes.forEach((node) => {
    node.toggleAttribute('inert', Boolean(modal));
    node.setAttribute('aria-hidden', modal ? 'true' : 'false');
  });
  const tabs = [...root.querySelectorAll('[data-tab]')];
  const activeTab = tabs.find((tab) => tab.dataset.tab === workspaceTab);
  tabs.forEach((tab) => {
    tab.id = `request-tab-${tab.dataset.tab}`;
    tab.setAttribute('aria-selected', String(tab === activeTab));
    tab.setAttribute('aria-controls', 'request-list-panel');
  });
  const workspaceList = root.querySelector('.workspace-list');
  let tabPanel = workspaceList?.querySelector('#request-list-panel');
  if (workspaceList && !tabPanel) {
    tabPanel = document.createElement('div');
    tabPanel.id = 'request-list-panel';
    tabPanel.setAttribute('role', 'tabpanel');
    tabPanel.setAttribute('tabindex', '0');
    while (workspaceList.children.length > 1) tabPanel.append(workspaceList.children[1]);
    workspaceList.append(tabPanel);
  }
  if (tabPanel && activeTab) tabPanel.setAttribute('aria-labelledby', activeTab.id);
  const historyEvents = state.activityEvents
    .filter((event) => event.expenseRequestId === selectedRequestId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  [...root.querySelectorAll('.history-event-body')].forEach((body, index) => {
    const event = historyEvents[index];
    if (!event) return;
    const result = document.createElement('div');
    result.className = 'event-result';
    result.textContent = `Resulting status: ${event.resultingStatus}`;
    body.append(result);
    if (event.eventType === EVENT_TYPE.PAYMENT_CONFIRMED) {
      const metadata = event.metadata ?? {};
      const evidence = document.createElement('div');
      evidence.className = 'event-evidence';
      evidence.textContent = `${formatIDR(metadata.amount)} · ${metadata.bank} · ${metadata.reference} · ${metadata.proofFileName} · ${metadata.proofFileType} · ${formatBytes(metadata.proofFileSize)}`;
      body.append(evidence);
    }
  });
  root.querySelectorAll('.event-evidence').forEach((evidence) => {
    const metadata = evidence.parentElement?.querySelector('.event-meta');
    if (metadata) metadata.textContent = evidence.textContent;
    evidence.remove();
  });
  const selectedRequest = state.requests.find((request) => request.id === selectedRequestId);
  const detailActionBar = root.querySelector('.workspace-detail .action-bar');
  if (selectedRequest && detailActionBar) {
    const financeApproved = state.activityEvents.some((event) => event.expenseRequestId === selectedRequest.id && event.eventType === EVENT_TYPE.FINANCE_APPROVED);
    const transition = document.createElement('div');
    transition.className = `financial-transition ${selectedRequest.status === STATUS.PAYMENT_CONFIRMED ? 'payment-transition' : 'commitment-transition'}`;
    if (selectedRequest.status === STATUS.PAYMENT_CONFIRMED) {
      transition.textContent = `Payment reclassification: ${formatIDR(selectedRequest.approvedAmount)} moved from Approved unpaid commitments to Payment-confirmed spend. Available to commit is unchanged.`;
    } else if (financeApproved) {
      transition.textContent = `Finance commitment: ${formatIDR(selectedRequest.approvedAmount)} is now an Approved unpaid commitment; payment is still external.`;
    }
    if (transition.textContent) detailActionBar.append(transition);
  }
  if (modal?.type === 'new-request' && activeUser().role === ROLE.REQUESTER) {
    const context = root.querySelector('.derived-context');
    const budget = state.departmentBudgets.find((item) => item.departmentId === activeUser().departmentId);
    const approvers = [
      ['Line Manager', state.users.find((user) => user.id === activeUser().managerId)?.name ?? 'Not assigned'],
      ['Department Budget Owner', state.users.find((user) => user.id === budget?.budgetOwnerId)?.name ?? 'Not assigned'],
    ];
    approvers.forEach(([label, value]) => {
      if (!context) return;
      const item = document.createElement('div');
      item.innerHTML = `<span>${e(label)}</span><strong>${e(value)}</strong>`;
      context.append(item);
    });
  }
  if (modal) {
    const dialog = root.querySelector('[data-modal-content]');
    dialog?.setAttribute('tabindex', '-1');
    const focusTarget = focusTargetId ? dialog?.querySelector(`#${focusTargetId}`) : null;
    const firstFocusable = dialog?.querySelector('input, textarea, select, button:not([disabled])');
    if (focusTarget || (modalFocusPending && firstFocusable)) {
      const target = focusTarget ?? firstFocusable;
      target.focus();
      if (focusTarget) target.scrollIntoView({ block: 'nearest' });
    } else {
      const modalBody = root.querySelector('.modal-body');
      if (modalBody) modalBody.scrollTop = modalScrollTop;
    }
    modalFocusPending = false;
    focusTargetId = '';
  }
  if (!modal && focusTargetId) {
    root.querySelector(`#${focusTargetId}`)?.focus();
    focusTargetId = '';
  }
}

function renderOverviewDerivedValues() {
  if (page !== PAGE.OVERVIEW) return;
  const report = deriveOverviewReportForActor(state, activeUserId);
  const metricGrid = root.querySelector('.metric-grid');
  if (metricGrid) {
    const remaining = document.createElement('div');
    remaining.className = 'metric';
    remaining.innerHTML = '<span class="metric-label"></span><strong></strong><span class="metric-detail"></span>';
    remaining.querySelector('.metric-label').textContent = 'Remaining Budget';
    remaining.querySelector('strong').textContent = compact(report.remainingBudget);
    remaining.querySelector('.metric-detail').textContent = 'Approved Budget less payment-confirmed spend';
    metricGrid.insertBefore(remaining, metricGrid.children[1] ?? null);
  }
  const table = root.querySelector('.position-strip + .ruled-section table');
  const header = table?.querySelector('thead tr');
  if (!table || !header) return;
  const remainingHeader = document.createElement('th');
  remainingHeader.className = 'align-right';
  remainingHeader.textContent = 'Remaining Budget';
  header.insertBefore(remainingHeader, header.children[2] ?? null);
  [...table.querySelectorAll('tbody tr')].forEach((row, index) => {
    const reportRow = report.departments[index];
    if (!reportRow) return;
    const remainingCell = document.createElement('td');
    remainingCell.className = 'align-right';
    remainingCell.textContent = full(reportRow.remainingBudget);
    row.insertBefore(remainingCell, row.children[2] ?? null);
  });
}

render();
