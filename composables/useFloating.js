import { ref, watch, nextTick, onBeforeUnmount } from "vue";

// Keep existing popups out of scroll-clipping bodies, but inside their overlay
// owner so inertness, focus trapping and layer order remain consistent.
export function useFloating(
    anchor,
    popup,
    open,
    { matchWidth = true, align = "left" } = {},
) {
    const target = ref("body");
    const style = ref({});
    let resize;
    function position() {
        if (!open.value || !anchor.value || !popup.value) return;
        const rect = anchor.value.getBoundingClientRect();
        const gap = 6,
            margin = 8;
        const width = Math.min(
            matchWidth
                ? rect.width
                : Math.max(rect.width, popup.value.scrollWidth),
            window.innerWidth - margin * 2,
        );
        const below = window.innerHeight - rect.bottom - gap - margin;
        const above = rect.top - gap - margin;
        const flip =
            below < Math.min(popup.value.scrollHeight, 280) && above > below;
        const height = Math.max(0, flip ? above : below);
        const rightAligned =
            (typeof align === "function" ? align() : align) === "right";
        const left = Math.max(
            margin,
            Math.min(
                rightAligned ? rect.right - width : rect.left,
                window.innerWidth - width - margin,
            ),
        );
        style.value = {
            position: "fixed",
            left: `${left}px`,
            width: `${width}px`,
            minWidth: "0",
            maxWidth: `${width}px`,
            top: flip ? "auto" : `${rect.bottom + gap}px`,
            bottom: flip ? `${window.innerHeight - rect.top + gap}px` : "auto",
            maxHeight: `${Math.min(320, height)}px`,
            zIndex: target.value === document.body ? 1250 : 2,
        };
    }
    function stop() {
        window.removeEventListener("resize", position);
        document.removeEventListener("scroll", position, true);
        resize?.disconnect();
        resize = null;
    }
    watch(
        open,
        async (on) => {
            if (typeof document === "undefined") return;
            stop();
            if (!on) return;
            target.value =
                anchor.value?.closest("[data-overlay]") || document.body;
            // Body popups must clear normal navigation; overlay-local popups only
            // need to clear their own panel content.
            await nextTick();
            if (!open.value) return;
            position();
            if (target.value === document.body) style.value.zIndex = 1250;
            resize = new ResizeObserver(() => {
                position();
                if (target.value === document.body) style.value.zIndex = 1250;
            });
            if (anchor.value) resize.observe(anchor.value);
            if (popup.value) resize.observe(popup.value);
            window.addEventListener("resize", position);
            document.addEventListener("scroll", position, true);
        },
        { flush: "post" },
    );
    onBeforeUnmount(() => {
        if (typeof window !== "undefined") stop();
    });
    return { target, style };
}
