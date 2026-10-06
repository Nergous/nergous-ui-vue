# Public API and behavior contracts

Import only from `nergous-ui-vue` (or the existing vendored barrel). Internal
component paths and composables are not supported package subpaths. All 52
component props and event/slot payloads are declared in `../index.d.ts`; the
README lists component purposes. Components are named imports, not an app plugin.

## Editor documentation

Public declarations in `../index.d.ts` use TSDoc comments. Component symbols,
props, events, slots, composable methods and formatter return values therefore
appear in TypeScript-aware editor hover and completion UI. Vue templates require
the editor's Vue language support so component prop information can be surfaced.

Keep public documentation on the declaration that consumers import. Use `/** */`
comments, document every public property, add `@param` for function arguments and
`@returns` for return values. Runtime source comments can explain implementation,
but they do not replace the package declaration comments used by npm consumers.

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
| NDatePicker | string modelValue / update:modelValue in the native input format of its type | none |
| NMultiSelect | array modelValue / update:modelValue, kept in options order | none |
| NCheckbox, NSwitch | Boolean modelValue / update:modelValue | default label |
| NPagination | page / update:page; pages normalized to at least 1; optional jumpable input; optional pageSize / update:pageSize with pageSizes; hideOnSinglePage with total | none |
| NModal, NDrawer | Boolean modelValue / update:modelValue, close | default; footer({close}) |
| NConfirmDialog | Boolean modelValue / update:modelValue; confirm, cancel (any dismissal) | default (below the message) |
| NPopover | update:open | default({close}); label |
| NLightbox | index / update:index; -1 closes | none |
| NDropdown | select(item); item.action() also runs | default({open}): one trigger |
| NCommandPalette | modelValue / update:modelValue; run(command), update:query | none |
| NDataTable | selected / update:selected; allMatching / update:allMatching; row-click, sort-change({key,dir}) | cell-key({row,value}); bulk({selected,allMatching,count,clear}); empty |
| NFilterChips | remove(key), reset | none |
| NColumnPicker | hidden / update:hidden | none |
| NToolbar | none | search, default, actions |
| NActionBar | dirty prop | default (actions); status({dirty}) |
| NBreadcrumbs, NSortHandle, NIconTooltip | presentation; NSortHandle forwards listeners to its button | none |
| NDropzone | files(File[]) | none |
| NSidebar | modelValue / update:modelValue; navigate(item); collapsed prop | footer({collapsed}) |
| NTopbar | toggle | left, default, right |
| NStepper, NAnchorNav | modelValue / update:modelValue | none |
| NWizard | modelValue / update:modelValue | default({step,index,count}); footer({index,count,isFirst,isLast,prev,next,goTo}) |
| NAnchoredForm | modelValue / update:modelValue | section-value({section,index}); header, status, savebar |
| NButton, NBadge, NCard, NAlert, NFormField, NTooltip, NEmptyState | presentation/native events where applicable | default |
| NIcon, NAvatar, NAvatarGroup, NStatCard, NActivityRow, NToaster, NProgress, NSpinner, NSkeleton, NBrand | presentation props; toaster uses useToast | none |

Native attributes follow the component root; NInput forwards them to its input.
NSelect, NSelectWithSearch, NMultiSelect and NDatePicker keep class/style on the wrapper and
forward other attributes (aria-label, aria-labelledby, id, listeners) to the
combobox button, so a select outside NFormField can be named with aria-label.
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

`preset="full"` widens both the toolbar and the allowlist. It adds undo/redo,
underline, subscript/superscript, H4, alignment, images, tables, horizontal rules,
links opening in a new tab and a full-screen mode (Escape leaves it). The rich
allowlist also keeps h4-h6, sub, sup, small, hr, img, figure, figcaption, table,
caption, thead, tbody, tfoot, tr, th and td; the attributes img src/alt/title/
width/height, a title/target (only `_blank`, with rel), ol start, table
border/cellpadding/cellspacing/width and th/td colspan/rowspan/scope/width; and
the inline styles text-align, float, vertical-align, width and height with
validated values. Image sources accept only http, https and relative URLs.
Requesting any full-only command through `tools` also enables this allowlist.

Images: the toolbar inserts by URL, or through `pickImage` (an async callback
that resolves `{ src, alt }`, e.g. from a media library). Double-click an image
to edit its URL, alt text and width or remove it. Tables: insert with a row/column
count and an optional header row; while the caret is in a cell a table toolbar adds
or deletes rows/columns or the table. Tab/Shift+Tab move between cells, and Tab in
the last cell adds a row. `pickLink` adds a file button to the link dialog.
Image and table dialogs reuse the `linkConfirm`/`linkCancel` labels. The
editable area height follows the `--n-rte-min-height` and `--n-rte-max-height`
custom properties (defaults 140px and 420px).

## Files and tables

NDropzone treats accept as a UI filter (extensions, exact MIME, MIME wildcards).
Drop and picker paths filter consistently; multiple=false keeps the first accepted
file. No event is emitted when none match. Browser MIME data can be missing or
spoofed: enforce MIME/signature, size and authorization on the backend.

NDataTable client pagination clamps after row-count/page-size changes; NPagination
also normalizes standalone controlled input. Server pagination belongs to the
consumer. Set jumpable to show a validated direct page-number input; localize its
text with jumpLabel, jumpButtonLabel, totalLabel and jumpErrorLabel. Pass a
non-empty pageSizes list with v-model:pageSize to show a rows-per-page selector
labelled by pageSizeLabel; the consumer reloads data and usually resets the page.
Use manualSort with sortKey/sortDir for server sorting.

For server lists pass `total` (rows matching the filters) and
`v-model:allMatching`. Once the whole page is selected the bulk bar offers
"select all N"; then every row shows as selected, the bulk slot receives
`allMatching: true` and `count = total`, and the app sends its filters instead of
ids. Unticking a row leaves that mode and keeps the rest of the page selected.
`stacked` renders rows as label/value cards below 640px viewport width; labels
come from the column headings.

## Localization

Every built-in label has an English default. `app.use(createLocale(messages))`
provides a dictionary to the app, `provideLocale(messages)` to one subtree (merged
over an outer provider). Each label resolves as explicit prop → dictionary →
English. Dictionaries are partial `Messages` objects, refs or getters; reactive
sources switch language live. `enMessages` and `ruMessages` are built in;
`richText` holds NRichText labels and merges under its `labels` prop.
`useMessages()` returns the effective dictionary for app components.

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
  With `scroller: "ancestor"` the nearest scrolling ancestor (or the window)
  scrolls; the first section is active at the top and the last at the bottom.
- createFormat(locale, {timeZone}): formatDateTime, formatDateShort,
  formatRelative, formatNumber, formatBytes, plural, toDate. Empty/invalid display
  input returns an em dash; numeric zero remains zero. toDate returns Date|null.
  Date strings should be ISO 8601. An invalid timeZone falls back to the host zone.
- useConfirm<T>(): reactive { open, payload, loading, ask(payload), close(),
  run(action) } for NConfirmDialog; run keeps the dialog open and rethrows on error.
- useSortable(source, commit, label, {commitDelay, positionLabel}): items, list,
  draggingId, announcement, startDrag, onHandleKeydown, move. Rows are direct
  children of the positioned list with data-sort-id; render announcement in a
  polite live region. Commit receives ids once the order changed.
- useHotkeys(map, {inInputs}): window shortcuts while mounted; letters/digits
  match physical keys (works under Cyrillic layouts). Plain keys skip text fields
  unless inInputs; mod combos always fire.
- useColumnVisibility(columns, optional, storageKey): visible columns, picker
  choices and hidden keys remembered in localStorage.
- installEnterSubmit({boundary, submit}): Enter in a text field clicks the
  nearest [data-enter-submit] up to a dialog/[data-enter-scope]/boundary;
  Ctrl/Cmd+Enter in multiline fields. Returns an uninstall function.

## Boundaries

The supported/tested integration is client-rendered Vue. Theme/toast state is
module-global; do not use it as request-local SSR state. No server, router,
authentication, upload transport or database connection is included.
