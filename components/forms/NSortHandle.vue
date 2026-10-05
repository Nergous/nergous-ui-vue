<script setup lang="ts">
import { useLabels } from "../../composables/useLocale.ts";

// NSortHandle — grip button for useSortable rows: drag it with the pointer or
// press ↑/↓ on it. Bind the composable's handlers on it:
//   <NSortHandle :label="'Move ' + item.title" :active="draggingId === item.id"
//       @pointerdown="startDrag($event, item.id)"
//       @keydown="onHandleKeydown($event, item.id)" />
// Listeners and attributes fall through to the button.
const props = defineProps({
    /** Accessible name, e.g. "Move “News”". The keyboard hint is appended. */
    label: { type: String, required: true },
    /** The row is being dragged. */
    active: { type: Boolean, default: false },
    /** Keyboard hint appended to the label. */
    hint: { type: String, default: undefined },
});
// Labels: prop → provided locale (useLocale) → English default.
const lbl = useLabels(props, { hint: "sort.hint" });

const DOTS = [
    [3, 3],
    [9, 3],
    [3, 9],
    [9, 9],
    [3, 15],
    [9, 15],
];
</script>

<template>
    <button
        type="button"
        class="n-sort-handle"
        :class="{ 'is-active': active }"
        data-sort-handle
        :aria-label="lbl.hint ? label + '. ' + lbl.hint : label"
    >
        <svg width="12" height="18" viewBox="0 0 12 18" aria-hidden="true">
            <circle v-for="([cx, cy], i) in DOTS" :key="i" :cx="cx" :cy="cy" r="1.6" />
        </svg>
    </button>
</template>

<style scoped>
.n-sort-handle {
    flex: none;
    display: grid;
    place-items: center;
    width: 24px;
    height: 32px;
    padding: 0;
    border: none;
    border-radius: var(--radius-sm);
    background: none;
    color: var(--text-3);
    fill: currentColor;
    cursor: grab;
    touch-action: none;
    transition:
        color 0.15s ease,
        background-color 0.15s ease;
}
.n-sort-handle:hover,
.n-sort-handle.is-active {
    color: var(--text);
    background: var(--surface-3);
}
.n-sort-handle.is-active {
    cursor: grabbing;
}
.n-sort-handle:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
}
</style>
