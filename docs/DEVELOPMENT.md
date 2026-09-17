# Development and release checks

Development tooling requires a current Node compatible with Vite 8 (CI uses Node
24). Runtime consumers need Vue ^3.5.0 and a Vue-capable bundler. All tools are
devDependencies; package runtime dependencies remain empty.

```sh
npm ci --ignore-scripts
npx playwright install chromium
npm run typecheck
npm test
```

On Linux CI, install browser system dependencies with
`npx playwright install --with-deps chromium`.

## Gates

- typecheck validates TypeScript and Vue SFC source under strict compiler settings.
- test:static compiles all 41 component SFCs and 2 examples, checks public
  imports/type declarations and verifies public TSDoc through TypeScript's symbol API.
- test:types checks valid/invalid public TypeScript usage.
- test:browser runs isolated Playwright regressions with external requests blocked;
  axe checks focus/name/form surfaces. Tall-modal tests cover light/dark and all
  three densities at narrow viewport sizes.
- test:package packs with lifecycle scripts disabled, installs the archive into a unique temporary consumer
  using the npm cache and downloading missing registry data, type-checks it, builds it and renders a button
  with the installed package. It verifies fonts and excludes dev/test artifacts.
- npm run dev runs only tests/fixture. Select a scenario through ?mode=select,
  rte, overlay, tall, table, command, lightbox or toaster.

No gate loads a consumer environment file, starts a backend or connects to an
application database/API. npm may contact the package registry during installation.
Generated files stay under ignored .test-output. Do not run these
checks against a live application. There is no library dist output.

## Public documentation style

- Write public comments in English with `/** */` TSDoc blocks.
- Put component and prop documentation in `index.d.ts`; npm consumers resolve this
  file through the package `types` and `exports` fields.
- Add `@param name - description` for each public function argument and `@returns`
  for every non-constructor function, including methods returned by composables.
- State defaults, side effects, shared singleton state and important input rules.
- Keep implementation comments short and use `//` only for internal behavior.
- Import examples from `nergous-ui-vue`; do not reference application-local aliases
  or integration-specific frameworks.

## README screenshots

Run `npm run screenshots` after installing Chromium. The script builds only
the repository examples in an isolated temporary directory, disables env loading,
blocks external browser requests and writes three PNGs to `docs/screenshots/`.
Review the images before committing them. README uses absolute repository URLs
so the previews also work when rendered outside GitHub. No image files are shipped
in the npm archive.

The CI test step uses a fresh npm cache so archive installation cannot silently
depend on registry metadata left over from an earlier run.

## Release checklist

1. Resolve regressions and run npm test on the approved working tree.
2. Inspect npm pack --dry-run and review API/migration notes.
3. Select the release version, update package/lockfile and changelog consistently.
   Move the changes being released from Unreleased into the selected version section.
4. Review the registry/account/access policy before publishing. CI only validates;
   it has read-only repository permissions and does not publish or deploy.
5. Test the actual versioned archive in each consumer. Commit consumer lockfiles
   and retain a rollback reference before removing legacy vendored copies.

Automated baseline is Chromium. Firefox, WebKit, touch/IME input and real
screen-reader verification are not implied by a passing Chromium/axe run. Add
those checks for the supported product browser matrix; do not claim comprehensive
accessibility certification from the smoke suite.
