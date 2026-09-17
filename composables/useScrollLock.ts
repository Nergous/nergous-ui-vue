// useScrollLock — lock <body> scroll while `isActive` is truthy, restoring the
// previous overflow on release. Ref-counted across stacked overlays.
import { watch, onMounted, onBeforeUnmount, type Ref } from "vue";

type ActiveSource = Ref<boolean> | (() => boolean);

let locks = 0;
let previousOverflow = "";

function lock(): void {
    if (locks === 0) {
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
    }
    locks++;
}

function unlock(): void {
    if (locks === 0) return;
    locks--;
    if (locks === 0) document.body.style.overflow = previousOverflow;
}

export function useScrollLock(isActive: ActiveSource): void {
    const active =
        typeof isActive === "function" ? isActive : () => isActive.value;
    let held = false;

    function apply(on: boolean): void {
        if (on && !held) {
            lock();
            held = true;
        } else if (!on && held) {
            unlock();
            held = false;
        }
    }

    watch(active, (value) => apply(!!value), { flush: "post" });
    onMounted(() => {
        if (active()) apply(true);
    });
    onBeforeUnmount(() => apply(false));
}
