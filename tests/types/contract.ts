import { h } from "vue";
import {
    NButton,
    NPagination,
    NSelect,
    NModal,
    NDataTable,
    NDropzone,
    NRichText,
    useTheme,
    useToast,
    createFormat,
    NMultiSelect,
    NConfirmDialog,
    NFilterChips,
    NBreadcrumbs,
    createLocale,
    ruMessages,
    useConfirm,
    useSortable,
    useHotkeys,
    useColumnVisibility,
    installEnterSubmit,
    type MessagesInput,
} from "nergous-ui-vue";
const button: InstanceType<typeof NButton>["$props"] = {
    variant: "primary",
    loading: true,
    onClick: (e: MouseEvent) => e.preventDefault(),
};
h(NButton, button);
const select: InstanceType<typeof NSelect>["$props"] = {
    options: [{ value: 1, label: "One" }],
    "onUpdate:modelValue": (v) => String(v),
};
h(NSelect, select);
h(NModal, { dialogLabel: "Confirm", modelValue: true, onClose: () => {} });
const table: InstanceType<typeof NDataTable>["$props"] = {
    rows: [{ id: 1 }],
    columns: [{ key: "id", label: "ID" }],
    onRowClick: (row) => String(row.id),
    onSortChange: (sort) => sort.dir,
};
const drop: InstanceType<typeof NDropzone>["$props"] = {
    onFiles: (files) => files[0]?.name,
};
const pagination: InstanceType<typeof NPagination>["$props"] = {
    page: 2,
    pages: 10,
    jumpable: true,
    jumpLabel: "Page",
    jumpButtonLabel: "Go",
    totalLabel: "of",
    jumpErrorLabel: "Enter a valid page number",
    pageSize: 25,
    pageSizes: [10, 25, 50],
    pageSizeLabel: "Rows per page",
    "onUpdate:pageSize": (size) => size.toFixed(0),
};
void table;
void drop;
void pagination;
const editor: InstanceType<typeof NRichText>["$props"] = {
    preset: "full",
    tools: ["image", "table", "alignCenter"],
    labels: { rowBelow: "Row below", imagePick: "Library" },
    pickImage: async () => ({ src: "/a.png", alt: "A" }),
    pickLink: async () => null,
};
void editor;
useTheme().setTheme("dark");
useToast().push({ title: "Saved", duration: 0 });
createFormat("ru").formatNumber(null);
// @ts-expect-error invalid theme
useTheme().setTheme("purple");
// @ts-expect-error invalid model type
const bad: InstanceType<typeof NSelect>["$props"] = { modelValue: false };
const badOptions: InstanceType<typeof NSelect>["$props"] = {
    // @ts-expect-error option needs label
    options: [{ value: 1 }],
};
// @ts-expect-error pagination/type properties must not be silently any
const badButton: InstanceType<typeof NButton>["$props"] = { loading: "yes" };
const badPagination: InstanceType<typeof NPagination>["$props"] = {
    // @ts-expect-error jumpable is boolean
    jumpable: "yes",
    // @ts-expect-error pageSizes is a number list
    pageSizes: ["10"],
};
const badEditor: InstanceType<typeof NRichText>["$props"] = {
    // @ts-expect-error unknown preset
    preset: "huge",
    // @ts-expect-error unknown toolbar command
    tools: ["video"],
};
void bad;
void badOptions;
void badButton;
void badPagination;
void badEditor;

const multi: InstanceType<typeof NMultiSelect>["$props"] = {
    modelValue: ["a", 2],
    options: [{ value: "a", label: "A" }],
    search: true,
    selectedLabel: (n) => n + " picked",
    "onUpdate:modelValue": (values) => values.length,
};
const confirmProps: InstanceType<typeof NConfirmDialog>["$props"] = {
    modelValue: true,
    danger: true,
    onConfirm: () => {},
    onCancel: () => {},
};
const chips: InstanceType<typeof NFilterChips>["$props"] = {
    filters: [{ key: "type", label: "Type", value: "Article" }],
    onRemove: (key) => key.toUpperCase(),
};
const crumbs: InstanceType<typeof NBreadcrumbs>["$props"] = {
    items: [{ label: "Home", href: "/" }, { label: "Here" }],
    linkAs: "a",
};
const tableMatching: InstanceType<typeof NDataTable>["$props"] = {
    total: 120,
    allMatching: true,
    stacked: true,
    "onUpdate:allMatching": (all) => !all,
};
const russianOverride: MessagesInput = {
    "dialog.close": "Закрыть окно",
    "table.selection": (count) => "Выбрано: " + count,
};
createLocale(ruMessages);
createLocale(() => russianOverride);
const confirmState = useConfirm<{ id: number }>();
confirmState.ask({ id: 1 });
void confirmState.run((payload) => payload?.id);
useSortable(
    () => [{ id: "a", title: "A" }],
    (ids) => ids.join(","),
    (item) => item.title,
    { commitDelay: 0 },
);
useHotkeys({ "mod+s": (event) => event.preventDefault() }, { inInputs: true });
const visibility = useColumnVisibility([{ key: "id", label: "ID" }], ["id"], "k");
visibility.hiddenColumns.value.push("id");
const uninstall: () => void = installEnterSubmit({ boundary: "main" });
createFormat("ru", { timeZone: "Europe/Moscow" }).plural(3, { one: "#", other: "#" });
createFormat("en").formatBytes(2048);
void [multi, confirmProps, chips, crumbs, tableMatching, uninstall];

const badMulti: InstanceType<typeof NMultiSelect>["$props"] = {
    // @ts-expect-error multi-select model is an array
    modelValue: "a",
};
const badMessages: MessagesInput = {
    // @ts-expect-error unknown dictionary key
    "dialog.closee": "x",
};
// @ts-expect-error plural needs the "other" form
createFormat("en").plural(1, { one: "#" });
// @ts-expect-error sortable items need an id
useSortable(() => [{ title: "A" }], () => {}, () => "");
void [badMulti, badMessages];
