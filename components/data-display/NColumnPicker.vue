<script setup lang="ts">
import type { PropType } from "vue";
import NPopover from "../overlays/NPopover.vue";
import NCheckbox from "../forms/NCheckbox.vue";
import { useLabels } from "../../composables/useLocale.ts";

// NColumnPicker — popover with a checkbox per optional table column.
// v-model:hidden is the list of hidden column keys; pair it with
// useColumnVisibility(), which filters the columns and remembers the choice.
interface PickerColumn {
    key: string;
    label: string;
}

const props = defineProps({
    columns: {
        type: Array as PropType<PickerColumn[]>,
        default: () => [],
    },
    hidden: {
        type: Array as PropType<string[]>,
        default: () => [],
    },
    label: { type: String, default: undefined },
    disabled: { type: Boolean, default: false },
});
const emit = defineEmits<{ "update:hidden": [keys: string[]] }>();
// Labels: prop → provided locale (useLocale) → English default.
const lbl = useLabels(props, { label: "table.columns" });

function toggle(key: string, shown: boolean): void {
    emit(
        "update:hidden",
        shown ? props.hidden.filter((k) => k !== key) : [...props.hidden, key],
    );
}
</script>

<template>
    <NPopover :label="lbl.label" icon="columns" :disabled="disabled || !columns.length">
        <div class="n-colpick" role="group" :aria-label="lbl.label">
            <NCheckbox
                v-for="c in columns"
                :key="c.key"
                :model-value="!hidden.includes(c.key)"
                @update:model-value="(v: boolean) => toggle(c.key, v)"
                >{{ c.label }}</NCheckbox
            >
        </div>
    </NPopover>
</template>

<style scoped>
.n-colpick {
    display: grid;
    gap: 8px;
}
</style>
