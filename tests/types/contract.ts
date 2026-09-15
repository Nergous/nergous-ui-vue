import { h } from "vue";
import {
    NButton,
    NSelect,
    NModal,
    NDataTable,
    NDropzone,
    useTheme,
    useToast,
    createFormat,
} from "nergous-cit-ui-vue";
const button: InstanceType<typeof NButton>["$props"] = {
    variant: "primary",
    loading: true,
    onClick: (e: MouseEvent) => e.preventDefault(),
};
h(NButton, button);
const select: InstanceType<typeof NSelect>["$props"] = {
    options: [{ value: 1, label: "One" }],
    "onUpdate:modelValue": (v) => String(v),
};
h(NSelect, select);
h(NModal, { dialogLabel: "Confirm", modelValue: true, onClose: () => {} });
const table: InstanceType<typeof NDataTable>["$props"] = {
    rows: [{ id: 1 }],
    columns: [{ key: "id", label: "ID" }],
    onRowClick: (row) => String(row.id),
    onSortChange: (sort) => sort.dir,
};
const drop: InstanceType<typeof NDropzone>["$props"] = {
    onFiles: (files) => files[0]?.name,
};
void table;
void drop;
useTheme().setTheme("dark");
useToast().push({ title: "Saved", duration: 0 });
createFormat("ru").formatNumber(null);
// @ts-expect-error invalid theme
useTheme().setTheme("purple");
// @ts-expect-error invalid model type
const bad: InstanceType<typeof NSelect>["$props"] = { modelValue: false };
const badOptions: InstanceType<typeof NSelect>["$props"] = {
    // @ts-expect-error option needs label
    options: [{ value: 1 }],
};
// @ts-expect-error pagination/type properties must not be silently any
const badButton: InstanceType<typeof NButton>["$props"] = { loading: "yes" };
void bad;
void badOptions;
void badButton;
