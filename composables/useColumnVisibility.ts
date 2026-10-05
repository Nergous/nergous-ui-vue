// useColumnVisibility — optional table columns the user can hide; the choice
// is remembered in localStorage under storageKey (omit it to keep the choice
// in memory only). Pair with NColumnPicker and NDataTable:
//   const { columns, columnChoices, hiddenColumns } =
//       useColumnVisibility(allColumns, ["author", "updated"], "posts.columns")
//   <NColumnPicker :columns="columnChoices" v-model:hidden="hiddenColumns" />
//   <NDataTable :columns="columns" ... />
import { computed, ref, toValue, watch, type MaybeRefOrGetter } from "vue";

interface VisibilityColumn {
    key: string;
    label: string;
}

/**
 * Hideable-column state for a table.
 * @param allColumns - All columns in display order (array, ref or getter).
 * @param optional - Keys the user may hide; other columns always show.
 * @param storageKey - localStorage key; empty keeps the choice in memory.
 * @returns Visible columns, the optional columns for the picker, and the hidden keys.
 */
export function useColumnVisibility<C extends VisibilityColumn>(
    allColumns: MaybeRefOrGetter<C[]>,
    optional: string[],
    storageKey = "",
) {
    function readHidden(): string[] {
        if (!storageKey || typeof localStorage === "undefined") return [];
        try {
            const stored = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
            return Array.isArray(stored) ? stored.filter((key) => optional.includes(key)) : [];
        } catch {
            return [];
        }
    }

    const hiddenColumns = ref<string[]>(readHidden());
    watch(hiddenColumns, (keys) => {
        if (!storageKey) return;
        try {
            localStorage.setItem(storageKey, JSON.stringify(keys));
        } catch {
            // Storage unavailable: the choice lasts until the page reloads.
        }
    });

    const columnChoices = computed(() =>
        toValue(allColumns).filter((c) => optional.includes(c.key)),
    );
    const columns = computed(() =>
        toValue(allColumns).filter((c) => !hiddenColumns.value.includes(c.key)),
    );

    return { columns, columnChoices, hiddenColumns };
}
