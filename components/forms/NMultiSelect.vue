<script setup lang="ts">
import {
    computed,
    nextTick,
    onBeforeUnmount,
    ref,
    useAttrs,
    useId,
    watch,
    type PropType,
} from "vue";
import NIcon from "../primitives/NIcon.vue";
import NCheckbox from "./NCheckbox.vue";
import { useFormField } from "../../composables/useFormField.ts";
import { useFloating } from "../../composables/useFloating.ts";
import { useDismiss } from "../../composables/useDismiss.ts";
import { useLabels } from "../../composables/useLocale.ts";

// NMultiSelect — select-like button with a panel of checkboxes; v-model is an
// array of values kept in options order. Every tick updates v-model right away,
// so a filtered list can reload while the panel stays open. Closed, the button
// shows the placeholder, the chosen label, or "First +N"; it is highlighted
// while anything is chosen. `search` adds a field for long option lists.
// Typical use: list filters where values of one filter combine with OR.
type MultiValue = string | number;

interface MultiOption {
    value: MultiValue;
    label: string;
    disabled?: boolean;
}

const props = defineProps({
    modelValue: {
        type: Array as PropType<MultiValue[]>,
        default: () => [],
    },
    options: {
        type: Array as PropType<MultiOption[]>,
        default: () => [],
    },
    /** Accessible filter name when the control is not inside NFormField. */
    label: { type: String, default: "" },
    placeholder: { type: String, default: undefined },
    search: { type: Boolean, default: false },
    searchPlaceholder: { type: String, default: undefined },
    noResultsText: { type: String, default: undefined },
    selectedLabel: {
        type: Function as PropType<(count: number) => string>,
        default: undefined,
    },
    clearLabel: { type: String, default: undefined },
    error: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
});
const emit = defineEmits<{ "update:modelValue": [value: MultiValue[]] }>();
// Labels: prop → provided locale (useLocale) → English default.
const lbl = useLabels(props, {
    placeholder: "select.placeholder",
    searchPlaceholder: "multiSelect.search",
    noResultsText: "multiSelect.noResults",
    selectedLabel: "multiSelect.selected",
    clearLabel: "multiSelect.clear",
});

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }));
const controlAttrs = computed(() => {
    const { class: _class, style: _style, ...rest } = attrs;
    return rest;
});

const field = useFormField();
const invalid = computed(() => props.error || !!field?.invalid.value);
const uid = useId();
const panelId = uid + "-panel";
const valueId = uid + "-value";

const open = ref(false);
const query = ref("");
const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);
const panel = ref<HTMLElement | null>(null);
const floating = useFloating(root, panel, open, { matchWidth: false });

const labelOf = (value: MultiValue): string =>
    props.options.find((o) => o.value === value)?.label ?? String(value);
const summary = computed(() => {
    const values = props.modelValue;
    if (!values.length) return lbl.value.placeholder;
    const first = labelOf(values[0]);
    return values.length === 1 ? first : first + " +" + (values.length - 1);
});
const visible = computed(() => {
    const term = query.value.trim().toLocaleLowerCase();
    return term
        ? props.options.filter((o) => o.label.toLocaleLowerCase().includes(term))
        : props.options;
});
// Name: NFormField label + current value, or the label prop + value.
const ariaLabelledby = computed(() =>
    field?.labelledby.value ? field.labelledby.value + " " + valueId : undefined,
);
const ariaLabel = computed(() =>
    !ariaLabelledby.value && props.label ? props.label + ": " + summary.value : undefined,
);

function toggle(value: MultiValue, on: boolean): void {
    const next = on
        ? props.options
              .map((o) => o.value)
              .filter((v) => v === value || props.modelValue.includes(v))
        : props.modelValue.filter((v) => v !== value);
    emit("update:modelValue", next);
}
function clear(): void {
    emit("update:modelValue", []);
}

async function show(): Promise<void> {
    if (props.disabled) return;
    open.value = true;
    query.value = "";
    await nextTick();
    await nextTick();
    panel.value?.querySelector<HTMLElement>("input, [role='checkbox']")?.focus();
}
function close(returnFocus = false): void {
    if (!open.value) return;
    open.value = false;
    if (returnFocus) trigger.value?.focus();
}

const inside = (node: unknown): boolean =>
    node instanceof Node &&
    (!!root.value?.contains(node) || !!panel.value?.contains(node));
function onDocPointer(event: Event): void {
    if (!inside(event.target)) close();
}
function onFocusOut(event: FocusEvent): void {
    if (event.relatedTarget && !inside(event.relatedTarget)) close();
}
watch(open, (isOpen) => {
    if (isOpen) document.addEventListener("pointerdown", onDocPointer, true);
    else document.removeEventListener("pointerdown", onDocPointer, true);
});
watch(
    () => props.disabled,
    (disabled) => disabled && close(),
);
useDismiss(open, () => close(true));
onBeforeUnmount(() =>
    document.removeEventListener("pointerdown", onDocPointer, true),
);
</script>

<template>
    <div
        ref="root"
        class="n-ms"
        :class="{ 'n-ms--set': modelValue.length, error: invalid }"
        v-bind="rootAttrs"
        @focusout="onFocusOut"
    >
        <button
            ref="trigger"
            type="button"
            class="n-ms__control"
            aria-haspopup="true"
            :aria-expanded="open"
            :aria-controls="open ? panelId : undefined"
            :aria-labelledby="ariaLabelledby"
            :aria-label="ariaLabel"
            :aria-describedby="field?.describedBy.value || undefined"
            :aria-invalid="invalid || undefined"
            :disabled="disabled"
            v-bind="controlAttrs"
            @click="open ? close() : show()"
        >
            <span :id="valueId" class="n-ms__value">{{ summary }}</span>
            <NIcon
                name="chevron-down"
                :size="16"
                class="n-ms__chev"
                :class="{ 'n-ms__chev--open': open }"
            />
        </button>
        <Teleport :to="floating.target.value">
            <div
                v-if="open"
                :id="panelId"
                ref="panel"
                class="n-ms__panel"
                role="group"
                :aria-label="label || undefined"
                :aria-labelledby="!label ? field?.labelledby.value || undefined : undefined"
                :style="floating.style.value"
                @focusout="onFocusOut"
            >
                <div v-if="search" class="n-ms__search-wrap">
                    <NIcon name="search" :size="15" class="n-ms__search-icon" />
                    <input
                        v-model="query"
                        type="text"
                        class="n-ms__search"
                        :placeholder="lbl.searchPlaceholder"
                        :aria-label="lbl.searchPlaceholder"
                        autocomplete="off"
                        data-enter-ignore
                    />
                </div>
                <div class="n-ms__list">
                    <NCheckbox
                        v-for="option in visible"
                        :key="option.value"
                        :model-value="modelValue.includes(option.value)"
                        :disabled="option.disabled"
                        class="n-ms__option"
                        @update:model-value="(on: boolean) => toggle(option.value, on)"
                        >{{ option.label }}</NCheckbox
                    >
                    <p v-if="!visible.length" class="n-ms__empty">
                        {{ lbl.noResultsText }}
                    </p>
                </div>
                <div v-if="modelValue.length" class="n-ms__foot">
                    <span class="n-ms__count">{{ lbl.selectedLabel(modelValue.length) }}</span>
                    <button type="button" class="n-ms__clear" @click="clear">
                        {{ lbl.clearLabel }}
                    </button>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<style scoped>
.n-ms {
    position: relative;
    display: inline-flex;
    min-width: 0;
}
.n-ms__control {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: var(--control-h);
    padding: 0 11px 0 13px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
    color: var(--text-2);
    font-family: inherit;
    font-size: var(--fs);
    font-weight: 600;
    cursor: pointer;
    transition: border-color 0.14s ease;
}
.n-ms__control:hover:not(:disabled),
.n-ms__control[aria-expanded="true"] {
    border-color: var(--border-2);
}
.n-ms__control:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
}
.n-ms__control:disabled {
    background: var(--surface-3);
    color: var(--text-3);
    cursor: not-allowed;
}
.n-ms--set .n-ms__control {
    border-color: var(--accent);
    background: var(--accent-soft);
    color: var(--accent-ink);
}
.n-ms.error .n-ms__control {
    border-color: var(--danger);
    border-width: 1.5px;
}
.n-ms__value {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.n-ms__chev {
    flex: none;
    color: var(--text-3);
    transition: transform 0.18s ease;
}
.n-ms--set .n-ms__chev {
    color: inherit;
}
.n-ms__chev--open {
    transform: rotate(180deg);
}
.n-ms__panel {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 240px;
    padding: 12px;
    overflow: auto;
    border: 1px solid var(--border-2);
    border-radius: 12px;
    background: var(--surface);
    box-shadow: var(--shadow-lg);
}
.n-ms__search-wrap {
    position: relative;
    flex: none;
}
.n-ms__search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-3);
    pointer-events: none;
}
.n-ms__search {
    box-sizing: border-box;
    width: 100%;
    height: 34px;
    padding: 0 10px 0 32px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text);
    font-family: inherit;
    font-size: 13px;
    outline: none;
}
.n-ms__search:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent);
}
.n-ms__list {
    display: grid;
    gap: 9px;
    min-height: 0;
    overflow-y: auto;
    padding: 2px;
}
.n-ms__option {
    align-items: flex-start;
}
.n-ms__empty {
    margin: 0;
    color: var(--text-3);
    font-size: 13px;
}
.n-ms__foot {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-top: 9px;
    border-top: 1px solid var(--border);
}
.n-ms__count {
    color: var(--text-3);
    font-size: 12.5px;
}
.n-ms__clear {
    padding: 2px 4px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--accent-ink);
    font-family: inherit;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
}
.n-ms__clear:hover {
    text-decoration: underline;
}
.n-ms__clear:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
}
@media (prefers-reduced-motion: reduce) {
    .n-ms__chev {
        transition: none;
    }
}
</style>
