<script setup lang="ts">
import type { PropType } from "vue";
import NIcon from "../primitives/NIcon.vue";
import { useLabels } from "../../composables/useLocale.ts";

// NFilterChips — the active filters of a list as removable chips, usually under
// the list toolbar. Shows at a glance that the list is narrowed and resets one
// filter or all of them. Pass only the filters that are set, with readable
// values; one chip per value works for multi-value filters (unique keys).
interface FilterChip {
    key: string;
    label: string;
    value: string;
}

const props = defineProps({
    filters: {
        type: Array as PropType<FilterChip[]>,
        default: () => [],
    },
    groupLabel: { type: String, default: undefined },
    resetLabel: { type: String, default: undefined },
    removeLabel: {
        type: Function as PropType<(label: string, value: string) => string>,
        default: undefined,
    },
});
const emit = defineEmits<{ remove: [key: string]; reset: [] }>();
// Labels: prop → provided locale (useLocale) → English default.
const lbl = useLabels(props, {
    groupLabel: "filters.label",
    resetLabel: "filters.reset",
    removeLabel: "filters.remove",
});
</script>

<template>
    <div
        v-if="filters.length"
        class="n-fchips"
        role="group"
        :aria-label="lbl.groupLabel"
    >
        <span v-for="filter in filters" :key="filter.key" class="n-fchips__chip">
            <span class="n-fchips__text"
                >{{ filter.label }}: <b>{{ filter.value }}</b></span
            >
            <button
                type="button"
                class="n-fchips__remove"
                :aria-label="lbl.removeLabel(filter.label, filter.value)"
                @click="emit('remove', filter.key)"
            >
                <NIcon name="x" :size="13" />
            </button>
        </span>
        <button type="button" class="n-fchips__reset" @click="emit('reset')">
            {{ lbl.resetLabel }}
        </button>
    </div>
</template>

<style scoped>
.n-fchips {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
}
.n-fchips__chip {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    max-width: 100%;
    height: 28px;
    padding: 0 3px 0 10px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: var(--surface-2);
    color: var(--text-2);
    font-size: 12.5px;
}
.n-fchips__text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.n-fchips__text b {
    color: var(--text);
    font-weight: 600;
}
.n-fchips__remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 22px;
    height: 22px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--text-3);
    cursor: pointer;
}
.n-fchips__remove:hover {
    background: var(--surface-3);
    color: var(--text);
}
.n-fchips__remove:focus-visible,
.n-fchips__reset:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
}
.n-fchips__reset {
    height: 28px;
    padding: 0 8px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--accent-ink);
    font-family: inherit;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
}
.n-fchips__reset:hover {
    text-decoration: underline;
}
</style>
