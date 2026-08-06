# Design Audit Implementation Plan

**Prepared:** 2026-08-06  
**Scope:** Current Budget Execution working tree and the visual/accessibility audit captured in the Codex in-app Browser.  
**Primary evidence:** `C:\Users\USER\.codex\visualizations\2026\08\06\019fd52f-b1ab-75a0-94ff-60cb1fee7731\budget-management-audit\`  
**Implementation constraint:** Preserve the dependency-free JavaScript, CSS, and Node test setup unless a separate decision explicitly approves a framework or browser-test dependency.

## Outcome

Make the primary Budget Execution walkthrough presentation-ready and reliably usable at desktop and phone widths. The work should correct the broken New Request dialog, remove ambiguous or invalid allocation actions, make the Request Workspace fit its container, and close the confirmed keyboard, validation, contrast, and responsive-layout gaps.

The implementation is complete when a reviewer can:

1. Create a valid Technology request without seeing clipped controls, duplicate scroll regions, or `undefined` text.
2. Understand exactly which Project Allocation is selected and which Funding Source the requester is allowed to use.
3. Complete form validation and recover from errors with a mouse, keyboard, or assistive technology.
4. Inspect Overview, Project Detail, and Request Workspace at the target viewport matrix without essential content or actions being clipped.
5. Complete the canonical workflow without changing the established financial calculations or role-separation rules.

## Scope boundaries

### Included

- New Request modal composition, action placement, focus, validation, and responsive behavior.
- Role-aware New Request entry points.
- Department allocation selection and request-action behavior.
- Overview, project-table, navigation, and Request Workspace responsive reflow.
- Workspace tabs, status progression, impact figures, and Activity History presentation.
- Text contrast, focus visibility, target sizes, and dialog/form semantics.
- Focused regression coverage and updates to the manual browser checklist.
- Documentation changes needed to keep `DESIGN.md`, the implementation, and the reviewer walkthrough consistent.

### Not included

- A React, TypeScript, Tailwind, or component-library migration.
- New project-allocation governance, project creation, accounting, bank, ERP, or authentication features.
- Changes to the canonical financial formulas unless a regression is discovered while implementing this plan.
- Full WCAG certification or cross-browser certification.
- Full browser-level end-to-end automation unless the dependency-free constraint is separately changed.

## Implementation principles

- Keep one authoritative action per task. Do not make a row clickable when it already contains an action.
- Never silently substitute a different Funding Source from the one the user selected.
- Give each state one visual treatment. “Selected,” “eligible,” and “demo path” must not look interchangeable.
- Use one scroll region per modal. Headers and actions must remain available while long content scrolls.
- Preserve native semantics before adding ARIA. Tables remain tables, buttons remain buttons, and radio groups expose real radio behavior.
- Treat the current financial terminology and calculation functions as stable contracts.
- Prefer small, reviewable commits that leave the canonical walkthrough usable after each phase.

## Phase 0 — Baseline and safeguards

**Size:** Small  
**Dependencies:** None

### Work

- [ ] Record the current successful output of `node --test` and `node --check src/main.js`.
- [ ] Reset browser demo data and confirm the canonical Technology values before changing UI code.
- [ ] Preserve the current audit screenshots as the “before” evidence set.
- [ ] Add the viewport matrix below to `MANUAL-TEST-CHECKLIST.md` if it is not already explicit.
- [ ] Confirm that unrelated uncommitted work remains untouched.

### Viewport matrix

| Width × height | Purpose |
| --- | --- |
| 1440 × 900 | Primary presentation target |
| 1280 × 720 | Minimum desktop demonstration target |
| 1024 × 768 | Medium-width workspace and table reflow |
| 760 × 844 | Existing small-screen breakpoint boundary |
| 390 × 844 | Phone-sized navigation, modal, and action reachability |

### Exit criteria

- Baseline domain/server tests pass.
- The before-state screenshots and canonical values are available for comparison.
- No implementation file has been changed yet.

## Phase 1 — Repair the dialog contract and layout

**Priority:** P0  
**Size:** Medium  
**Primary files:** `src/main.js`, `src/styles.css`

### 1.1 Correct the `modalShell` call contract

- [ ] Pass New Request body and footer as separate third and fourth arguments.
- [ ] Ensure every `modalShell` caller provides an explicit footer string; default the shell parameter to `''` as a defensive fallback.
- [ ] Add a rendering guard so the literal strings `undefined` and `null` can never enter modal markup.
- [ ] Keep Cancel/Close and Submit actions inside `.modal-footer`, not adjacent to the form body.

### 1.2 Introduce a three-region dialog

Implement this behavior without changing the domain form payload:

```text
dialog
├── header: title, description, close button
├── body: the only vertically scrolling region
└── footer: Cancel/Close and primary action
```

- [ ] Change `.modal` to a grid with `grid-template-rows: auto minmax(0, 1fr) auto`.
- [ ] Set `.modal` to `overflow: hidden`.
- [ ] Move vertical scrolling to a dedicated `.modal-body` or the form body.
- [ ] Keep header and footer visible while the form scrolls.
- [ ] Align desktop actions to the right with consistent spacing.
- [ ] At phone width, use a full-height or near-full-height `100dvh` dialog with one scrollbar and safe-area-aware footer padding.
- [ ] Prevent the document behind the dialog from scrolling while the dialog is open.
- [ ] Preserve backdrop click, Escape, focus trap, inert background, and opener-focus restoration.

### 1.3 Make the global entry point role-aware

- [ ] Render `New Request` only for Requester roles.
- [ ] For non-Requester roles, remove the dead-end primary CTA rather than opening a warning-only dialog.
- [ ] Keep the simulated actor control as the explicit path for switching into the Requester role.
- [ ] Confirm Project Detail request actions follow the same role/eligibility policy.

### Acceptance criteria

- [ ] No dialog state contains the visible text `undefined` or `null`.
- [ ] New Request actions remain visible at 1280 × 720 and 390 × 844.
- [ ] The phone dialog has exactly one vertical scrollbar.
- [ ] The header, close button, Cancel/Close action, and primary action are reachable without page scrolling.
- [ ] Finance Reviewer, Finance Payment Processor, and Executive Viewer do not see an actionable New Request CTA.
- [ ] Existing approval, rejection, and payment dialogs still render valid footers.

## Phase 2 — Make the request form accessible and recoverable

**Priority:** P1  
**Size:** Medium  
**Primary files:** `src/main.js`, `src/styles.css`

### 2.1 Required-field and description semantics

- [ ] Add `required` to Title, Vendor or recipient, Requested amount, Required date, and Business justification.
- [ ] Add `required` to the selected Funding Source control when the source is not derivable automatically.
- [ ] Give the dialog description a stable ID and reference it through `aria-describedby` on the dialog.
- [ ] Only include IDs in `aria-describedby` when the referenced helper or error node exists.
- [ ] Keep each visible label programmatically associated with exactly one control.

### 2.2 Error announcement and focus

- [ ] Render a concise error summary at the start of the form when submission fails.
- [ ] Give the summary `role="alert"` or an equivalent assertive live behavior.
- [ ] After validation, focus the first invalid field and let the modal body scroll it into view.
- [ ] Preserve entered values, selected Funding Source, and form scroll position where appropriate.
- [ ] Clear a field error when the field becomes valid without wiping unrelated errors.
- [ ] Keep availability failures attached to Requested amount and include the maximum valid amount.

### 2.3 Segmented Funding Source control

- [ ] Give both radio inputs stable IDs and keep them in one named fieldset.
- [ ] Add a visible proxy focus style using `label:has(input:focus-visible) span`.
- [ ] Ensure each segment is at least 44px high at touch widths.
- [ ] Confirm arrow-key radio navigation works through native browser behavior.
- [ ] Do not leave keyboard focus on an invisible, offscreen control without a visible label state.

### Acceptance criteria

- [ ] Submitting an empty form announces that errors exist and focuses Title.
- [ ] Every required control is announced as required.
- [ ] Tab and Shift+Tab always show a visible focus indicator.
- [ ] Keyboard focus never moves to an invisible offscreen radio without a visible proxy outline.
- [ ] Correcting an error does not reset the dialog to the top unnecessarily.
- [ ] Mouse, keyboard, and touch users can complete the same request fields.

## Phase 3 — Redesign Department Allocation selection and actions

**Priority:** P1  
**Size:** Medium  
**Primary files:** `src/main.js`, `src/styles.css`, optionally `src/domain/store.js`

### 3.1 Separate table reading, selection, and request creation

- [ ] Remove `role="button"`, `tabindex`, `aria-selected`, and `data-action="select-allocation"` from `<tr>` elements.
- [ ] Keep rows as native table rows with row headers and cells.
- [ ] Add one explicit selection control in the Department cell if selection is still needed to filter related requests.
- [ ] Give the selection control an accessible name such as `Select Technology allocation` and an `aria-pressed` or native radio state.
- [ ] Use one selected-row treatment: a restrained background plus one leading accent, not overlapping “selected” and “demo” fills.
- [ ] Keep `Selected demo path` as supporting copy only when it cannot be confused with selection state.

### 3.2 Enforce Funding Source eligibility in the UI

- [ ] Derive eligible allocations from `getFundingSourcesForRequester()` or a shared eligibility helper.
- [ ] Default a Requester to the allocation owned by their department; Alya must default to Technology, not Marketing.
- [ ] Show `Create request` only when the active Requester can use the selected allocation.
- [ ] For other departments, omit the action or show a non-interactive explanation such as `Owned by Marketing`.
- [ ] Never open New Request with an invalid allocation and then silently fall back to another source.
- [ ] Add a defensive guard in `open-allocation-request` that rejects an ineligible allocation before opening the dialog.

### 3.3 Connect selection to a visible result

- [ ] Filter or emphasize Related requests using `selectedAllocationId`.
- [ ] Place one contextual CTA near the filtered result: `Create request using Technology allocation`.
- [ ] Add an explicit Actions column header only if row-level actions remain in the final design.
- [ ] Keep full financial values and department ownership visible regardless of selection.

### Acceptance criteria

- [ ] Exactly one allocation has selected styling.
- [ ] Alya’s initial selected allocation is Technology.
- [ ] Marketing, Operations, and Creative never offer Alya a functional request action.
- [ ] No interactive table row contains another interactive control.
- [ ] The selected allocation changes the related-request context or there is no selection affordance at all.
- [ ] The final table fits at 1280px without clipping an eligible action.

## Phase 4 — Repair responsive reflow and workspace density

**Priority:** P1  
**Size:** Large  
**Primary files:** `src/styles.css`, `src/main.js`, `DESIGN.md`

### 4.1 Overview and project tables

- [ ] Keep `.table-wrap` as the intentional overflow owner where all columns cannot fit.
- [ ] Add a visible overflow cue such as a fade edge or `Scroll for more columns` instruction when overflow exists.
- [ ] Keep the Department column sticky during horizontal scrolling at small and medium widths.
- [ ] Reduce avoidable width by removing invalid repeated actions and using compact but unambiguous headings.
- [ ] Verify the final column and action are reachable with keyboard and touch scrolling.

### 4.2 Request Workspace

- [ ] Replace the fixed-width status lane with an adaptive grid or wrapping layout; remove the permanent horizontal scrollbar at desktop widths.
- [ ] Let stage labels wrap while retaining their full text and order.
- [ ] Resize the list/detail split so the detail pane has enough room for four financial values.
- [ ] Stack list and detail before either pane becomes unreadable; document the actual breakpoint in `DESIGN.md`.
- [ ] Change Budget impact from four columns to two columns before monetary values clip.
- [ ] Keep the action bar, current status, and next responsible actor visible in stacked mode.
- [ ] Make the tab row fit or expose a deliberate scroll treatment without a raw always-visible scrollbar.

### 4.3 Small-screen shell

- [ ] Prevent primary navigation labels from being visibly cut off.
- [ ] Use equal-width navigation items, a controlled horizontal scroller with edge cues, or a compact drawer; choose one pattern and document it.
- [ ] Keep the actor selector readable at 390px.
- [ ] Separate Reset Demo Data from the actor identity so the two controls do not compete visually.
- [ ] Confirm all primary actions remain at least 44px high.

### Acceptance criteria

- [ ] No essential action or monetary value is clipped at any target viewport.
- [ ] Request Workspace has no permanent desktop horizontal scrollbar in the tab row or status progression.
- [ ] Tables that intentionally scroll expose a clear cue and a reachable final column.
- [ ] At 390px, navigation labels, actor selection, dialog actions, and form controls remain legible and reachable.
- [ ] The implementation and `DESIGN.md` describe the same breakpoints and reflow behavior.

## Phase 5 — Correct visual tokens and information presentation

**Priority:** P2  
**Size:** Small  
**Primary files:** `src/styles.css`, `src/main.js`

### 5.1 Contrast and type

- [ ] Replace `--faint: #82909a` with a color that reaches at least 4.5:1 on both white and the application canvas; `#66716c` is a viable starting candidate.
- [ ] Raise placeholder contrast from `#9da8a1`; prefer the updated faint token or `--muted`.
- [ ] Avoid using 10px text for instructions, errors, or financial context; target at least 11–12px with sufficient contrast.
- [ ] Recheck amber, teal, blue, and red text on their tinted surfaces after token changes.

### 5.2 Activity History cleanup

- [ ] Render payment evidence in one place only.
- [ ] Remove the post-render `event-evidence` duplication or consolidate all required metadata into `renderEvent()`.
- [ ] Keep resulting status, amount, bank, reference, filename, MIME type, and size readable without repeating the same evidence line.

### 5.3 Content consistency

- [ ] Use sentence case consistently for action labels.
- [ ] Replace the generic `Focused decision` kicker on creation forms with task-specific context such as `Expense request`.
- [ ] Use `Create request` for allocation-scoped actions and `New request` for the global entry point.
- [ ] Keep exact PRD terms for Funding Source and financial classifications.

### Acceptance criteria

- [ ] Normal helper and instructional text reaches at least 4.5:1 contrast on its actual background.
- [ ] Payment evidence appears once per event.
- [ ] Action labels clearly distinguish global request creation from allocation-scoped creation.
- [ ] No content change weakens the established financial terminology.

## Phase 6 — Regression coverage and final design QA

**Priority:** Required for completion  
**Size:** Medium  
**Primary files:** `tests/domain.test.js`, optional pure-render test module, `MANUAL-TEST-CHECKLIST.md`, `README.md`

### 6.1 Automated checks within the current stack

- [ ] Keep all existing domain and server tests passing.
- [ ] Add a domain/policy test proving Alya can use only Technology-owned Funding Sources.
- [ ] Add a domain/policy test proving an ineligible allocation is rejected rather than substituted.
- [ ] If necessary, extract modal and project-table template functions into a small pure module so Node tests can assert:
  - New Request markup does not contain `undefined` or `null`.
  - footer actions are rendered in `.modal-footer`.
  - project rows retain table semantics and do not have nested buttons.
  - invalid department allocations do not render active request actions.
- [ ] Do not add a heavy UI framework solely to support tests.

### 6.2 Manual Browser regression cases

Add or update checklist items for:

- [ ] New Request actions visible at the top and bottom of every target viewport.
- [ ] No nested modal/document scrollbars at phone width.
- [ ] Empty submission announces errors and focuses the first invalid field.
- [ ] Segmented radio focus remains visible through keyboard navigation.
- [ ] Finance and Executive roles do not see a dead-end New Request CTA.
- [ ] Technology is the eligible/default allocation for Alya.
- [ ] Invalid department actions cannot open a request or silently fall back.
- [ ] Workspace tabs, status lane, impact values, and project actions do not clip.
- [ ] Overview/project table overflow has an explicit cue and reachable final column.
- [ ] Activity History has no duplicate evidence.
- [ ] Reduced-motion mode preserves all state explanations.

### 6.3 Visual comparison

- [ ] Capture after-state screenshots using the same viewport and state as the accepted audit evidence.
- [ ] Compare before and after for layout, padding, focus, clipping, scrollbar count, action placement, and text contrast.
- [ ] Reject any screenshot with loading state, crop, wrong role, or stale fixture values.
- [ ] Store the accepted after-state set next to the existing audit folder with ordered filenames.

### Final verification commands

```text
node --check src/main.js
node --check src/domain/store.js
node --check server.mjs
node --test
```

### Definition of done

- [ ] All automated checks pass.
- [ ] Every manual regression item passes at all target viewports.
- [ ] The canonical request, three approvals, payment confirmation, and reset walkthrough still reconcile financially.
- [ ] No screenshot contains clipped essential content, competing scroll regions, ambiguous selection, invisible focus, or literal `undefined`/`null` output.
- [ ] `DESIGN.md`, `README.md`, and the manual checklist match the implemented interaction and responsive rules.
- [ ] Unrelated working-tree changes remain intact.

## Suggested commit sequence

1. `fix(ui): repair modal body and footer contract`
2. `fix(a11y): add request validation focus and form semantics`
3. `fix(projects): make allocation selection explicit and eligible`
4. `fix(responsive): reflow tables workspace and mobile shell`
5. `fix(ui): raise contrast and deduplicate activity evidence`
6. `test(ui): add render contracts and browser regression checklist`
7. `docs(design): align responsive and interaction specifications`

Each commit should pass `node --test` and the relevant subset of the manual browser checks before the next phase begins.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Replacing `root.innerHTML` during validation continues to destroy focus | Set an explicit post-render focus target, or isolate form rendering so validation does not rebuild the whole shell. |
| CSS fixes solve one viewport and break another | Verify every phase against the full viewport matrix, not only 390px and 1280px. |
| Allocation UI disagrees with domain authorization | Derive eligibility from one shared policy/helper and test both the helper and rendered actions. |
| Removing repeated actions makes request creation harder to find | Place one contextual CTA beside the selected allocation or Related requests heading. |
| Stronger text colors make the interface feel visually heavy | Preserve hierarchy through size, spacing, and weight instead of low-contrast text. |
| UI test extraction grows into a framework rewrite | Extract only pure render/policy seams needed for regression checks; keep the application runtime unchanged. |

