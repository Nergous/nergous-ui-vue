<script setup lang="ts">
import NModal from "./NModal.vue";
import NButton from "../forms/NButton.vue";
import { useLabels } from "../../composables/useLocale.ts";

// NConfirmDialog — confirmation built on NModal: message, Cancel and a confirm
// button (danger styling for destructive actions). v-model controls open state;
// `confirm` fires on the confirm button, `cancel` on any dismissal. The dialog
// stays open while the app works; close it (v-model) when the action finishes,
// and pass `loading` meanwhile. Pair with useConfirm() for state and payload.
// The confirm button carries data-enter-submit, so installEnterSubmit() lets
// Enter confirm.
const props = defineProps({
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: undefined },
    message: { type: String, default: "" },
    confirmLabel: { type: String, default: undefined },
    cancelLabel: { type: String, default: undefined },
    closeLabel: { type: String, default: undefined },
    danger: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    width: { type: String, default: "420px" },
});
const emit = defineEmits<{
    "update:modelValue": [open: boolean];
    confirm: [];
    cancel: [];
}>();
// Labels: prop → provided locale (useLocale) → English default.
const lbl = useLabels(props, {
    title: "confirm.title",
    confirmLabel: "confirm.confirm",
    cancelLabel: "confirm.cancel",
});

function update(open: boolean): void {
    emit("update:modelValue", open);
}
function onClose(): void {
    emit("cancel");
}
</script>

<template>
    <NModal
        :model-value="modelValue"
        :title="lbl.title"
        :width="width"
        :close-label="closeLabel"
        @update:model-value="update"
        @close="onClose"
    >
        <p v-if="message" class="n-confirm__msg">{{ message }}</p>
        <slot />
        <template #footer="{ close }">
            <NButton variant="secondary" block :disabled="loading" @click="close">
                {{ lbl.cancelLabel }}
            </NButton>
            <NButton
                :variant="danger ? 'danger' : 'primary'"
                block
                :loading="loading"
                data-enter-submit
                @click="emit('confirm')"
            >
                {{ lbl.confirmLabel }}
            </NButton>
        </template>
    </NModal>
</template>

<style scoped>
.n-confirm__msg {
    margin: 0;
    color: var(--text-2);
    font-size: 14px;
    line-height: 1.5;
}
.n-confirm__msg + :slotted(*) {
    margin-top: 12px;
}
</style>
