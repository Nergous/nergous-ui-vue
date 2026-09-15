# Public API and behavior contracts

Import only from `nergous-cit-ui-vue` (or the existing vendored barrel). Internal
component paths and composables are not supported package subpaths. All 41
component props and event/slot payloads are declared in `../index.d.ts`; the
README lists component purposes. Components are named imports, not an app plugin.

## Props, events and slots

All props are optional except `NIcon.name`. Defaults are defined next to each
component's `defineProps`. Value-based controls use string/number values and
strict equality: the number `1` does not equal the string `"1"`. Boolean controls
use booleans. Reactive option arrays must have unique values; table rows need
unique keys named by `rowKey` (default `id`).

| Components | State / events | Slots |
|---|---|---|
| NInput, NTextarea, NRichText | modelValue / update:modelValue | no content slot |
| NSelect, NSelectWithSearch, NRadioGroup, NSegmented, NTabs | modelValue / update:modelValue; options/tabs | no native option slot |
| NCheckbox, NSwitch | Boolean modelValue / update:modelValue | default label |
| NPagination | page / update:page; pages normalized to at least 1 | none |
| NModal, NDrawer | Boolean modelValue / update:modelValue, close | default; footer({close}) |
| NLightbox | index / update:index; -1 closes | none |
| NDropdown | select(item); item.action() also runs | default({open}): one trigger |
| NCommandPalette | modelValue / update:modelValue; run(command), update:query | none |
| NDataTable | selected / update:selected; row-click, sort-change({key,dir}) | cell-key({row,value}); bulk({selected,clear}); empty |
| NDropzone | files(File[]) | none |
| NSidebar | modelValue / update:modelValue; navigate(item); collapsed prop | footer({collapsed}) |
| NTopbar | toggle | left, default, right |
| NStepper, NAnchorNav | modelValue / update:modelValue | none |
| NWizard | modelValue / update:modelValue | default({step,index,count}); footer({index,count,isFirst,isLast,prev,next,goTo}) |
| NAnchoredForm | modelValue / update:modelValue | section-value({section,index}); header, status, savebar |
| NButton, NBadge, NCard, NAlert, NFormField, NTooltip, NEmptyState | presentation/native events where applicable | default |
| NIcon, NAvatar, NAvatarGroup, NStatCard, NActivityRow, NToaster, NProgress, NSpinner, NSkeleton, NBrand | presentation props; toaster uses useToast | none |

Native attributes follow the component root; NInput forwards them to its input.
Use NFormField for shared validation/label associations. For grouped controls
(NRichText, NSelectWithSearch), use `tag="div"`. When no field wrapper exists,
supply an accessible name to the actual interactive control.

## Keyboard and focus

- Buttons: native Enter/Space. Disabled/loading NButton does not activate, including
  polymorphic links. It is UI behavior, never authorization.
- Selects: Enter/Space/ArrowDown opens; arrows skip disabled choices, Home/End move
  to boundaries; Enter selects. Search select focuses its search field; Escape
  and selection restore trigger focus. Tab closes and moves to the adjacent control.
- Tabs, radio/segmented groups: arrows/Home/End use roving focus.
- Dropdown: use one button in its slot. Menu state is placed on that real trigger;
  plain-content legacy slots receive a keyboard-focusable wrapper. Enter/Space/
  ArrowDown open, arrows/Home/End navigate, Escape restores focus. Keep interactive
  content out of menu labels.
- Dialogs: only the latest active modal layer is interactive; Tab is trapped,
  Escape closes the top layer and the background stays scroll-locked until the
  last layer closes. Nested selects consume Escape first. Closing a lower layer
  preserves the final focus-return chain.
- Titleless NModal/NDrawer use `dialogLabel` (default Dialog/Panel); provide a
  localized, meaningful name. Visible title takes precedence.
- Lightbox: ArrowLeft/ArrowRight work even when initially mounted open.
- Command palette: Ctrl/Cmd+K toggles when shortcut=true. With filter=false the
  parent supplies asynchronous results; selected index is clamped after replacement.
- Table: row Enter/Space is handled only on the row itself, not in slotted controls
  or checkbox descendants. Stop click propagation on custom interactive cells.

## Editor security and compatibility

NRichText accepts/emits HTML strings. Incoming model changes, HTML paste and HTML
drop are reconstructed in an inert template with a small HTML-only tag allowlist:
b/strong/i/em/s/strike/u/h2/h3/p/br/span/div/ul/ol/li/blockquote/code/pre/a.
Scripts, foreign SVG/MathML, embedded documents, forms, inline styles, event
handlers and arbitrary attributes are not retained. Links accept http, https,
mailto, tel and relative URLs; control characters, backslashes and other schemes
are rejected. Unsafe links lose their href. Drop placement uses the pointer caret.
The toolbar remains backed by execCommand, so browser-specific editing behavior
needs manual checks before expanding the supported browser matrix.

The backend must still validate/sanitize stored content and every rendering sink.
Client cleanup is not a trust boundary for other API clients or legacy records.
Use `labels` to localize toolbar/link dialogs and `tools` to restrict formatting.

## Files and tables

NDropzone treats accept as a UI filter (extensions, exact MIME, MIME wildcards).
Drop and picker paths filter consistently; multiple=false keeps the first accepted
file. No event is emitted when none match. Browser MIME data can be missing or
spoofed: enforce MIME/signature, size and authorization on the backend.

NDataTable client pagination clamps after row-count/page-size changes; NPagination
also normalizes standalone controlled input. Server pagination belongs to the
consumer. Use manualSort with sortKey/sortDir for server sorting.

## Composables

- useTheme(): shared theme/density refs, toggle(), setTheme(), setDensity().
  Allowed values: light/dark; compact/comfortable/spacious. Storage failure falls
  back safely; invalid values normalize. Legacy keys are read only when new keys
  are absent. See migration for anti-flash HTML.
- useToast(): shared toasts plus push(string|options), dismiss(id), pauseAll(),
  resumeAll(), success/error/warning/info(title,msg). duration=0 disables dismissal.
  Mount NToaster once.
- useScrollSpy(ref|getElement,{offset}): active ref, scrollTo(value), recompute().
  Sections use data-spy and offsetTop relative to a positioned scroll container.
  Offset may be a number/getter and applies to both tracking and scrolling.
- createFormat(locale): formatDateTime, formatDateShort, formatRelative,
  formatNumber, toDate. Empty/invalid display input returns an em dash; numeric zero
  remains zero. toDate returns Date|null. Date strings should be ISO 8601.

## Boundaries

The supported/tested integration is client-rendered Vue. Theme/toast state is
module-global; do not use it as request-local SSR state. No server, router,
authentication, upload transport or database connection is included.
