import { watch, onMounted, onBeforeUnmount } from "vue";
import {
    overlayOwner,
    activateOverlay,
    deactivateOverlay,
    isTopOverlay,
} from "./useOverlayStack.js";

// Call before useFocusTrap: release background inertness before returning focus.
export function useInert(isActive, roots = []) {
    const owner = overlayOwner();
    const active =
        typeof isActive === "function" ? isActive : () => isActive?.value;
    let held = false;
    function apply(on) {
        if (on && !held) {
            held = true;
            activateOverlay(owner, roots);
        } else if (!on && held) {
            held = false;
            deactivateOverlay(owner);
        }
    }
    watch(active, (v) => apply(!!v), { flush: "post" });
    onMounted(() => apply(!!active()));
    onBeforeUnmount(() => apply(false));
    return { layer: owner.layer, isTop: () => isTopOverlay(owner) };
}
