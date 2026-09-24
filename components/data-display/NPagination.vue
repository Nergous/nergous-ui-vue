<script setup lang="ts">
import { computed, ref, useId, watch } from "vue";
import NButton from "../forms/NButton.vue";
import NIcon from "../primitives/NIcon.vue";

// NPagination — page navigation. v-model:page is the current page; pages = total count.
// Locale-agnostic: all visible and accessible labels come from props (English
// defaults). The app may also pass an `aria-label` for the <nav> landmark.
const props = defineProps({
    page: { type: Number, default: 1 },
    pages: { type: Number, default: 1 },
    prevLabel: { type: String, default: "Previous page" },
    nextLabel: { type: String, default: "Next page" },
    jumpable: { type: Boolean, default: false },
    jumpLabel: { type: String, default: "Page" },
    jumpButtonLabel: { type: String, default: "Go" },
    totalLabel: { type: String, default: "of" },
    jumpErrorLabel: { type: String, default: "Enter a valid page number" },
});
const emit = defineEmits<{
    "update:page": [page: number];
}>();
const totalPages = computed(() =>
    Number.isFinite(props.pages) ? Math.max(1, Math.floor(props.pages)) : 1,
);
const currentPage = computed(() =>
    Number.isFinite(props.page)
        ? Math.min(Math.max(1, Math.floor(props.page)), totalPages.value)
        : 1,
);
const jumpInputId = `n-pg-jump-${useId()}`;
const jumpErrorId = `${jumpInputId}-error`;
const targetPage = ref<number | string>(currentPage.value);
const normalizedTarget = computed(() => {
    if (targetPage.value === "") return null;

    const page = Number(targetPage.value);
    if (!Number.isInteger(page) || page < 1 || page > totalPages.value) {
        return null;
    }

    return page;
});
const targetInvalid = computed(
    () => targetPage.value !== "" && normalizedTarget.value === null,
);
const canJump = computed(
    () =>
        normalizedTarget.value !== null &&
        normalizedTarget.value !== currentPage.value,
);
watch(
    [() => props.page, totalPages],
    () => {
        if (props.page !== currentPage.value)
            emit("update:page", currentPage.value);
        targetPage.value = currentPage.value;
    },
    { immediate: true },
);
function go(p: number | string): void {
    if (typeof p !== "number") return;
    if (p >= 1 && p <= totalPages.value && p !== currentPage.value)
        emit("update:page", p);
}
function jumpToPage(): void {
    if (!canJump.value || normalizedTarget.value === null) return;

    targetPage.value = normalizedTarget.value;
    emit("update:page", normalizedTarget.value);
}

// Windowed page list with ellipses: always show first/last, current ±1.
const items = computed<Array<number | string>>(() => {
    const total = totalPages.value;
    const cur = currentPage.value;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const set = new Set([1, total, cur, cur - 1, cur + 1]);
    const list = [...set]
        .filter((p) => p >= 1 && p <= total)
        .sort((a, b) => a - b);
    const out: Array<number | string> = [];
    let prev = 0;
    for (const p of list) {
        if (p - prev > 1) out.push("…");
        out.push(p);
        prev = p;
    }
    return out;
});
</script>

<template>
    <nav class="n-pg">
        <div class="n-pg__pages">
            <button
                type="button"
                class="n-pg__nav"
                :disabled="currentPage <= 1"
                :aria-label="prevLabel"
                @click="go(currentPage - 1)"
            >
                <NIcon name="chevron-left" :size="15" />
            </button>
            <template v-for="(it, i) in items" :key="i">
                <span v-if="it === '…'" class="n-pg__gap" aria-hidden="true"
                    >…</span
                >
                <button
                    v-else
                    type="button"
                    class="n-pg__pg"
                    :class="{ on: it === currentPage }"
                    :aria-current="it === currentPage ? 'page' : undefined"
                    @click="go(it)"
                >
                    {{ it }}
                </button>
            </template>
            <button
                type="button"
                class="n-pg__nav"
                :disabled="currentPage >= totalPages"
                :aria-label="nextLabel"
                @click="go(currentPage + 1)"
            >
                <NIcon name="chevron-right" :size="15" />
            </button>
        </div>

        <div
            v-if="jumpable"
            class="n-pg__jump"
        >
            <label :for="jumpInputId" class="n-pg__jump-label">
                {{ jumpLabel }}
            </label>
            <input
                :id="jumpInputId"
                v-model="targetPage"
                class="n-pg__jump-input"
                :class="{ 'n-pg__jump-input--error': targetInvalid }"
                type="number"
                inputmode="numeric"
                :min="1"
                :max="totalPages"
                :aria-invalid="targetInvalid || undefined"
                :aria-describedby="targetInvalid ? jumpErrorId : undefined"
                @keydown.enter.prevent="jumpToPage"
            />
            <span class="n-pg__jump-total" aria-hidden="true">
                {{ totalLabel }} {{ totalPages }}
            </span>
            <NButton
                type="button"
                variant="secondary"
                :disabled="!canJump"
                @click="jumpToPage"
            >
                {{ jumpButtonLabel }}
            </NButton>
            <span
                v-if="targetInvalid"
                :id="jumpErrorId"
                class="n-pg__jump-error"
                role="alert"
            >
                {{ jumpErrorLabel }}
            </span>
        </div>
    </nav>
</template>

<style scoped>
.n-pg {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--sp-3);
}
.n-pg__pages,
.n-pg__jump {
    display: inline-flex;
    align-items: center;
}
.n-pg__pages {
    gap: 6px;
}
.n-pg__jump {
    gap: var(--sp-2);
}
.n-pg__jump-label,
.n-pg__jump-total {
    color: var(--text-2);
    font-size: var(--fs);
    white-space: nowrap;
}
.n-pg__jump-input {
    width: 8ch;
    height: var(--control-h);
    padding: 0 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
    color: var(--text);
    font-family: inherit;
    font-size: var(--fs);
    outline: none;
    transition:
        border-color 0.14s ease,
        box-shadow 0.14s ease;
}
.n-pg__jump-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent);
}
.n-pg__jump-input--error {
    border-color: var(--danger);
    border-width: 1.5px;
}
.n-pg__jump-error {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
.n-pg__nav,
.n-pg__pg {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: var(--control-h);
    height: var(--control-h);
    padding: 0 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
    color: var(--text-2);
    font-family: inherit;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition:
        background-color 0.14s ease,
        border-color 0.14s ease,
        color 0.14s ease,
        box-shadow 0.14s ease;
}
.n-pg__nav {
    padding: 0;
}
.n-pg__nav:hover:not(:disabled),
.n-pg__pg:not(.on):hover {
    background: var(--surface-3);
    border-color: var(--text-3);
}
.n-pg__pg.on {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
}
.n-pg__nav:focus,
.n-pg__pg:focus {
    outline: none;
}
.n-pg__nav:focus-visible,
.n-pg__pg:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
}
.n-pg__nav:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}
.n-pg__gap {
    min-width: 24px;
    text-align: center;
    color: var(--text-3);
    font-size: 13px;
    font-weight: 700;
    user-select: none;
}
</style>
