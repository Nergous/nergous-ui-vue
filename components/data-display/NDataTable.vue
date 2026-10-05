<script setup lang="ts">
import { useLabels } from "../../composables/useLocale.ts";
import {
    ref,
    computed,
    getCurrentInstance,
    watch,
    type PropType,
} from "vue";
import NIcon from "../primitives/NIcon.vue";
import NCheckbox from "../forms/NCheckbox.vue";
import NPagination from "./NPagination.vue";

// NDataTable — sortable, selectable data grid with optional client-side paging.
// v-model:selected = picked row keys; emits row-click and sort-change.
// Server lists: pass `total` (rows matching the filters) and v-model:allMatching
// to offer "select all N" once the whole page is picked; the app then sends its
// filters instead of ids. `stacked` turns rows into label/value cards on phones.
// Slots: #cell-<key> (custom cell), #bulk (selection toolbar), #empty (no-data view).
// columns: [{ key, label, sortable?, width?, align? }]
//
// Locale-agnostic: all visible text comes from props with neutral English defaults;
// the app passes localized strings. Interactive cell content rendered into a
// #cell-<key> slot should call @click.stop so it doesn't trigger row-click.
type TableValue = string | number;
type SortDirection = "asc" | "desc";
type ColumnAlign = "left" | "right" | "center";
type Row = Record<string, unknown>;
type RowClass = string | string[] | Record<string, boolean>;

interface Column {
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
    align?: ColumnAlign;
}

interface SortChange {
    key: string;
    dir: SortDirection;
}

const props = defineProps({
    columns: {
        type: Array as PropType<Column[]>,
        default: () => [],
    },
    rows: {
        type: Array as PropType<Row[]>,
        default: () => [],
    },
    rowKey: { type: String, default: "id" },
    selectable: { type: Boolean, default: false },
    selected: {
        type: Array as PropType<TableValue[]>,
        default: () => [],
    },
    pageSize: { type: Number, default: 0 },
    hover: { type: Boolean, default: true },
    // Skip the internal client-side sort when the consumer sorts externally
    // (e.g. server-side via @sort-change); the header still shows the active arrow.
    manualSort: { type: Boolean, default: false },
    // Controlled sort: when `sortKey` is non-empty the active column/direction come
    // from props (the source of truth, e.g. server-side sort) instead of internal
    // state, keeping the header arrow / aria-sort in sync. Pair with manualSort.
    sortKey: { type: String, default: "" },
    sortDir: {
        type: String as PropType<SortDirection>,
        default: "asc",
    },
    // Localized text — app overrides these; defaults stay English (locale-agnostic).
    emptyText: { type: String, default: undefined },
    clearLabel: { type: String, default: undefined },
    selectionLabel: {
        type: Function as PropType<(count: number) => string>,
        default: undefined,
    },
    rangeLabel: {
        type: Function as PropType<
            (from: number, to: number, total: number) => string
        >,
        default: undefined,
    },
    selectAllLabel: { type: String, default: undefined },
    selectRowLabel: { type: String, default: undefined },
    selectAllMatchingLabel: {
        type: Function as PropType<(total: number) => string>,
        default: undefined,
    },
    // Rows matching the current filters across all server pages. With
    // v-model:allMatching it enables "select all N" in the bulk bar.
    total: { type: Number, default: 0 },
    allMatching: { type: Boolean, default: false },
    // Below 640px viewport width render rows as cards; each cell is labeled
    // with its column heading. The header row stays for screen readers only.
    stacked: { type: Boolean, default: false },
    // Accessible name for an interactive row (only used when @row-click is bound).
    // Returns the label for `row`; without it role="button" derives the name from
    // the row's cell text, which is usually too verbose — pass this for a clean name.
    rowLabel: {
        type: Function as unknown as PropType<
            ((row: Row) => string) | null
        >,
        default: null,
    },
    // Extra class(es) per row: (row) => string | string[] | object. Lets a consumer
    // highlight rows (e.g. unprocessed items) without the table knowing the domain.
    rowClass: {
        type: Function as unknown as PropType<
            ((row: Row) => RowClass) | null
        >,
        default: null,
    },
});
// Labels: prop → provided locale (useLocale) → English default.
const lbl = useLabels(props, {
    emptyText: "table.empty",
    clearLabel: "table.clear",
    selectionLabel: "table.selection",
    rangeLabel: "table.range",
    selectAllLabel: "table.selectAll",
    selectRowLabel: "table.selectRow",
    selectAllMatchingLabel: "table.selectAllMatching",
});
const emit = defineEmits<{
    "update:selected": [keys: TableValue[]];
    "update:allMatching": [value: boolean];
    "row-click": [row: Row];
    "sort-change": [sort: SortChange];
}>();

// A row is interactive only when the consumer actually listens for @row-click.
// Drives role/tabindex/keyboard + the pointer cursor so the affordance never lies.
const instance = getCurrentInstance();
const rowInteractive = computed(
    () => !!instance?.vnode.props?.onRowClick,
);

// Internal (uncontrolled) sort state; ignored while a `sortKey` prop is supplied.
const internalKey = ref("");
const internalDir = ref<SortDirection>("asc");
const controlled = computed(() => !!props.sortKey);
const activeKey = computed(() =>
    controlled.value ? props.sortKey : internalKey.value,
);
const activeDir = computed(() =>
    controlled.value ? props.sortDir : internalDir.value,
);

function toggleSort(col: Column): void {
    if (!col.sortable) return;
    const nextDir =
        activeKey.value === col.key && activeDir.value === "asc"
            ? "desc"
            : "asc";
    if (!controlled.value) {
        internalKey.value = col.key;
        internalDir.value = nextDir;
    }
    emit("sort-change", { key: col.key, dir: nextDir });
}

function ariaSort(
    col: Column,
): "none" | "ascending" | "descending" | undefined {
    if (!col.sortable) return undefined;
    if (activeKey.value !== col.key) return "none";
    return activeDir.value === "asc" ? "ascending" : "descending";
}

const sorted = computed<Row[]>(() => {
    if (props.manualSort || !activeKey.value) return props.rows;
    const dir = activeDir.value === "asc" ? 1 : -1;
    return [...props.rows].sort((a, b) => {
        let x = a[activeKey.value] as string | number | null | undefined;
        let y = b[activeKey.value] as string | number | null | undefined;
        // nullish values sort last regardless of direction
        if (x == null || y == null) {
            if (x == null && y == null) return 0;
            return x == null ? 1 : -1;
        }
        const left =
            typeof x === "string" || typeof y === "string"
                ? String(x).toLowerCase()
                : x;
        const right =
            typeof x === "string" || typeof y === "string"
                ? String(y).toLowerCase()
                : y;
        return left < right ? -dir : left > right ? dir : 0;
    });
});

const page = ref(1);
const pages = computed(() =>
    props.pageSize > 0
        ? Math.max(1, Math.ceil(sorted.value.length / props.pageSize))
        : 1,
);
const paged = computed(() => {
    if (props.pageSize <= 0) return sorted.value;
    const p = Math.min(page.value, pages.value);
    return sorted.value.slice(
        (p - 1) * props.pageSize,
        (p - 1) * props.pageSize + props.pageSize,
    );
});
watch(pages, (total) => {
    page.value = Math.max(1, Math.min(page.value, total));
});
const rangeText = computed(() => {
    if (props.pageSize <= 0 || sorted.value.length === 0) return "";
    const p = Math.min(page.value, pages.value);
    const start = (p - 1) * props.pageSize;
    return lbl.value.rangeLabel(
        start + 1,
        Math.min(start + props.pageSize, sorted.value.length),
        sorted.value.length,
    );
});

function rowId(row: Row): TableValue {
    return row[props.rowKey] as TableValue;
}
const isSel = (row: Row): boolean =>
    props.allMatching || props.selected.includes(rowId(row));
const allSel = computed(
    () => paged.value.length > 0 && paged.value.every(isSel),
);
const someSel = computed(() => paged.value.some(isSel));
const selectionCount = computed(() =>
    props.allMatching ? props.total : props.selected.length,
);
const canSelectMatching = computed(
    () =>
        !props.allMatching &&
        allSel.value &&
        props.total > props.selected.length,
);

function clearSelection(): void {
    if (props.allMatching) emit("update:allMatching", false);
    emit("update:selected", []);
}

function toggleAll(): void {
    if (props.allMatching) return clearSelection();
    const ids = paged.value.map(rowId);
    if (allSel.value)
        emit(
            "update:selected",
            props.selected.filter((id) => !ids.includes(id)),
        );
    else
        emit(
            "update:selected",
            Array.from(new Set([...props.selected, ...ids])),
        );
}
function toggleRow(row: Row): void {
    const id = rowId(row);
    if (props.allMatching) {
        // Leaving "all matching": keep the rest of the visible page picked.
        emit("update:allMatching", false);
        emit(
            "update:selected",
            paged.value.map(rowId).filter((x) => x !== id),
        );
        return;
    }
    if (props.selected.includes(id))
        emit(
            "update:selected",
            props.selected.filter((x) => x !== id),
        );
    else emit("update:selected", [...props.selected, id]);
}
</script>

<template>
    <div class="n-table-wrap" :class="{ 'n-table-wrap--stacked': stacked }">
        <!-- bulk bar -->
        <div
            v-if="selectable && (selected.length || allMatching)"
            class="n-table__bulk"
        >
            <span class="n-table__bulk-count">{{
                lbl.selectionLabel(selectionCount)
            }}</span>
            <button
                v-if="canSelectMatching"
                type="button"
                class="n-table__bulk-all"
                @click="emit('update:allMatching', true)"
            >
                {{ lbl.selectAllMatchingLabel(total) }}
            </button>
            <span class="n-table__bulk-sep" />
            <slot
                name="bulk"
                :selected="selected"
                :all-matching="allMatching"
                :count="selectionCount"
                :clear="clearSelection"
            />
            <div class="n-table__bulk-spacer" />
            <button
                type="button"
                class="n-table__bulk-clear"
                @click="clearSelection"
            >
                {{ lbl.clearLabel }}
            </button>
        </div>

        <div class="n-table-scroll">
            <table class="n-table">
                <thead>
                    <tr>
                        <th
                            v-if="selectable"
                            class="n-table__check"
                            scope="col"
                        >
                            <NCheckbox
                                :model-value="allSel"
                                :indeterminate="someSel && !allSel"
                                :aria-label="lbl.selectAllLabel"
                                @update:model-value="toggleAll"
                            />
                        </th>
                        <th
                            v-for="col in columns"
                            :key="col.key"
                            scope="col"
                            :style="{
                                width: col.width,
                                textAlign: col.align || 'left',
                            }"
                            :class="{ sortable: col.sortable }"
                            :aria-sort="ariaSort(col)"
                        >
                            <button
                                v-if="col.sortable"
                                type="button"
                                class="n-table__th n-table__sort"
                                @click="toggleSort(col)"
                            >
                                {{ col.label }}
                                <NIcon
                                    v-if="activeKey === col.key"
                                    :name="
                                        activeDir === 'asc'
                                            ? 'arrow-up'
                                            : 'arrow-down'
                                    "
                                    :size="13"
                                />
                            </button>
                            <span v-else class="n-table__th">{{
                                col.label
                            }}</span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="row in paged"
                        :key="rowId(row)"
                        :class="[
                            {
                                on: isSel(row),
                                hoverable: hover,
                                interactive: rowInteractive,
                            },
                            rowClass ? rowClass(row) : null,
                        ]"
                        :role="rowInteractive ? 'button' : undefined"
                        :tabindex="rowInteractive ? 0 : undefined"
                        :aria-label="
                            rowInteractive && rowLabel
                                ? rowLabel(row)
                                : undefined
                        "
                        @click="emit('row-click', row)"
                        @keydown.enter.self.prevent="
                            rowInteractive && emit('row-click', row)
                        "
                        @keydown.space.self.prevent="
                            rowInteractive && emit('row-click', row)
                        "
                    >
                        <td
                            v-if="selectable"
                            class="n-table__check"
                            @click.stop
                        >
                            <NCheckbox
                                :model-value="isSel(row)"
                                :aria-label="lbl.selectRowLabel"
                                @update:model-value="toggleRow(row)"
                            />
                        </td>
                        <td
                            v-for="col in columns"
                            :key="col.key"
                            :data-label="col.label"
                            :style="{ textAlign: col.align || 'left' }"
                        >
                            <slot
                                :name="'cell-' + col.key"
                                :row="row"
                                :value="row[col.key]"
                                >{{ row[col.key] }}</slot
                            >
                        </td>
                    </tr>
                    <tr v-if="!paged.length" class="n-table__empty-row">
                        <td :colspan="columns.length + (selectable ? 1 : 0)">
                            <slot name="empty"
                                ><div class="n-table__empty">
                                    {{ lbl.emptyText }}
                                </div></slot
                            >
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-if="pageSize > 0 && sorted.length" class="n-table__foot">
            <span class="n-table__range">{{ rangeText }}</span>
            <NPagination v-model:page="page" :pages="pages" />
        </div>
    </div>
</template>

<style scoped>
.n-table-wrap {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    /* clip keeps rounded corners while allowing the inner X-scroll */
    overflow: hidden;
}
.n-table-scroll {
    overflow-x: auto;
}
.n-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs);
}
.n-table thead th {
    height: 46px;
    padding: 0 16px;
    background: var(--surface-2);
    border-bottom: 1px solid var(--border);
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: var(--text-3);
    white-space: nowrap;
}
.n-table__th {
    display: inline-flex;
    align-items: center;
    gap: 5px;
}
/* sort control — native button reset to inherit the header cell's typography */
.n-table__sort {
    font: inherit;
    letter-spacing: inherit;
    text-transform: inherit;
    color: inherit;
    background: none;
    border: 0;
    padding: 0;
    margin: 0;
    cursor: pointer;
    user-select: none;
}
.n-table__sort:hover {
    color: var(--text-2);
}
.n-table__sort:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
}
.n-table tbody td {
    min-height: var(--row-h);
    height: var(--row-h);
    padding: 0 16px;
    border-bottom: 1px solid var(--border);
    color: var(--text);
    transition:
        height 0.18s ease,
        padding 0.18s ease;
}
.n-table tbody tr.hoverable {
    transition: background 0.12s;
}
.n-table tbody tr.hoverable:hover {
    background: var(--surface-2);
}
/* Pointer + focus ring only when the row is actually clickable (@row-click bound). */
.n-table tbody tr.interactive {
    cursor: pointer;
}
.n-table tbody tr.interactive:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
}
.n-table tbody tr.on {
    background: var(--accent-soft);
}
.n-table__check {
    width: 46px;
    text-align: center;
}
.n-table__check :deep(.n-check) {
    justify-content: center;
}
.n-table__empty {
    padding: 48px 16px;
    text-align: center;
    color: var(--text-3);
    font-size: var(--fs);
}
.n-table__foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    font-size: 12.5px;
    color: var(--text-3);
}
.n-table__bulk {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 16px;
    height: 50px;
    background: var(--accent-soft);
    border-bottom: 1px solid var(--border);
}
.n-table__bulk-count {
    font-weight: 700;
    font-size: 13px;
    /* --accent-ink: --accent on --accent-soft misses AA (4.5:1). */
    color: var(--accent-ink);
}
.n-table__bulk-sep {
    width: 1px;
    height: 18px;
    background: var(--border-2);
}
.n-table__bulk-spacer {
    flex: 1;
}
.n-table__bulk-clear {
    height: 32px;
    padding: 0 10px;
    border: none;
    background: transparent;
    color: var(--text-2);
    font-family: inherit;
    font-weight: 600;
    font-size: 12.5px;
    cursor: pointer;
}
.n-table__bulk-clear:hover {
    color: var(--text);
}
.n-table__bulk-all {
    height: 30px;
    padding: 0 8px;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--accent-ink);
    font-family: inherit;
    font-weight: 700;
    font-size: 12.5px;
    text-decoration: underline;
    cursor: pointer;
}
.n-table__bulk-all:focus-visible,
.n-table__bulk-clear:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
}
/* Stacked (phone) layout: each row becomes a card of label/value lines. Sorting
   is a desktop feature; the header row is kept for screen readers only. */
@media (max-width: 640px) {
    .n-table-wrap--stacked .n-table thead {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
    }
    .n-table-wrap--stacked .n-table,
    .n-table-wrap--stacked .n-table tbody,
    .n-table-wrap--stacked .n-table tr {
        display: block;
        width: 100%;
    }
    .n-table-wrap--stacked .n-table tbody tr {
        padding: 8px 0;
        border-bottom: 1px solid var(--border);
    }
    .n-table-wrap--stacked .n-table tbody tr:last-child {
        border-bottom: 0;
    }
    .n-table-wrap--stacked .n-table tbody td {
        display: grid;
        grid-template-columns: minmax(84px, 34%) minmax(0, 1fr);
        align-items: center;
        gap: 10px;
        width: auto;
        height: auto;
        min-height: 0;
        padding: 5px 14px;
        border-bottom: 0;
        text-align: left !important;
        overflow-wrap: anywhere;
    }
    .n-table-wrap--stacked .n-table tbody td::before {
        content: attr(data-label);
        color: var(--text-3);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-transform: uppercase;
    }
    .n-table-wrap--stacked .n-table tbody td[data-label=""],
    .n-table-wrap--stacked .n-table tbody td:not([data-label]) {
        grid-template-columns: minmax(0, 1fr);
        justify-items: start;
    }
    .n-table-wrap--stacked .n-table tbody td[data-label=""]::before,
    .n-table-wrap--stacked .n-table tbody td:not([data-label])::before {
        content: none;
    }
    .n-table-wrap--stacked .n-table__bulk {
        flex-wrap: wrap;
        height: auto;
        min-height: 50px;
        padding: 8px 16px;
    }
}
</style>
