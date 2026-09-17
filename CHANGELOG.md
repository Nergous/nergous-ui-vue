# Changelog

All notable changes to the nergous-ui-vue design system are documented here.
The project loosely follows [Semantic Versioning](https://semver.org/).

## Unreleased

### Fixed

- Restore cache-first archive installation with registry fallback so clean CI
  runners can resolve Vue without bypassing peer dependency validation.

### Added

- Real light/dark component and admin screenshots in README, with a reproducible
  isolated capture command. Screenshot assets stay outside the npm package.
- TSDoc for public components, props, events, slots, composables and formatter
  return values, with an automated TypeScript symbol-documentation gate.

## v1.0.3 — 2026-09-16

### Changed

- Renamed package and repository from `nergous-cit-ui-vue` to
  `nergous-ui-vue`. Update dependency names, import paths, vendored folder
  names and GitHub URLs when upgrading to this release.
- Make npm package installation the primary documented workflow; replace vendored
  imports and remove obsolete snapshot download instructions.
- Exclude maintainer development notes from the npm archive while retaining API
  and migration documentation. Ignore local agent notes and generated tarballs.
- Require offline archive consumer installation and validate the allowed package
  files to prevent development artifacts from entering releases.

### Fixed

- Import NToaster in the toast example and document the public stylesheet export.
- Correct outdated migration and release guidance.

## v1.0.2 — 2026-09-15

### Production stabilization — 2026-09-15

- Sanitize editor HTML on mount, external updates, paste and drop; reject unsafe
  and obfuscated URLs, preserve keyboard selection and drop caret placement.
- Guard/validate theme storage and retain legacy preference keys/reset class.
- Coordinate overlay layering/inertness and focus restoration, bound tall modals,
  add `dialogLabel`, and float select/dropdown popups outside scroll clipping.
- Fix disabled/loading link activation, table checkbox keyboard, stale pagination,
  searchable-select ARIA/Tab/focus, async palette selection and initial lightbox arrows.
- Enforce dropzone type/count, fit mobile toasts, honor scroll offset and return
  an em dash for empty/invalid number input. Improve error-text contrast.
- Add TypeScript contracts, isolated browser/axe regressions, SFC/export checks,
  cache-first archive consumer smoke and CI, with no new runtime dependency.
- Document package installation, API, migration and release checks. No registry
  publication or consumer synchronization is performed by this GitHub release.

### Fixed

- Select option clicks no longer re-activate a wrapping label and reopen the popup.
- `NSelectWithSearch` uses English search/empty labels by default; consumers can
  supply localized text through its existing props.
- Earlier modal/select fixes were shared with one vendored snapshot. The production
  stabilization above remains canonical-library-only until consumers update.

## v1.0.1 — 2026-07-18

### Added

- `NSelectWithSearch`, a searchable single-select listbox with client-side filtering.
- `rowClass` support in `NDataTable` for per-row classes.

### Fixed

- `NSelect` wraps long option labels and keeps its dropdown within the control width.
- `NToaster` vertically centers title-only and message-only single-line toasts.
- `NSelect` listboxes remain visible inside `NModal`, and Escape closes the listbox before the dialog.

## v1.0.0 — 2026-06-30

Initial release as a standalone repository (snapshot-distribution model).

First public cut of the nergous-ui-vue Vue 3 design system, extracted from an
application-local component collection:

- Themeable & density-aware design tokens (`styles/tokens.css`).
- 40 components across primitives, forms, data-display, feedback, overlays and
  navigation (including the admin-shell set: `NSidebar`, `NTopbar`, `NDataTable`,
  `NCommandPalette`, `NWizard`, `NAnchoredForm`).
- Composables: `useTheme`, `useToast`, `useScrollSpy`.
- Locale-agnostic formatting helpers (`createFormat`, `toDate`).
- Bundled Manrope + JetBrains Mono subsets.
