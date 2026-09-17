import { watch, onMounted, onBeforeUnmount, type Ref } from "vue";
import {
    overlayOwner,
    activateOverlay,
    deactivateOverlay,
    isTopOverlay,
    type OverlayRoot
} from "./useOverlayStack.js";

type ActiveSource = Ref<boolean> | (() => boolean);

export interface InertState {
    layer: Ref<number>;
    isTop(): boolean;
}

// Call before useFocusTrap: release background inertness before returning focus.
export function useInert(isActive: ActiveSource, roots: OverlayRoot[] = []): InertState {
    const owner = overlayOwner();
    const active = typeof isActive === "function" ? isActive : () => isActive.value;
    let held = false;

    function apply(on: boolean) {
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

    return {
        layer: owner.layer,
        isTop: () => isTopOverlay(owner)
    };
}
