// useConfirm — state for NConfirmDialog: open flag, the payload being confirmed
// (e.g. the row to delete) and a loading flag. The returned object is reactive,
// so bind its fields directly:
//   const confirm = useConfirm<{ id: number; name: string }>()
//   confirm.ask(row)
//   <NConfirmDialog v-model="confirm.open" :loading="confirm.loading"
//       @confirm="confirm.run((row) => api.delete(row!.id))" />
import { reactive, ref } from "vue";

/**
 * Create confirmation state.
 * @returns Reactive { open, payload, loading, ask, close, run }.
 */
export function useConfirm<T = unknown>() {
    const open = ref(false);
    const payload = ref<T | null>(null);
    const loading = ref(false);

    /** Open the dialog for a payload. */
    function ask(data: T | null = null): void {
        payload.value = data as T | null;
        loading.value = false;
        open.value = true;
    }

    /** Close the dialog and reset the loading flag. */
    function close(): void {
        open.value = false;
        loading.value = false;
    }

    /**
     * Run the confirmed action with loading on; close on success. On failure the
     * dialog stays open, loading resets and the error is rethrown.
     */
    async function run(action: (payload: T | null) => unknown): Promise<void> {
        loading.value = true;
        try {
            await action(payload.value as T | null);
            close();
        } catch (error) {
            loading.value = false;
            throw error;
        }
    }

    return reactive({ open, payload, loading, ask, close, run });
}
