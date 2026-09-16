# Development and release checks

Development tooling requires a current Node compatible with Vite 8 (CI uses Node
24). Runtime consumers need Vue ^3.5.0 and a Vue-capable bundler. All tools are
devDependencies; package runtime dependencies remain empty.

```sh
npm ci --ignore-scripts
npx playwright install chromium
npm test
```

On Linux CI, install browser system dependencies with
`npx playwright install --with-deps chromium`.

## Gates

- test:static compiles all 41 component SFCs and 2 examples and checks public
  imports/type declarations.
- test:types checks valid/invalid public TypeScript usage.
- test:browser runs isolated Playwright regressions with external requests blocked;
  axe checks focus/name/form surfaces. Tall-modal tests cover light/dark and all
  three densities at narrow viewport sizes.
- test:package packs with lifecycle scripts disabled, installs the archive offline
  into a unique temporary consumer, type-checks it, builds it and renders a button
  with the installed package. It verifies fonts and excludes dev/test artifacts.
- npm run dev runs only tests/fixture. Select a scenario through ?mode=select,
  rte, overlay, tall, table, command, lightbox or toaster.

No gate loads a consumer environment file, starts a backend or connects to a
database/API. Generated files stay under ignored .test-output. Do not run these
checks against a live application. There is no library dist output.

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
