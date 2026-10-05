<script setup lang="ts">
import { onBeforeUnmount, ref, useId, watch, type PropType } from "vue";
import NIcon from "../primitives/NIcon.vue";
import { useFloating } from "../../composables/useFloating.ts";
import { useDismiss } from "../../composables/useDismiss.ts";

// NPopover — a toolbar button that opens a small non-modal panel under it
// (column picker, export options, quick settings). The default slot is the panel
// and receives { close }. Closes on an outside click, Escape (topmost overlay
// first, focus returns to the button) or via close(). The panel is teleported
// like NSelect/NDropdown, so it is not clipped by scrolling containers.
const props = defineProps({
    /** Visible button text. */
    label: { type: String, default: "" },
    /** Leading NIcon name. */
    icon: { type: String, default: "" },
    disabled: { type: Boolean, default: false },
    /** Minimum panel width (CSS length). */
    width: { type: String, default: "" },
    align: {
        type: String as PropType<"left" | "right">,
        default: "right",
    },
});
const emit = defineEmits<{ "update:open": [open: boolean] }>();

const open = ref(false);
const root = ref<HTMLElement | null>(null);
const toggleEl = ref<HTMLButtonElement | null>(null);
const panel = ref<HTMLElement | null>(null);
const panelId = useId();
const floating = useFloating(root, panel, open, {
    matchWidth: false,
    align: () => props.align,
});

function close(returnFocus = false): void {
    if (!open.value) return;
    open.value = false;
    if (returnFocus) toggleEl.value?.focus();
}
function toggle(): void {
    if (props.disabled) return;
    open.value = !open.value;
}

function onDocClick(e: MouseEvent): void {
    const t = e.target;
    if (!(t instanceof Node)) return;
    if (root.value?.contains(t) || panel.value?.contains(t)) return;
    close();
}
watch(open, (isOpen) => {
    emit("update:open", isOpen);
    if (isOpen) document.addEventListener("click", onDocClick);
    else document.removeEventListener("click", onDocClick);
});
watch(
    () => props.disabled,
    (disabled) => disabled && close(),
);
useDismiss(open, () => close(true));
onBeforeUnmount(() => document.removeEventListener("click", onDocClick));
defineExpose({ close });
</script>

<template>
    <div ref="root" class="n-pop">
        <button
            ref="toggleEl"
            type="button"
            class="n-pop__toggle"
            :aria-expanded="open"
            :aria-controls="open ? panelId : undefined"
            :disabled="disabled"
            @click="toggle"
        >
            <NIcon v-if="icon" :name="icon" :size="16" />
            <slot name="label">{{ label }}</slot>
            <NIcon
                name="chevron-down"
                :size="14"
                class="n-pop__chev"
                :class="{ 'n-pop__chev--open': open }"
            />
        </button>
        <Teleport :to="floating.target.value">
            <Transition name="n-pop-fade">
                <div
                    v-if="open"
                    :id="panelId"
                    ref="panel"
                    class="n-pop__panel"
                    :style="floating.style.value"
                >
                    <div class="n-pop__body" :style="width ? { minWidth: width } : undefined">
                        <slot :close="close" />
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<style scoped>
.n-pop {
    position: relative;
    display: inline-flex;
}
.n-pop__toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: var(--control-h);
    padding: 0 12px 0 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
    color: var(--text-2);
    font-family: inherit;
    font-weight: 600;
    font-size: var(--fs);
    white-space: nowrap;
    cursor: pointer;
    transition: border-color 0.14s ease;
}
.n-pop__toggle:hover:not(:disabled),
.n-pop__toggle[aria-expanded="true"] {
    border-color: var(--border-2);
}
.n-pop__toggle:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
}
.n-pop__toggle:disabled {
    background: var(--surface-3);
    color: var(--text-3);
    cursor: not-allowed;
}
.n-pop__chev {
    color: var(--text-3);
    transition: transform 0.18s ease;
}
.n-pop__chev--open {
    transform: rotate(180deg);
}
.n-pop__panel {
    box-sizing: border-box;
    overflow: auto;
    padding: 12px;
    border: 1px solid var(--border-2);
    border-radius: 12px;
    background: var(--surface);
    box-shadow: var(--shadow-lg);
}
.n-pop__body {
    min-width: 200px;
}
.n-pop-fade-enter-active,
.n-pop-fade-leave-active {
    transition:
        opacity 0.14s ease,
        transform 0.14s ease;
}
.n-pop-fade-enter-from,
.n-pop-fade-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}
@media (prefers-reduced-motion: reduce) {
    .n-pop-fade-enter-from,
    .n-pop-fade-leave-to {
        transform: none;
    }
    .n-pop__chev {
        transition: none;
    }
}
</style>
