// useDismiss — coordinates Escape-to-dismiss across stacked overlays so a single
// Escape closes only the topmost open overlay.
import { watch, onMounted, onBeforeUnmount, type Ref } from "vue";

type ActiveSource = Ref<boolean> | (() => boolean);

const dismissStack: object[] = [];

export function useDismiss(
    isActive: ActiveSource,
    onDismiss: () => void,
): void {
    const active =
        typeof isActive === "function" ? isActive : () => isActive.value;
    const id = {};

    function onKeydown(event: KeyboardEvent): void {
        if (event.key !== "Escape") return;
        if (event.defaultPrevented) return;
        if (dismissStack[dismissStack.length - 1] !== id) return;
        event.preventDefault();
        event.stopPropagation();
        onDismiss();
    }

    function activate(): void {
        if (!dismissStack.includes(id)) dismissStack.push(id);
        document.addEventListener("keydown", onKeydown);
    }

    function deactivate(): void {
        document.removeEventListener("keydown", onKeydown);
        const index = dismissStack.indexOf(id);
        if (index !== -1) dismissStack.splice(index, 1);
    }

    watch(active, (open) => (open ? activate() : deactivate()), {
        flush: "post",
    });
    onMounted(() => {
        if (active()) activate();
    });
    onBeforeUnmount(deactivate);
}
