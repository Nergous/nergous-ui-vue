<script setup lang="ts">
import { useLabels } from "../../composables/useLocale.ts";

// NActionBar — save bar of a form: sticks to the bottom of the scroll area, says
// whether the form has unsaved changes (polite live region) and holds the form
// buttons (delete, cancel, save) in the default slot. The #status slot replaces
// the state text. Set sticky=false to place it in normal flow.
const props = defineProps({
    dirty: { type: Boolean, default: false },
    idleText: { type: String, default: undefined },
    dirtyText: { type: String, default: undefined },
    sticky: { type: Boolean, default: true },
});
// Labels: prop → provided locale (useLocale) → English default.
const lbl = useLabels(props, {
    idleText: "actionBar.idle",
    dirtyText: "actionBar.dirty",
});
</script>

<template>
    <div
        class="n-abar"
        :class="{ 'n-abar--dirty': dirty, 'n-abar--sticky': sticky }"
    >
        <span class="n-abar__state" aria-live="polite">
            <slot name="status" :dirty="dirty">
                <span class="n-abar__dot" aria-hidden="true" />
                {{ dirty ? lbl.dirtyText : lbl.idleText }}
            </slot>
        </span>
        <div class="n-abar__actions"><slot /></div>
    </div>
</template>

<style scoped>
.n-abar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px 12px;
    padding: 10px 12px 10px 18px;
    background: var(--surface);
    border: 1px solid var(--border-2);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
}
.n-abar--sticky {
    position: sticky;
    bottom: 12px;
    z-index: 5;
}
.n-abar__state {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 180px;
    color: var(--text-3);
    font-size: 12.5px;
}
.n-abar--dirty .n-abar__state {
    color: var(--text-2);
    font-weight: 600;
}
.n-abar__dot {
    flex: none;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--ok);
}
.n-abar--dirty .n-abar__dot {
    background: var(--warn);
}
.n-abar__actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
}
@media (max-width: 600px) {
    .n-abar__actions {
        width: 100%;
        justify-content: flex-end;
    }
}
</style>
