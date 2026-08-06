# Design Brief: Budget Execution Control

## Creative North Star

**Reframe:** This product is a glass-walled control room for company money. It makes every request, approval, commitment, and payment confirmation visible as one traceable chain of custody.

**Experience promise:** A Finance Reviewer should understand what changed, who authorized it, what amount is affected, and what happens next without reconstructing the story from separate screens.

**Quality bar:** The prototype should feel calm, exact, and presentation-ready at every point in the primary demo. Dense financial information must read like a well-edited control surface, not a spreadsheet wrapped in cards. Every role, status, action, and monetary transition must remain legible without relying on color or animation.

## The Three-Layer Brief

- **What:** An internal finance operations application that traces a request from one Funding Source through business approval, budget authorization, Finance approval, and external payment confirmation.
- **How it feels:** Controlled, lucid, and quietly authoritative. The interface uses editorial hierarchy, ledger-like alignment, strong whitespace, and restrained motion to make complex state feel manageable.
- **Why it exists:** Company money should never disappear into disconnected spreadsheets and messages. Every rupiah should retain a visible source, decision trail, current classification, and accountable next step.

## Audience and Outcome

- **Primary audience:** Finance Reviewer and Finance Payment Processor.
- **Supporting audience:** Requester, Line Manager, Department Budget Owner, and Executive Viewer.
- **Audience state on arrival:** The user knows their role but needs immediate clarity about what requires attention, what they are authorized to do, and the current financial consequence.
- **Primary outcome:** Complete and verify the Ramadan Campaign request lifecycle while its figures reconcile across Request Workspace, Projects, Project Detail, and Overview.
- **Primary product action:** Advance the selected request through the one role-authorized action available at its current stage.
- **Secondary actions:** Create a request, inspect budget position, review Activity History, switch simulated roles, and reset the canonical demo.

## Design Principles

1. **Show the chain of custody:** Keep Funding Source, responsible actor, current state, next actor, and financial effect connected in the same visual story.
2. **Separate authorization from money movement:** The first two approvals should feel procedural; Finance approval must visibly create an Approved unpaid commitment; Payment confirmation must visibly reclassify that amount without reducing Available to commit again.
3. **Make numbers explain themselves:** Pair every monetary value with its scope, classification, and relationship to other figures. Use aligned numerals, formulas, and before/after states instead of decorative charts.
4. **Design for the active role:** Keep the simulated actor and role persistently visible. Emphasize only actions that the active role can perform; explain unavailable actions rather than presenting dead controls.
5. **Use restraint as assurance:** Favor quiet surfaces, precise typography, and short state transitions. Motion should clarify continuity and reclassification, never make a control workflow feel theatrical.

## References and Synthesis

| Reference | Quality to borrow | Expression in this product |
| --- | --- | --- |
| Linear | Dense but calm hierarchy and crisp selection states | Compact request queues, decisive focus treatment, and minimal visual chrome |
| Financial Times data graphics | Numeric clarity and explanatory annotation | Tabular rupiah figures, plain-language labels, and direct before/after comparisons |
| Braun industrial control panels | Restrained grouping and purposeful controls | A limited palette, strong alignment, and controls that visually correspond to one function |
| GOV.UK Design System | Unambiguous language, validation, and accessibility | Visible labels, connected error messages, explicit confirmation copy, and no color-only status cues |

These references are ingredients, not layouts to copy. The result should feel like a purpose-built finance control system with an editorial ledger sensibility.

## Visual Language

### Color

Use a light control-room palette. Most of the application should be neutral; semantic colors appear only where they carry state.

| Role | Value | Usage |
| --- | --- | --- |
| Application canvas | `#F3F5F2` | Main background; a soft mineral gray rather than stark white |
| Primary surface | `#FFFFFF` | Work areas, tables, modals, and selected detail panels |
| Raised/selected surface | `#E9EEF9` | Selected requests and focused financial context |
| Primary ink | `#16202A` | Headings, values, and primary body text |
| Secondary ink | `#5D6872` | Supporting labels, timestamps, and explanatory copy |
| Hairline/border | `#D8DEDA` | Table rules, dividers, and field boundaries |
| Action blue | `#244FC7` | Primary actions, active navigation, and focus association |
| Project violet | `#6657A8` | Project Allocation identity; never use as a generic decoration |
| Confirmed teal | `#147568` | Payment Confirmed and positive completion states |
| Commitment amber | `#9A5B13` | Approved unpaid commitment and 80% utilization warning |
| Rejection red | `#B42318` | Rejected states and destructive confirmation only |

Requirements:

- Meet WCAG AA contrast for text and interactive controls.
- Pair every semantic color with a text label and, where compact, an icon or distinct shape.
- Do not use green to mean generic approval. Reserve teal for Payment Confirmed so the classification remains unambiguous.
- Keep charts and allocation visuals within the same restrained token set; do not generate rainbow categories.

### Typography

Use `Geist` with system-sans fallbacks. Use `Geist Mono` only for request IDs, transfer references, timestamps when useful, and compact audit metadata. If those fonts are unavailable, use `Inter` and a system monospace fallback without changing the hierarchy.

| Role | Direction | Scale and behavior |
| --- | --- | --- |
| Page title | Semibold, compact, sentence case | `clamp(2rem, 3vw, 3rem)`, 1.05 line-height, slightly negative tracking |
| Section title | Semibold | 20–24 px, 1.2 line-height |
| Primary money | Semibold with tabular numerals | 24–36 px according to importance; currency and unit remain attached |
| Table/body | Regular to medium | 14 px desktop, 1.45 line-height; 13 px only for secondary metadata |
| Label | Medium, sentence case | 12 px with modest positive tracking; avoid pervasive uppercase |
| ID/reference | Monospace | 12–13 px with tabular numerals |

Use tabular numerals for every amount and aligned numeric column. Keep `Rp150M`, `Rp5B`, and full rupiah formatting consistent within the context; never mix abbreviations and full integers in the same comparison.

### Composition and Spacing

- Build a persistent application shell with a 224 px left navigation rail on presentation-width screens and a compact top utility bar.
- Place Overview, Projects, and Request Workspace in the primary navigation. Keep FY2027 context, active simulated role, and Reset Demo Data in the persistent shell.
- Use a fluid main canvas with a 1600 px maximum and 24–32 px page gutters at desktop widths.
- Base spacing on a 4 px unit. Use 8 px within compact controls, 16 px within table rows and field groups, 24 px between related modules, and 40–56 px between major page regions.
- Prefer ruled groups, aligned columns, and shared surfaces over a grid of floating cards.
- Use cards only for distinct objects such as the Ramadan Campaign project or a selected request, not for every metric.
- Keep important amounts on a common baseline. Labels sit above values; explanatory changes sit below them.
- Use 8 px corners for controls and 10–12 px for major surfaces. Avoid pill-shaped containers except for compact statuses.
- Use subtle shadows only for modals or temporary overlays. Page hierarchy should come from spacing, borders, and tonal contrast.

### Imagery and Material

The product does not need stock photography, illustrations, or decorative 3D objects. Its material is the movement of money and authority through the system.

- Use thin connector lines, directional markers, and changing numeric classifications as the primary visual motif.
- Use icons sparingly for navigation and semantic reinforcement. Prefer Lucide-style 1.5 px line icons with visible text labels.
- Make the Ramadan Campaign recognizable through a restrained violet project marker and clear cross-department allocation pattern, not campaign imagery.
- Keep data visualizations two-dimensional, labeled directly, and reconstructable from displayed figures.

### Explicit Exclusions

- No gradients, glassmorphism, neon finance styling, or dark “trading terminal” theme.
- No oversized dashboard-card mosaic.
- No unlabeled donut charts, decorative line charts, or animated counters on initial load.
- No confetti, bouncing confirmations, parallax, smooth-scroll hijacking, or ornamental page transitions.
- No bank-account imagery or language suggesting that the product executes payments.
- Do not use `Available Budget`, `Actual expense`, `Paid`, `Payment approval`, or other domain terms excluded by `CONTEXT.md`.

## Interaction and Motion

**Interaction philosophy:** Interaction should reveal authority, consequence, and continuity. A user action must make it clear who acted, what state changed, which financial classification changed, and where the result can be verified next.

**Scroll behavior:** Use native browser scrolling. This is a productivity application with tables, modals, keyboard users, and a presentation path; weighted or transformed scrolling would reduce control. Use sticky headers and local sticky action areas where they improve orientation.

**Micro-interaction system:**

- Apply consistent hover, focus-visible, pressed, loading, success, disabled, and validation states to every interactive element.
- Use a 2 px blue focus ring with at least 2 px offset on light surfaces.
- Keep control feedback within 120–180 ms. Use opacity, border, background tone, and at most 2 px of movement.
- On request selection, highlight the row and update the detail pane without losing queue position.
- On role switch, update the actor context first, then refresh queues and actions. Briefly label the new role; never animate the role as if it were authentication.
- For unavailable actions, show a short explanation such as “Available to Finance Reviewer at the Finance approval stage” rather than leaving a disabled button unexplained.

**Motion character:** Precise, weighted, and brief. Use a standard ease-out such as `cubic-bezier(0.22, 1, 0.36, 1)` for 180–260 ms panel and state transitions. Reserve a 320–420 ms shared-layout transition for the two financial reclassification moments in the demo.

**Signature financial transitions:**

1. **Finance approval:** Highlight the current Available to commit, show the request amount as the applied delta, then settle the new Approved unpaid commitment and projected remaining value. Do not imply money was paid.
2. **Payment confirmation:** Visually transfer the approved amount from Approved unpaid commitments to Payment-confirmed spend while Available to commit remains anchored and unchanged. Follow with a concise confirmation summary and Activity History entry.

The static before/after values must remain fully understandable if the animation does not run.

**Reduced motion:** Remove shared-layout movement and replace it with an immediate value update, a brief background highlight, and explicit text describing the change. Preserve focus location and do not auto-scroll the user.

## Application Shell

### Persistent Navigation

- Product mark and title: `Budget Execution`.
- Primary destinations are role-scoped: company Overview for Finance Reviewer and Executive Viewer, department-scoped Overview for Department Budget Owner, department-scoped Projects for Requester/Line Manager/Budget Owner, and Request Workspace for every role.
- Current financial year: `FY2027`.
- Persistent simulated actor control showing person, role, and department.
- `Reset Demo Data` as a secondary utility action, visually separated from normal workflow actions and protected by confirmation.

The active role is part of the page context, not a developer-only widget. Role changes must immediately explain why queues and actions changed.

### Status Language

Use complete status labels in user-facing detail views:

- Awaiting Line Manager Approval
- Awaiting Budget Owner Approval
- Awaiting Finance Approval
- Approved — Awaiting Payment Confirmation
- Payment Confirmed
- Rejected

Compact table rows may use shorter labels only when the full status is available in adjacent or accessible text. Pair status with the next responsible role wherever possible.

## Page and Workflow Narrative

| # | Surface | Narrative job | Content and composition | Interaction or motion |
| --- | --- | --- | --- | --- |
| 1 | Overview | Establish the source and current company position | Page title and FY2027 context; one continuous position strip for Approved Budget, Allocated to Projects, Department Unallocated Budget, Approved unpaid commitments, and Payment-confirmed spend; department table below; project spotlight entry highlighted | Values appear without count-up. Selecting the project spotlight moves into Project Detail with project context preserved |
| 2 | Projects | Make project records discoverable without putting one project in global navigation | Project list with owner, status, dates, allocation, available-to-commit amount, and related request count | Selecting a project opens its Project Detail; Projects remains the active parent destination |
| 3 | Project Detail | Explain the cross-department project without losing ownership | Project identity, owner, dates, and status; a four-value financial equation for Project Allocation, Approved unpaid commitments, Payment-confirmed spend, and Available to commit; department-allocation table; related requests | Selecting an allocation emphasizes its row. `New Request` opens with the relevant Project Allocation preselected when the requester owns one |
| 4 | New Request modal | Create a valid request against one explicit Funding Source | Funding-source type first; then Budget Line and Project Allocation when applicable; current Available to commit stays visible beside requested amount; derived department, approvers, and project are read-only context | Reveal only relevant fields. Validate relationships immediately. Submission closes the modal, selects the new request, and shows that financial figures did not change |
| 5 | Request Workspace queue | Make role-owned work obvious | Tabs for All Requests, My Approvals, and Awaiting Payment Confirmation; compact list at left, selected detail at right; row shows title, amount, status, next actor, and required date | Role switch updates tab counts and available actions without resetting the selected request when it remains visible |
| 6 | Request detail | Present one authoritative request record | Identity and amount at top; status lane and pending approver; Funding Source, requester, vendor, required date, and justification; financial impact; Payment Information when present; Activity History | Active-stage actions stay in a sticky action area. Approval and rejection open focused confirmation dialogs with consequence copy |
| 7 | Finance impact preview | Make the commitment decision inspectable | Show Funding Source amount, current Approved unpaid commitments, Payment-confirmed spend, current Available to commit, request amount, and projected Available to commit in a compact equation layout | Recalculate on open. Block when projected remaining is negative; show an inline amber warning at 80% utilization without disabling approval |
| 8 | Record Payment modal | Record external evidence without implying execution | Locked approved amount; payment date, beneficiary, destination bank, transfer reference, and transfer-proof selector; accepted type and size guidance adjacent to upload | Validate proof immediately, show filename/type/size, allow replace/remove before confirmation, then run the signature reclassification transition |
| 9 | Activity History | Prove the chain of custody | One chronological ruled list with event, actor, role, timestamp, resulting status, and conditional rejection/payment metadata | New events append once and briefly highlight. Do not create generic duplicate status-change events |

## Key Surface Details

### Overview

- Present the company’s `Rp500B` Approved Budget as context, not as a celebratory KPI.
- Use a single “Budget position” strip rather than five unrelated cards. Each category receives a definition affordance because the figures are related but not interchangeable.
- Make the department table the primary analytical surface. Use sticky headers, right-aligned tabular amounts, and a clear Technology row.
- Place the project spotlight directly below or alongside the table as a project object with its total Project Allocation and contributing departments.
- Keep `New Request` available only to Requester roles and secondary to their project/workspace context.

### Project Detail

- Lead with the selected project name, owner, dates, status, and total Project Allocation.
- Use a labeled equation row rather than a generic chart: Allocation minus Approved unpaid commitments minus Payment-confirmed spend equals Available to commit.
- In the department-allocation table, keep department ownership adjacent to Budget Line and Project Allocation.
- Make Technology’s `Rp800M` allocation and its opening `Rp200M` Payment-confirmed spend easy to locate during the demo.
- Use direct row links to related requests. Keep Projects as the parent list and avoid a separate department detail route.

### Request Workspace

- Use a responsive split view around 38/62 at wide desktop sizes. The request list remains compact; the selected record owns the visual hierarchy.
- Put status, next responsible role, and the currently simulated role near one another so action availability is self-explanatory.
- Separate “Request facts,” “Budget impact,” “Payment Information,” and “Activity History” with ruled sections, not nested card stacks.
- Give `Approve`, `Reject`, and `Record Payment` distinct semantic weight. Only one primary action should exist for the active role and state.
- Rejection requires a reason and previews its terminal effect. Use red inside the confirmation flow, not across the entire request.
- Payment Information is absent before confirmation, not shown as an empty placeholder.

## Responsive Behavior

The implementation uses this viewport contract: at 1280 px and above the full rail and split Request Workspace remain available; from 761–1279 px the workspace stacks before either pane becomes unreadable and wide tables expose an overflow cue; at 760 px and below the shell uses an equal-width navigation grid, a separate actor/reset utility area, a two-column status lane, and a near-full-height dialog with one scrolling body. At every width, primary actions remain at least 44 px high, overflow tables keep a sticky first column, and Funding Source, amount, status, next actor, and financial effect remain visible.

- **Large screens (1280 px and above):** Show the full navigation rail, position strips in one row, wide tables, and Request Workspace split view. Optimize the primary demo for a 1440×900 viewport.
- **Medium screens (761–1279 px):** Keep the labeled rail, wrap metric strips into two rows, stack Request Workspace before the panes become unreadable, and show table overflow cues.
- **Small screens (760 px and below):** Use the compact equal-width navigation grid, one-column page flow, near-full-height dialogs, and a stacked workspace. Keep the active role and current status visible. Allow wide financial tables to scroll horizontally with a sticky first column rather than hiding columns.
- **Touch behavior:** Provide at least 44×44 px action targets, avoid hover-only disclosure, and keep modal actions above the browser safe area.
- **Cross-breakpoint invariants:** Never hide Funding Source, amount, status, next responsible role, or financial effect. Preserve all domain labels and do not reduce status to color-only dots.

## Content and Voice

- **Voice:** Direct, neutral, and operational. Use plain language without becoming casual.
- **Headlines:** Name the object or decision: “Budget position,” “Ramadan Campaign,” “Finance impact,” and “Record external payment.”
- **Explanatory copy:** State consequence before instruction. Example: “Finance approval creates an Approved unpaid commitment of Rp150M. No payment is executed.”
- **Actions:** Use verbs tied to the actor’s responsibility: `Submit request`, `Approve business need`, `Authorize budget use`, `Approve financial control`, and `Confirm external payment` where space allows. Dialog titles may carry the fuller language while buttons remain concise.
- **Validation:** Name the problem and the fix near the relevant field. Do not use toast-only errors.
- **Domain language:** Treat `CONTEXT.md` as authoritative. Preserve capitalization and avoid all listed substitute terms.

## Implementation Direction

No application stack is present in the current repository. For the six-hour prototype, use:

- **Framework:** React, TypeScript, and Vite.
- **Styling:** Tailwind CSS with CSS custom properties for the tokens in this brief.
- **Components:** Headless primitives or shadcn/ui only where they save implementation time; restyle them to the visual language rather than shipping defaults.
- **Icons:** Lucide React with text labels for navigation and consequential actions.
- **Motion:** CSS transitions for routine feedback. Use Framer Motion only for selected-detail continuity and the two signature financial transitions; omit it if the same clarity can be achieved reliably with CSS.
- **State and persistence:** Keep canonical structured records in one client-side domain store and persist them in browser storage. Derive all totals from shared records.
- **Forms:** Use explicit schemas and immediate field-level validation for Funding Source relationships, amounts, approval guards, and proof metadata.
- **Testing:** Use Vitest for domain calculations and workflow transitions. Visual polish must not move financial logic into components.

### Performance Budget

- Avoid large image assets; the interface should require none.
- Load at most the primary variable sans font and optional small monospace subset, or use system fallbacks.
- Keep motion transform/opacity-based and avoid animating large table layout.
- Target immediate local interactions and smooth signature transitions on a representative mid-range laptop.
- Do not add smooth-scroll, charting, or animation libraries unless a required surface clearly justifies their cost.

### Accessibility

- Use semantic headings, tables, form controls, dialogs, tabs, and status text.
- Maintain a logical keyboard order, visible focus, focus trapping and restoration for modals, and keyboard-operable role switching.
- Announce successful workflow transitions and validation summaries through an appropriate live region without duplicating visible content.
- Connect errors and help text to fields programmatically.
- Do not rely on color, spatial position, or motion alone to communicate a financial state.
- Respect `prefers-reduced-motion` and preserve the complete before/after explanation without animation.

## Acceptance Criteria

- A reviewer can identify the active simulated actor, their role, the selected request’s status, and the next responsible role without opening another screen.
- Overview, Projects, Project Detail, and Request Workspace display the same underlying amounts with the exact PRD terminology and consistent rupiah formatting.
- The `Rp150M` Finance approval visibly creates an Approved unpaid commitment and changes Available to commit from `Rp600M` to `Rp450M`.
- Payment confirmation visibly changes Approved unpaid commitments from `Rp150M` to `Rp0` and Payment-confirmed spend from `Rp200M` to `Rp350M` while Available to commit remains `Rp450M`.
- Line Manager and Department Budget Owner approvals produce no visual or numeric implication of commitment or payment.
- Status is always expressed with text and never depends on color alone.
- Every active control has visible hover, focus, pressed, loading, and result feedback; inactive actions explain their role or stage restriction.
- New Request prevents incompatible department, Budget Line, project, and Funding Source combinations before submission.
- Finance impact preview presents current, delta, and projected figures together and shows the 80% warning inline.
- Record Payment validates proof type and size immediately, displays only metadata, and never suggests the transfer occurred inside the product.
- Activity History records each meaningful event once with actor, role, timestamp, resulting status, and conditional metadata.
- The primary desktop demo contains no dead controls, placeholder navigation, clipped tables, or layout shift during role changes.
- At small widths, all required information and actions remain reachable even when tables require controlled horizontal scrolling.
- Reduced-motion mode preserves every financial and workflow distinction through immediate values, text, and focus management.

## Assumptions and Open Questions

- **Assumption:** The product name is `Budget Execution` until a branded name is supplied.
- **Assumption:** The prototype is presented primarily at 1440×900 or a similar desktop viewport.
- **Assumption:** React, TypeScript, Vite, and Tailwind CSS are proposed because no existing application stack is present in the repository.
- **Assumption:** `PRD.md`, `CONTEXT.md`, and `BUILD-SCOPE.md` remain authoritative when this design brief omits detailed business rules.
- **Open question:** Confirm whether the team wants `Geist` bundled or prefers a system-only typography stack for the six-hour build.
