# Migrating consumers to the package

Use this guide when replacing a legacy vendored snapshot with the npm package.
Review CHANGELOG.md for versioned changes and pending Unreleased changes.
Choose an explicitly published version or an approved local archive.

1. Preserve any application-local changes in the vendored directory and review them
   against the canonical library. Do not blindly overwrite/delete the snapshot.
2. Pack the approved canonical revision, install its local tarball (or an explicit
   published version) in the consumer, and commit its package/lockfile changes.
3. Replace imports from the vendored barrel with `nergous-ui-vue`. Remove
   obsolete ds:pull only when that consumer's migration is complete.
4. Use the package's named exports and optional `nergous-ui-vue/styles` export.
   Raw component deep imports are not public package entry points.
5. Use `nergous-ui-vue-reset` on body if the reset is desired. The older
   `nergouscit-reset` selector is retained as a compatibility alias.
6. Update the early HTML/Blade anti-flash script using the guarded/validated example
   in README. New keys: nergous-ui-vue-theme and nergous-ui-vue-density.
   Legacy nergouscit-theme/density values are read if new keys are absent; old keys
   are not deleted. The canonical constants remain exported.
7. Verify forms, popups, keyboard focus, themes/densities and mobile layout in the
   consumer before removing the old snapshot.

## Observable corrected behavior

- Editor strips unsupported markup on load as well as paste/drop. Clean existing
  content on the backend; do not depend on custom HTML attributes or unsafe URLs.
- Popups no longer live directly under their select/dropdown wrapper. Replace
  consumer ancestor-dependent CSS with component-class or token styling.
- Search input now carries combobox semantics and active-option announcements.
  Update UI tests that locate it by the former searchbox role.
- Disabled/loading links do not activate. Invalid page input emits a normalized
  update:page. Empty/invalid formatNumber values return an em dash, not zero.
- NDropzone filters types and single-file count in both picking and dropping paths.
- Titleless windows support a meaningful dialogLabel; existing titles are unchanged.

Laravel can continue using Inertia for application navigation while consuming the
same presentational Vue package. A Go-backed Vue SPA imports the same package in
its web project; API calls and routes stay in that SPA. Do not add a second copy
of Vue or the library's singleton state.

Rollback: restore the consumer's previous manifest/lockfile/import changes and
retained snapshot (or previous package version). No database migration or destructive
storage-key cleanup is part of this transition.
