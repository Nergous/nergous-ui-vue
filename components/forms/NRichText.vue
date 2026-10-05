<script setup lang="ts">
/**
 * NRichText — lightweight WYSIWYG field built on native `contenteditable`.
 * v-model holds an HTML string (e.g. "<p>Hi <b>there</b></p>"). Zero deps.
 *
 * Mirrors the other form fields: `error` paints the invalid state, `disabled`
 * locks it, `placeholder` shows while empty.
 *
 * Two presets:
 * - "basic" (default): inline formatting, H2/H3, lists, quote, link, code.
 * - "full": adds undo/redo, underline, sub/sup, H4, alignment, images, tables,
 *   horizontal rules, links opening in a new tab and a full-screen mode. The
 *   content allowlist grows with it (images, tables, layout-only inline styles).
 *
 * NOTE: this is a control GROUP (toolbar buttons + editable), not a single
 * control. When pairing with NFormField, pass `tag="div"` — a wrapping <label>
 * redirects clicks to its first labelable child (the first toolbar button),
 * stealing focus from the editor on mouseup. (NFormField with tag!="label" still
 * wires aria-labelledby through the useFormField contract.)
 *
 * Editing relies on `document.execCommand`. It is formally deprecated but is the
 * only turnkey way to format inside a contenteditable (no browser has removed it
 * and no replacement shipped). All of it is funnelled through `exec()` so a
 * future swap stays local. Table row/column edits are plain DOM operations.
 *
 * Security: incoming, pasted and dropped content is sanitized to a tag allowlist
 * before it is inserted, so no scripts/handlers enter the value. The HTML this
 * field produces must STILL be sanitized again on render — never trust it blindly.
 */
import {
    ref,
    reactive,
    computed,
    watch,
    nextTick,
    onMounted,
    onBeforeUnmount,
    type PropType,
} from "vue";
import NIcon from "../primitives/NIcon.vue";
import NModal from "../overlays/NModal.vue";
import NInput from "./NInput.vue";
import NButton from "./NButton.vue";
import NCheckbox from "./NCheckbox.vue";
import NFormField from "./NFormField.vue";
import { useFormField } from "../../composables/useFormField.ts";
import { useMessages } from "../../composables/useLocale.ts";
import { sanitizeHtml, safeUrl } from "../../utils/sanitize.ts";

const BASIC_IDS = [
    "bold",
    "italic",
    "strike",
    "h2",
    "h3",
    "ul",
    "ol",
    "link",
    "quote",
    "code",
    "clear",
] as const;
const RICH_IDS = [
    "undo",
    "redo",
    "underline",
    "sub",
    "sup",
    "h4",
    "alignLeft",
    "alignCenter",
    "alignRight",
    "alignJustify",
    "image",
    "table",
    "hr",
    "fullscreen",
] as const;
type RichTextToolId = (typeof BASIC_IDS)[number] | (typeof RICH_IDS)[number];

type TableOp =
    | "rowAbove"
    | "rowBelow"
    | "colLeft"
    | "colRight"
    | "rowDelete"
    | "colDelete"
    | "tableDelete";

type LabelKey =
    | RichTextToolId
    | TableOp
    | "toolbar"
    | "linkPrompt"
    | "linkTitle"
    | "linkConfirm"
    | "linkCancel"
    | "linkRemove"
    | "linkNewTab"
    | "linkPick"
    | "imageTitle"
    | "imageUrl"
    | "imageAlt"
    | "imageWidth"
    | "imagePick"
    | "imageRemove"
    | "tableTitle"
    | "tableRows"
    | "tableCols"
    | "tableHeader"
    | "tableInsert"
    | "tableTools";

type ActiveKey =
    | "bold"
    | "italic"
    | "strike"
    | "underline"
    | "sub"
    | "sup"
    | "ul"
    | "ol"
    | "h2"
    | "h3"
    | "h4"
    | "quote"
    | "alignLeft"
    | "alignCenter"
    | "alignRight"
    | "alignJustify"
    | "fullscreen";

interface ToolbarTool {
    id: RichTextToolId;
    cmd?: string;
    icon?: string;
    key?: ActiveKey;
    block?: "h2" | "h3" | "h4" | "blockquote";
    text?: string;
    action?: "link" | "code" | "clear" | "image" | "table" | "fullscreen";
}

type ToolbarEntry = ToolbarTool | "sep";
type RichTextLabels = Partial<Record<LabelKey, string>>;
interface RichTextImage {
    src: string;
    alt?: string;
    title?: string;
}
interface RichTextLink {
    href: string;
    text?: string;
}

const props = defineProps({
    modelValue: { type: String, default: "" },
    placeholder: { type: String, default: "" },
    error: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    // Toolbar text (button titles/aria-labels, toolbar aria-label, dialogs).
    // Neutral English defaults; the app passes localized strings at the call site.
    // Override per key — merged over DEFAULT_LABELS, so a partial object is fine.
    labels: {
        type: Object as PropType<RichTextLabels>,
        default: () => ({}),
    },
    // Toolbar and content allowlist: "basic" or "full" (images, tables, alignment…).
    preset: {
        type: String as PropType<"basic" | "full">,
        default: "basic",
        validator: (value: string) => ["basic", "full"].includes(value),
    },
    // Restrict the toolbar to these tool ids (see TOOLS_FULL). Empty = the
    // preset's set. Separators are dropped in the restricted set. Asking for any
    // "full" tool enables the rich content allowlist.
    tools: {
        type: Array as PropType<RichTextToolId[]>,
        default: () => [],
        // Inline list: defineProps is hoisted and cannot see local constants.
        validator: (value: RichTextToolId[]) =>
            value.every((id) =>
                [
                    "bold",
                    "italic",
                    "strike",
                    "h2",
                    "h3",
                    "ul",
                    "ol",
                    "link",
                    "quote",
                    "code",
                    "clear",
                    "undo",
                    "redo",
                    "underline",
                    "sub",
                    "sup",
                    "h4",
                    "alignLeft",
                    "alignCenter",
                    "alignRight",
                    "alignJustify",
                    "image",
                    "table",
                    "hr",
                    "fullscreen",
                ].includes(id),
            ),
    },
    // Optional app-side image picker (e.g. a media library). Resolve null to cancel.
    pickImage: {
        type: Function as PropType<
            () => Promise<RichTextImage | null | undefined>
        >,
        default: undefined,
    },
    // Optional app-side file picker for the link dialog. Resolve null to cancel.
    pickLink: {
        type: Function as PropType<
            () => Promise<RichTextLink | null | undefined>
        >,
        default: undefined,
    },
});
const emit = defineEmits<{
    "update:modelValue": [value: string];
}>();

// Surrounding NFormField (if any) supplies invalid/required/described-by/label.
const field = useFormField();
const invalid = computed(() => props.error || !!field?.invalid.value);

const rich = computed(
    () =>
        props.preset === "full" ||
        props.tools.some((id) => (RICH_IDS as readonly string[]).includes(id)),
);
const clean = (value: unknown): string =>
    sanitizeHtml(value, { rich: rich.value });

// Accessible names for the toolbar and dialogs. English defaults; the call
// site localizes via the `labels` prop or a provided locale (messages.richText).
const DEFAULT_LABELS: Record<LabelKey, string> = {
    toolbar: "Formatting",
    bold: "Bold (Ctrl+B)",
    italic: "Italic (Ctrl+I)",
    strike: "Strikethrough",
    underline: "Underline (Ctrl+U)",
    sub: "Subscript",
    sup: "Superscript",
    h2: "Heading 2",
    h3: "Heading 3",
    h4: "Heading 4",
    alignLeft: "Align left",
    alignCenter: "Align center",
    alignRight: "Align right",
    alignJustify: "Justify",
    ul: "Bulleted list",
    ol: "Numbered list",
    link: "Link",
    quote: "Quote",
    code: "Monospace code",
    clear: "Clear formatting",
    image: "Image",
    table: "Table",
    hr: "Horizontal line",
    undo: "Undo (Ctrl+Z)",
    redo: "Redo (Ctrl+Y)",
    fullscreen: "Full screen",
    linkPrompt: "Link URL",
    // Link modal (replaces the native prompt).
    linkTitle: "Insert link",
    linkConfirm: "Apply",
    linkCancel: "Cancel",
    linkRemove: "Remove link",
    linkNewTab: "Open in a new tab",
    linkPick: "Choose file",
    imageTitle: "Image",
    imageUrl: "Image URL",
    imageAlt: "Alternative text",
    imageWidth: "Width, px",
    imagePick: "Choose from library",
    imageRemove: "Remove image",
    tableTitle: "Insert table",
    tableRows: "Rows",
    tableCols: "Columns",
    tableHeader: "Header row",
    tableInsert: "Insert",
    tableTools: "Table",
    rowAbove: "Row above",
    rowBelow: "Row below",
    colLeft: "Column left",
    colRight: "Column right",
    rowDelete: "Delete row",
    colDelete: "Delete column",
    tableDelete: "Delete table",
};
const messages = useMessages();
const labels = computed(() => ({
    ...DEFAULT_LABELS,
    ...(messages.value.richText as Partial<Record<LabelKey, string>>),
    ...props.labels,
}));

const root = ref<HTMLElement | null>(null);
const editable = ref<HTMLElement | null>(null);
const isEmpty = ref(true);
const fullscreen = ref(false);

// Dialog state. A focusable overlay makes the editor lose its selection, so the
// Range is stashed on open and restored before applying.
const linkModalOpen = ref(false);
const linkUrl = ref("");
const linkText = ref("");
const linkNewTab = ref(false);
const editingLink = ref(false);
const linkBody = ref<HTMLElement | null>(null);

const imageModalOpen = ref(false);
const imageUrl = ref("");
const imageAlt = ref("");
const imageWidth = ref<string | number>("");
const imageBody = ref<HTMLElement | null>(null);
let editingImage: HTMLImageElement | null = null;
const imageEditing = ref(false);

const tableModalOpen = ref(false);
const tableRows = ref<string | number>(3);
const tableCols = ref<string | number>(3);
const tableHeader = ref(true);
const tableBody = ref<HTMLElement | null>(null);

// Table cell holding the caret; shows the table toolbar.
const currentCell = ref<HTMLTableCellElement | null>(null);

let savedRange: Range | null = null;
// Reflects the formatting at the caret so toolbar buttons can show pressed state.
const active = reactive<Record<ActiveKey, boolean>>({
    bold: false,
    italic: false,
    strike: false,
    underline: false,
    sub: false,
    sup: false,
    ul: false,
    ol: false,
    h2: false,
    h3: false,
    h4: false,
    quote: false,
    alignLeft: false,
    alignCenter: false,
    alignRight: false,
    alignJustify: false,
    fullscreen: false,
});

// Toolbar layout. `sep` renders a divider; `text` buttons (H2/H3) carry a label
// instead of an icon; `key` ties a button to its `active` flag; `id` looks up the
// button's accessible name in `labels`.
const TOOLS_BASIC: ToolbarEntry[] = [
    { id: "bold", cmd: "bold", icon: "bold", key: "bold" },
    { id: "italic", cmd: "italic", icon: "italic", key: "italic" },
    {
        id: "strike",
        cmd: "strikeThrough",
        icon: "strikethrough",
        key: "strike",
    },
    "sep",
    { id: "h2", block: "h2", text: "H2", key: "h2" },
    { id: "h3", block: "h3", text: "H3", key: "h3" },
    "sep",
    { id: "ul", cmd: "insertUnorderedList", icon: "list", key: "ul" },
    { id: "ol", cmd: "insertOrderedList", icon: "list-ordered", key: "ol" },
    "sep",
    { id: "link", action: "link", icon: "link" },
    { id: "quote", block: "blockquote", icon: "quote", key: "quote" },
    { id: "code", action: "code", icon: "code" },
    "sep",
    { id: "clear", action: "clear", icon: "eraser" },
];
const TOOLS_FULL: ToolbarEntry[] = [
    { id: "undo", cmd: "undo", icon: "undo" },
    { id: "redo", cmd: "redo", icon: "redo" },
    "sep",
    { id: "bold", cmd: "bold", icon: "bold", key: "bold" },
    { id: "italic", cmd: "italic", icon: "italic", key: "italic" },
    { id: "underline", cmd: "underline", icon: "underline", key: "underline" },
    {
        id: "strike",
        cmd: "strikeThrough",
        icon: "strikethrough",
        key: "strike",
    },
    { id: "sub", cmd: "subscript", icon: "subscript", key: "sub" },
    { id: "sup", cmd: "superscript", icon: "superscript", key: "sup" },
    "sep",
    { id: "h2", block: "h2", text: "H2", key: "h2" },
    { id: "h3", block: "h3", text: "H3", key: "h3" },
    { id: "h4", block: "h4", text: "H4", key: "h4" },
    "sep",
    { id: "alignLeft", cmd: "justifyLeft", icon: "align-left", key: "alignLeft" },
    {
        id: "alignCenter",
        cmd: "justifyCenter",
        icon: "align-center",
        key: "alignCenter",
    },
    {
        id: "alignRight",
        cmd: "justifyRight",
        icon: "align-right",
        key: "alignRight",
    },
    {
        id: "alignJustify",
        cmd: "justifyFull",
        icon: "align-justify",
        key: "alignJustify",
    },
    "sep",
    { id: "ul", cmd: "insertUnorderedList", icon: "list", key: "ul" },
    { id: "ol", cmd: "insertOrderedList", icon: "list-ordered", key: "ol" },
    { id: "quote", block: "blockquote", icon: "quote", key: "quote" },
    "sep",
    { id: "link", action: "link", icon: "link" },
    { id: "image", action: "image", icon: "asset" },
    { id: "table", action: "table", icon: "table" },
    { id: "hr", cmd: "insertHorizontalRule", icon: "rule" },
    "sep",
    { id: "code", action: "code", icon: "code" },
    { id: "clear", action: "clear", icon: "eraser" },
    "sep",
    { id: "fullscreen", action: "fullscreen", icon: "maximize", key: "fullscreen" },
];
const TABLE_OPS: TableOp[] = [
    "rowAbove",
    "rowBelow",
    "colLeft",
    "colRight",
    "rowDelete",
    "colDelete",
    "tableDelete",
];

// Toolbar actually rendered: the preset's set (with separators) by default, or
// only the requested buttons (separators dropped) when `tools` is provided.
const visibleTools = computed(() =>
    props.tools.length
        ? TOOLS_FULL.filter((t) => t !== "sep" && props.tools.includes(t.id))
        : rich.value
          ? TOOLS_FULL
          : TOOLS_BASIC,
);
const toolEnabled = (id: RichTextToolId): boolean =>
    visibleTools.value.some((t) => t !== "sep" && t.id === id);
const showTableTools = computed(
    () => rich.value && !!currentCell.value && !props.disabled,
);

// --- execCommand wrappers (the only deprecated surface, kept in one place) ----

function exec(cmd: string, value?: string): void {
    document.execCommand(cmd, false, value);
}

// queryCommandState, but never throws on unsupported commands.
function state(cmd: string): boolean {
    try {
        return document.queryCommandState(cmd);
    } catch {
        return false;
    }
}

// Toggle a block format (h2/h3/h4/blockquote): apply it, or revert to <p> if already on.
function toggleBlock(tag: "h2" | "h3" | "h4" | "blockquote"): void {
    const current = (
        document.queryCommandValue("formatBlock") || ""
    ).toLowerCase();
    exec("formatBlock", current === tag ? "<p>" : `<${tag}>`);
}

// --- selection helpers ----------------------------------------------------------

// Stash / restore the editor selection across the focus change a dialog causes.
function saveRange(): void {
    const sel = document.getSelection();
    savedRange = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
}
function restoreRange(): void {
    if (!savedRange) return;
    const sel = document.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(savedRange);
}
function placeCaret(node: Node, atEnd = false): void {
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(!atEnd);
    const sel = document.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
    savedRange = range.cloneRange();
}
function selectNode(node: Node): void {
    const range = document.createRange();
    range.selectNode(node);
    const sel = document.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
    savedRange = range.cloneRange();
}

// Element at the caret (text nodes resolved to their parent).
function caretElement(): Element | null {
    const node = document.getSelection()?.anchorNode;
    return node instanceof Element
        ? node
        : node?.parentNode instanceof Element
          ? node.parentNode
          : null;
}

// Image wrapped by the current selection (set by clicking an image).
function selectedImage(): HTMLImageElement | null {
    const sel = document.getSelection();
    if (!sel || !sel.rangeCount) return null;
    const range = sel.getRangeAt(0);
    if (
        range.startContainer !== range.endContainer ||
        range.endOffset - range.startOffset !== 1
    )
        return null;
    const node = range.startContainer.childNodes[range.startOffset];
    return node instanceof HTMLImageElement && editable.value?.contains(node)
        ? node
        : null;
}

// Re-focus the editor, restore the saved selection, then run the edit. rAF lands
// this after the trap's focus-restore so execCommand sees the right selection.
function withRestoredSelection(fn: () => void): void {
    const apply = () => {
        editable.value?.focus();
        restoreRange();
        fn();
        sync();
        updateActive();
    };
    if (typeof requestAnimationFrame === "function")
        requestAnimationFrame(apply);
    else nextTick(apply);
}

// Focus the first field of a dialog once it rendered and its focus trap has run.
function focusFirst(body: () => HTMLElement | null, select = true): void {
    if (typeof requestAnimationFrame !== "function") return;
    requestAnimationFrame(() => {
        const input = body()?.querySelector("input");
        if (input) {
            input.focus();
            if (select) input.select();
        }
    });
}

const isSafeUrl = (url: string): boolean => !!safeUrl(url);
function escapeAttr(s: string): string {
    const escapes: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
    };
    return s.replace(
        /[&<>"]/g,
        (character) => escapes[character],
    );
}
function escapeHtml(s: string): string {
    const escapes: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
    };
    return s.replace(
        /[&<>]/g,
        (character) => escapes[character],
    );
}

// --- link dialog --------------------------------------------------------------

// Open the link modal: remember the selection; if the caret sits in a link, edit
// it (select the whole anchor and prefill its href) instead of making a new one.
function openLinkModal(): void {
    editable.value?.focus();
    restoreRange();
    saveRange();
    const anchor = caretElement()?.closest("a");
    linkText.value = "";
    if (anchor && editable.value?.contains(anchor)) {
        selectNode(anchor);
        editingLink.value = true;
        linkUrl.value = anchor.getAttribute("href") || "";
        linkNewTab.value = anchor.getAttribute("target") === "_blank";
    } else {
        editingLink.value = false;
        linkUrl.value = "https://";
        linkNewTab.value = false;
    }
    linkModalOpen.value = true;
    focusFirst(() => linkBody.value);
}

// Mark the links just created/edited for `url` inside the selection.
function applyLinkTarget(url: string): void {
    const el = editable.value;
    const sel = document.getSelection();
    if (!el || !sel || !rich.value) return;
    for (const anchor of el.querySelectorAll("a")) {
        if (anchor.getAttribute("href") !== url || !sel.containsNode(anchor, true))
            continue;
        if (linkNewTab.value) {
            anchor.setAttribute("target", "_blank");
            anchor.setAttribute("rel", "noopener noreferrer");
        } else {
            anchor.removeAttribute("target");
        }
    }
}

function confirmLink(): void {
    const url = linkUrl.value.trim();
    const label = linkText.value.trim();
    linkModalOpen.value = false;
    withRestoredSelection(() => {
        if (!url || !isSafeUrl(url)) {
            if (editingLink.value) exec("unlink");
            return;
        }
        const sel = document.getSelection();
        if (!editingLink.value && sel && sel.isCollapsed) {
            // No selection: insert the file name or the URL itself as a link.
            const target =
                rich.value && linkNewTab.value
                    ? ' target="_blank" rel="noopener noreferrer"'
                    : "";
            exec(
                "insertHTML",
                `<a href="${escapeAttr(url)}"${target}>${escapeHtml(label || url)}</a>`,
            );
        } else {
            exec("createLink", url);
            applyLinkTarget(url);
        }
    });
}

function removeLink(): void {
    linkModalOpen.value = false;
    withRestoredSelection(() => exec("unlink"));
}

async function pickLinkFile(): Promise<void> {
    if (!props.pickLink) return;
    const picked = await props.pickLink();
    if (!picked?.href) return;
    linkUrl.value = picked.href;
    linkText.value = picked.text ?? "";
}

// --- image dialog -------------------------------------------------------------

function imageHtml(src: string, alt: string, width: string): string {
    return (
        '<img src="' +
        escapeAttr(src) +
        '" alt="' +
        escapeAttr(alt) +
        '"' +
        (width ? ' width="' + width + '"' : "") +
        ">"
    );
}

function openImageModal(image: HTMLImageElement | null): void {
    editingImage = image;
    imageEditing.value = !!image;
    imageUrl.value = image?.getAttribute("src") ?? "";
    imageAlt.value = image?.getAttribute("alt") ?? "";
    imageWidth.value = image?.getAttribute("width") ?? "";
    imageModalOpen.value = true;
    focusFirst(() => imageBody.value, false);
}

// Toolbar button: edit the selected image, or pick/insert a new one. With an
// app picker the library opens straight away; alt text stays editable later.
async function startImage(): Promise<void> {
    editable.value?.focus();
    restoreRange();
    saveRange();
    const image = selectedImage();
    if (image || !props.pickImage) {
        openImageModal(image);
        return;
    }
    const picked = await props.pickImage();
    const src = picked ? safeUrl(picked.src, true) : "";
    if (!src) return;
    withRestoredSelection(() =>
        exec("insertHTML", imageHtml(src, picked?.alt ?? "", "")),
    );
}

async function pickImageFile(): Promise<void> {
    if (!props.pickImage) return;
    const picked = await props.pickImage();
    if (!picked?.src) return;
    imageUrl.value = picked.src;
    if (picked.alt) imageAlt.value = picked.alt;
}

function confirmImage(): void {
    const src = safeUrl(imageUrl.value, true);
    const alt = imageAlt.value.trim();
    const width = /^\d{1,4}$/.test(String(imageWidth.value).trim())
        ? String(imageWidth.value).trim()
        : "";
    imageModalOpen.value = false;
    const image = editingImage;
    editingImage = null;
    if (!src) return;
    if (image) {
        image.setAttribute("src", src);
        image.setAttribute("alt", alt);
        if (width !== (image.getAttribute("width") ?? "")) {
            // A new width invalidates the stored height (keeps proportions).
            image.removeAttribute("height");
            if (width) image.setAttribute("width", width);
            else image.removeAttribute("width");
        }
        sync();
        return;
    }
    withRestoredSelection(() => exec("insertHTML", imageHtml(src, alt, width)));
}

function removeImage(): void {
    const image = editingImage;
    imageModalOpen.value = false;
    editingImage = null;
    if (!image) return;
    image.remove();
    sync();
}

function onEditorClick(e: MouseEvent): void {
    if (!rich.value || !(e.target instanceof HTMLImageElement)) return;
    selectNode(e.target);
}
function onEditorDblClick(e: MouseEvent): void {
    if (props.disabled || !rich.value || !toolEnabled("image")) return;
    if (!(e.target instanceof HTMLImageElement)) return;
    selectNode(e.target);
    openImageModal(e.target);
}

// --- tables -------------------------------------------------------------------

function openTableModal(): void {
    editable.value?.focus();
    restoreRange();
    saveRange();
    tableRows.value = 3;
    tableCols.value = 3;
    tableHeader.value = true;
    tableModalOpen.value = true;
    focusFirst(() => tableBody.value);
}

const clampInt = (value: unknown, max: number): number =>
    Math.min(max, Math.max(1, Math.round(Number(value)) || 1));

function confirmTable(): void {
    const rows = clampInt(tableRows.value, 50);
    const cols = clampInt(tableCols.value, 20);
    const header = tableHeader.value;
    tableModalOpen.value = false;
    const line = (tag: string) =>
        "<tr>" + `<${tag}><br></${tag}>`.repeat(cols) + "</tr>";
    const html =
        '<table data-n-new="">' +
        (header ? "<thead>" + line("th") + "</thead>" : "") +
        "<tbody>" +
        line("td").repeat(Math.max(1, header ? rows - 1 : rows)) +
        "</tbody></table><p><br></p>";
    withRestoredSelection(() => {
        exec("insertHTML", html);
        // Put the caret into the new table's first cell (marker removed at once).
        const table = editable.value?.querySelector("table[data-n-new]");
        table?.removeAttribute("data-n-new");
        const first = table?.querySelector("th,td");
        if (first) placeCaret(first);
    });
}

function newCell(tag: string): HTMLTableCellElement {
    const cell = document.createElement(tag) as HTMLTableCellElement;
    cell.innerHTML = "<br>";
    return cell;
}

// New empty row next to `row`. Below a header row it opens the table body.
function insertRow(row: HTMLTableRowElement, after: boolean): HTMLTableRowElement {
    const fresh = document.createElement("tr");
    const section = row.parentElement;
    const table = row.closest("table");
    const intoBody = after && section?.localName === "thead" && !!table;
    for (const cell of Array.from(row.cells)) {
        const copy = newCell(intoBody ? "td" : cell.localName);
        if (cell.colSpan > 1) copy.colSpan = cell.colSpan;
        fresh.appendChild(copy);
    }
    if (intoBody && table) {
        const body = table.tBodies[0] ?? table.createTBody();
        body.insertBefore(fresh, body.firstChild);
    } else {
        section?.insertBefore(fresh, after ? row.nextSibling : row);
    }
    return fresh;
}

function removeTable(table: HTMLTableElement): void {
    const next = table.nextElementSibling;
    table.remove();
    currentCell.value = null;
    if (next) placeCaret(next);
    else editable.value?.focus();
}

function tableOp(op: TableOp): void {
    const cell = currentCell.value;
    const row = cell?.parentElement;
    const table = cell?.closest("table");
    if (props.disabled || !cell || !(row instanceof HTMLTableRowElement) || !table)
        return;
    const index = cell.cellIndex;
    let focus: HTMLTableCellElement | null = null;
    const at = (r: HTMLTableRowElement | null | undefined) =>
        r?.cells[Math.min(index, r.cells.length - 1)] ?? null;

    if (op === "rowAbove" || op === "rowBelow") {
        focus = at(insertRow(row, op === "rowBelow"));
    } else if (op === "colLeft" || op === "colRight") {
        for (const r of Array.from(table.rows)) {
            const ref = r.cells[Math.min(index, r.cells.length - 1)];
            const tag =
                ref?.localName ??
                (r.parentElement?.localName === "thead" ? "th" : "td");
            const fresh = newCell(tag);
            if (!ref) r.appendChild(fresh);
            else
                r.insertBefore(
                    fresh,
                    op === "colLeft" ? ref : ref.nextSibling,
                );
            if (r === row) focus = fresh;
        }
    } else if (op === "rowDelete") {
        const sibling =
            row.nextElementSibling ?? row.previousElementSibling ?? null;
        row.remove();
        focus = sibling instanceof HTMLTableRowElement ? at(sibling) : null;
    } else if (op === "colDelete") {
        for (const r of Array.from(table.rows)) {
            r.cells[Math.min(index, r.cells.length - 1)]?.remove();
            if (!r.cells.length) r.remove();
        }
        focus = row.isConnected ? at(row) : null;
    }

    // Drop emptied sections; a table without rows goes away entirely.
    for (const section of Array.from(table.children)) {
        if (
            /^(thead|tbody|tfoot)$/.test(section.localName) &&
            !section.querySelector("tr")
        )
            section.remove();
    }
    if (op === "tableDelete" || !table.rows.length) removeTable(table);
    else {
        editable.value?.focus();
        if (!focus) focus = table.rows[0]?.cells[0] ?? null;
        if (focus) placeCaret(focus);
    }
    sync();
    updateActive();
}

// Tab / Shift+Tab move between cells; Tab in the last cell adds a row.
function onKeydown(e: KeyboardEvent): void {
    if (e.key === "Escape" && fullscreen.value) {
        e.preventDefault();
        fullscreen.value = false;
        active.fullscreen = false;
        return;
    }
    if (e.key !== "Tab" || !rich.value) return;
    const cell = caretElement()?.closest("td,th");
    const table = cell?.closest("table");
    if (!cell || !table || !editable.value?.contains(table)) return;
    e.preventDefault();
    const cells = Array.from(
        table.querySelectorAll<HTMLTableCellElement>("th,td"),
    ).filter((c) => c.closest("table") === table);
    const next = cells[cells.indexOf(cell as HTMLTableCellElement) + (e.shiftKey ? -1 : 1)];
    if (next) {
        placeCaret(next);
    } else if (!e.shiftKey) {
        const lastRow = cell.parentElement as HTMLTableRowElement;
        const fresh = insertRow(lastRow, true);
        if (fresh.cells[0]) placeCaret(fresh.cells[0]);
        sync();
    }
    updateActive();
}

// --- other actions ------------------------------------------------------------

// Wrap the selected text in <code>. (v1: no toggle-off — clear formatting removes it.)
function wrapCode(): void {
    const sel = document.getSelection();
    if (!sel || sel.isCollapsed) return;
    exec("insertHTML", `<code>${escapeHtml(sel.toString())}</code>`);
}

function toggleFullscreen(): void {
    fullscreen.value = !fullscreen.value;
    active.fullscreen = fullscreen.value;
    nextTick(() => {
        editable.value?.focus();
        restoreRange();
    });
}

// --- toolbar dispatch ---------------------------------------------------------

function run(tool: ToolbarTool): void {
    if (props.disabled) return;
    // Dialog tools run their own focus/selection/sync flow.
    if (tool.action === "link") return openLinkModal();
    if (tool.action === "image") {
        void startImage();
        return;
    }
    if (tool.action === "table") return openTableModal();
    if (tool.action === "fullscreen") return toggleFullscreen();
    editable.value?.focus();
    restoreRange();
    if (tool.cmd) exec(tool.cmd);
    else if (tool.block) toggleBlock(tool.block);
    else if (tool.action === "code") wrapCode();
    else if (tool.action === "clear") exec("removeFormat");
    sync();
    updateActive();
}

function toolIcon(tool: ToolbarTool): string {
    if (tool.action === "fullscreen" && fullscreen.value) return "minimize";
    return tool.icon || "";
}

// --- model <-> DOM sync -------------------------------------------------------

// An "empty" contenteditable still holds <br>/<div> noise — treat no text as empty.
function computeEmpty(): boolean {
    const el = editable.value;
    return (
        !el || (!el.textContent.trim() && !el.querySelector("img,hr,table"))
    );
}

// Push the editor's HTML out through v-model (normalised to "" when empty).
function sync(): void {
    const el = editable.value;
    if (!el) return;
    isEmpty.value = computeEmpty();
    emit("update:modelValue", isEmpty.value ? "" : el.innerHTML);
}

// Refresh toolbar pressed-state and the table context from the current selection.
function updateActive(): void {
    const el = editable.value;
    const sel = document.getSelection();
    if (!el || !sel || !el.contains(sel.anchorNode)) return;
    active.bold = state("bold");
    active.italic = state("italic");
    active.strike = state("strikeThrough");
    active.underline = state("underline");
    active.sub = state("subscript");
    active.sup = state("superscript");
    active.ul = state("insertUnorderedList");
    active.ol = state("insertOrderedList");
    active.alignCenter = state("justifyCenter");
    active.alignRight = state("justifyRight");
    active.alignJustify = state("justifyFull");
    active.alignLeft =
        !active.alignCenter && !active.alignRight && !active.alignJustify;
    const block = (
        document.queryCommandValue("formatBlock") || ""
    ).toLowerCase();
    active.h2 = block === "h2";
    active.h3 = block === "h3";
    active.h4 = block === "h4";
    active.quote = block === "blockquote";
    const cell = caretElement()?.closest("td,th");
    currentCell.value =
        rich.value && cell instanceof HTMLTableCellElement && el.contains(cell)
            ? cell
            : null;
}

// --- paste sanitisation -------------------------------------------------------

function onPaste(e: ClipboardEvent): void {
    e.preventDefault();
    if (props.disabled) return;
    const cb = e.clipboardData;
    if (!cb) return;
    const html = cb.getData("text/html");
    if (html) exec("insertHTML", clean(html));
    else exec("insertText", cb.getData("text/plain"));
    sync();
}

function onDrop(e: DragEvent): void {
    e.preventDefault();
    if (props.disabled || !e.dataTransfer) return;
    const el = editable.value;
    if (!el) return;
    el.focus();
    let range = document.caretRangeFromPoint?.(e.clientX, e.clientY);
    if (!range && document.caretPositionFromPoint) {
        const caret = document.caretPositionFromPoint(e.clientX, e.clientY);
        if (caret) {
            range = document.createRange();
            range.setStart(caret.offsetNode, caret.offset);
            range.collapse(true);
        }
    }
    if (!range || !el.contains(range.startContainer)) {
        range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
    }
    const selection = document.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(range);
    const html = e.dataTransfer.getData("text/html");
    if (html) exec("insertHTML", clean(html));
    else exec("insertText", e.dataTransfer.getData("text/plain"));
    sync();
}

// --- lifecycle ----------------------------------------------------------------

function onSelectionChange(): void {
    if (props.disabled) return;
    const selection = document.getSelection();
    if (editable.value?.contains(selection?.anchorNode ?? null)) {
        saveRange();
        updateActive();
    } else if (!root.value?.contains(document.activeElement)) {
        currentCell.value = null;
    }
}

onMounted(() => {
    if (!editable.value) return;
    editable.value.innerHTML = clean(props.modelValue);
    isEmpty.value = computeEmpty();
    document.addEventListener("selectionchange", onSelectionChange);
});

onBeforeUnmount(() => {
    document.removeEventListener("selectionchange", onSelectionChange);
});

// Apply external value changes (form reset, edit load) without stomping the
// caret: our own emits make modelValue === innerHTML, so this is a no-op then.
watch(
    () => props.modelValue,
    (val) => {
        const el = editable.value;
        if (el && val !== el.innerHTML) {
            el.innerHTML = clean(val);
            savedRange = null;
            currentCell.value = null;
            isEmpty.value = computeEmpty();
        }
    },
);
</script>

<template>
    <div
        ref="root"
        class="n-rte"
        :class="{
            'n-rte--error': invalid,
            'n-rte--disabled': disabled,
            'n-rte--fullscreen': fullscreen,
        }"
    >
        <div class="n-rte__toolbar" role="toolbar" :aria-label="labels.toolbar">
            <template v-for="(tool, i) in visibleTools">
                <span
                    v-if="tool === 'sep'"
                    :key="'sep' + i"
                    class="n-rte__sep"
                />
                <button
                    v-else
                    :key="tool.id"
                    type="button"
                    class="n-rte__btn"
                    :class="{
                        'n-rte__btn--text': tool.text,
                        'is-active': tool.key && active[tool.key],
                    }"
                    :title="labels[tool.id]"
                    :aria-label="labels[tool.id]"
                    :aria-pressed="tool.key ? active[tool.key] : undefined"
                    :disabled="disabled"
                    @mousedown.prevent
                    @click="run(tool)"
                >
                    <span v-if="tool.text">{{ tool.text }}</span>
                    <NIcon v-else :name="toolIcon(tool)" :size="16" />
                </button>
            </template>
        </div>

        <div
            v-if="showTableTools"
            class="n-rte__toolbar n-rte__toolbar--table"
            role="toolbar"
            :aria-label="labels.tableTools"
        >
            <span class="n-rte__context">
                <NIcon name="table" :size="14" />{{ labels.tableTools }}
            </span>
            <button
                v-for="op in TABLE_OPS"
                :key="op"
                type="button"
                class="n-rte__btn n-rte__btn--text"
                :class="{
                    'n-rte__btn--danger': op.endsWith('Delete'),
                }"
                @mousedown.prevent
                @click="tableOp(op)"
            >
                {{ labels[op] }}
            </button>
        </div>

        <div
            ref="editable"
            class="n-rte__content"
            :class="{ 'is-empty': isEmpty, 'n-rte__content--rich': rich }"
            :contenteditable="disabled ? 'false' : 'true'"
            :data-placeholder="placeholder"
            :aria-invalid="invalid || undefined"
            :aria-required="field?.required.value || undefined"
            :aria-labelledby="field?.labelledby.value || undefined"
            :aria-describedby="field?.describedBy.value || undefined"
            role="textbox"
            aria-multiline="true"
            @input="sync"
            @paste="onPaste"
            @drop="onDrop"
            @keydown="onKeydown"
            @keyup="updateActive"
            @mouseup="updateActive"
            @click="onEditorClick"
            @dblclick="onEditorDblClick"
        />

        <NModal
            v-model="linkModalOpen"
            :title="labels.linkTitle"
            width="420px"
            :close-label="labels.linkCancel"
        >
            <div ref="linkBody" class="n-rte__dialog-body">
                <NFormField tag="div" :label="labels.linkPrompt">
                    <NInput
                        v-model="linkUrl"
                        type="url"
                        :aria-label="labels.linkPrompt"
                        placeholder="https://"
                        @keydown.enter.prevent="confirmLink"
                    />
                </NFormField>
                <NButton
                    v-if="pickLink"
                    variant="secondary"
                    size="sm"
                    icon="upload"
                    type="button"
                    class="n-rte__pick"
                    @click="pickLinkFile"
                    >{{ labels.linkPick }}</NButton
                >
                <NCheckbox v-if="rich" v-model="linkNewTab">{{
                    labels.linkNewTab
                }}</NCheckbox>
            </div>
            <template #footer="{ close }">
                <NButton
                    v-if="editingLink"
                    variant="ghost"
                    tone="danger"
                    type="button"
                    @click="removeLink"
                    >{{ labels.linkRemove }}</NButton
                >
                <span class="n-rte__dialog-spacer" />
                <NButton variant="ghost" type="button" @click="close">{{
                    labels.linkCancel
                }}</NButton>
                <NButton variant="primary" type="button" @click="confirmLink">{{
                    labels.linkConfirm
                }}</NButton>
            </template>
        </NModal>

        <NModal
            v-if="rich"
            v-model="imageModalOpen"
            :title="labels.imageTitle"
            width="460px"
            :close-label="labels.linkCancel"
        >
            <div ref="imageBody" class="n-rte__dialog-body">
                <NFormField tag="div" :label="labels.imageUrl">
                    <NInput
                        v-model="imageUrl"
                        type="url"
                        :aria-label="labels.imageUrl"
                        placeholder="https://"
                        @keydown.enter.prevent="confirmImage"
                    />
                </NFormField>
                <NButton
                    v-if="pickImage"
                    variant="secondary"
                    size="sm"
                    icon="asset"
                    type="button"
                    class="n-rte__pick"
                    @click="pickImageFile"
                    >{{ labels.imagePick }}</NButton
                >
                <NFormField tag="div" :label="labels.imageAlt">
                    <NInput
                        v-model="imageAlt"
                        :aria-label="labels.imageAlt"
                        @keydown.enter.prevent="confirmImage"
                    />
                </NFormField>
                <NFormField tag="div" :label="labels.imageWidth">
                    <NInput
                        v-model="imageWidth"
                        inputmode="numeric"
                        :aria-label="labels.imageWidth"
                        @keydown.enter.prevent="confirmImage"
                    />
                </NFormField>
            </div>
            <template #footer="{ close }">
                <NButton
                    v-if="imageEditing"
                    variant="ghost"
                    tone="danger"
                    type="button"
                    @click="removeImage"
                    >{{ labels.imageRemove }}</NButton
                >
                <span class="n-rte__dialog-spacer" />
                <NButton variant="ghost" type="button" @click="close">{{
                    labels.linkCancel
                }}</NButton>
                <NButton variant="primary" type="button" @click="confirmImage">{{
                    labels.linkConfirm
                }}</NButton>
            </template>
        </NModal>

        <NModal
            v-if="rich"
            v-model="tableModalOpen"
            :title="labels.tableTitle"
            width="400px"
            :close-label="labels.linkCancel"
        >
            <div ref="tableBody" class="n-rte__dialog-body">
                <div class="n-rte__dialog-row">
                    <NFormField tag="div" :label="labels.tableRows">
                        <NInput
                            v-model="tableRows"
                            type="number"
                            :aria-label="labels.tableRows"
                            @keydown.enter.prevent="confirmTable"
                        />
                    </NFormField>
                    <NFormField tag="div" :label="labels.tableCols">
                        <NInput
                            v-model="tableCols"
                            type="number"
                            :aria-label="labels.tableCols"
                            @keydown.enter.prevent="confirmTable"
                        />
                    </NFormField>
                </div>
                <NCheckbox v-model="tableHeader">{{
                    labels.tableHeader
                }}</NCheckbox>
            </div>
            <template #footer="{ close }">
                <span class="n-rte__dialog-spacer" />
                <NButton variant="ghost" type="button" @click="close">{{
                    labels.linkCancel
                }}</NButton>
                <NButton variant="primary" type="button" @click="confirmTable">{{
                    labels.tableInsert
                }}</NButton>
            </template>
        </NModal>
    </div>
</template>

<style scoped>
.n-rte {
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
    overflow: hidden;
    transition: 0.14s;
}
.n-rte:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent);
}
.n-rte--error {
    border-color: var(--danger);
    border-width: 1.5px;
}
.n-rte--disabled {
    background: var(--surface-3);
    opacity: 0.7;
}

/* --- toolbar --- */
.n-rte__toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px;
    padding: 6px 8px;
    border-bottom: 1px solid var(--border);
    background: var(--surface-2);
}
.n-rte__sep {
    width: 1px;
    align-self: stretch;
    margin: 4px 4px;
    background: var(--border);
}
.n-rte__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    padding: 0 6px;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-2);
    font-family: inherit;
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;
    transition: 0.12s;
}
.n-rte__btn--text {
    min-width: 30px;
}
.n-rte__btn:hover {
    background: var(--surface-3);
    color: var(--text);
}
.n-rte__btn.is-active {
    background: var(--accent-soft);
    color: var(--accent);
}
.n-rte__btn:disabled {
    color: var(--text-3);
    cursor: not-allowed;
    background: transparent;
}

.n-rte__btn--danger:hover {
    background: var(--danger-soft, var(--surface-3));
    color: var(--danger);
}

/* --- table context toolbar --- */
.n-rte__toolbar--table {
    gap: 4px;
    padding: 4px 8px;
    background: var(--surface);
}
.n-rte__context {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-right: 4px;
    color: var(--text-3);
    font-size: 12px;
    font-weight: 700;
}
.n-rte__toolbar--table .n-rte__btn {
    font-weight: 600;
}

/* --- dialogs --- */
.n-rte__dialog-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.n-rte__dialog-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}
.n-rte__pick {
    align-self: flex-start;
}
.n-rte__dialog-spacer {
    flex: 1;
}

/* --- full screen --- */
.n-rte--fullscreen {
    position: fixed;
    inset: 0;
    z-index: 990;
    display: flex;
    flex-direction: column;
    border-radius: 0;
}
.n-rte--fullscreen .n-rte__content {
    flex: 1;
    max-height: none;
    padding: 24px max(24px, calc((100% - 860px) / 2));
}

/* --- editable area --- */
.n-rte__content {
    min-height: var(--n-rte-min-height, 140px);
    max-height: var(--n-rte-max-height, 420px);
    overflow-y: auto;
    padding: 12px 14px;
    color: var(--text);
    font-family: inherit;
    font-size: var(--fs);
    line-height: 1.6;
    outline: none;
}
.n-rte__content.is-empty::before {
    content: attr(data-placeholder);
    color: var(--text-3);
    pointer-events: none;
}

/* --- prose styling (innerHTML content needs :deep, it has no scope id) --- */
.n-rte__content :deep(h2) {
    font-size: 1.3em;
    font-weight: 800;
    letter-spacing: -0.01em;
    margin: 0.6em 0 0.3em;
}
.n-rte__content :deep(h3) {
    font-size: 1.12em;
    font-weight: 700;
    margin: 0.6em 0 0.3em;
}
.n-rte__content :deep(p) {
    margin: 0 0 0.6em;
}
.n-rte__content :deep(ul),
.n-rte__content :deep(ol) {
    margin: 0 0 0.6em;
    padding-left: 1.5em;
}
.n-rte__content :deep(a) {
    color: var(--accent);
    text-decoration: underline;
}
.n-rte__content :deep(blockquote) {
    margin: 0 0 0.6em;
    padding-left: 12px;
    border-left: 3px solid var(--border-2);
    color: var(--text-2);
}
.n-rte__content :deep(h4) {
    font-size: 1em;
    font-weight: 700;
    margin: 0.6em 0 0.3em;
}
.n-rte__content :deep(img) {
    max-width: 100%;
    height: auto;
    cursor: pointer;
}
.n-rte__content :deep(img:hover) {
    outline: 2px solid var(--accent-soft);
}
.n-rte__content :deep(hr) {
    margin: 1em 0;
    border: 0;
    border-top: 1px solid var(--border-2);
}
.n-rte__content :deep(table) {
    width: 100%;
    margin: 0 0 0.8em;
    border-collapse: collapse;
}
.n-rte__content :deep(th),
.n-rte__content :deep(td) {
    min-width: 48px;
    padding: 6px 8px;
    border: 1px solid var(--border-2);
    vertical-align: top;
}
.n-rte__content :deep(th) {
    background: var(--surface-2);
    font-weight: 700;
    text-align: left;
}
.n-rte__content :deep(figure) {
    margin: 0 0 0.8em;
}
.n-rte__content :deep(figcaption) {
    color: var(--text-3);
    font-size: 0.9em;
}
.n-rte__content :deep(code) {
    padding: 1px 5px;
    border-radius: 5px;
    background: var(--surface-3);
    font-family: var(--font-mono);
    font-size: 0.9em;
}
</style>
