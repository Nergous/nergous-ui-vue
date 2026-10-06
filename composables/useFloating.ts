import { ref, watch, nextTick, onBeforeUnmount, type CSSProperties, type Ref } from "vue";

type FloatingAlign = "left" | "right"

interface FloatingOptions {
    matchWidth?: boolean;
    // Size to the content alone; by default a non-matching popup is still at
    // least as wide as its anchor.
    contentWidth?: boolean;
    // Height cap in px (also the flip threshold, minus 40px). @defaultValue 320
    maxHeight?: number;
    align?: FloatingAlign | (() => FloatingAlign);
}

export interface FloatingState {
    target: Ref<string | HTMLElement>;
    style: Ref<CSSProperties>;
}

// Width the popup wants for its content (border-box). Inline sizing is lifted
// for one synchronous layout so the result never depends on the width set by
// the previous pass; reading scrollWidth instead fed that width back (minus the
// border) and the ResizeObserver shrank the popup frame by frame.
function naturalWidth(el: HTMLElement): number {
    const saved = el.style.cssText;
    el.style.position = "fixed";
    el.style.width = "max-content";
    el.style.minWidth = "";
    el.style.maxWidth = "none";
    const width = Math.ceil(el.getBoundingClientRect().width);
    el.style.cssText = saved;
    return width;
}

// Keep existing popups out of scroll-clipping bodies, but inside their overlay
// owner so inertness, focus trapping and layer order remain consistent.
export function useFloating(
    anchor: Ref<HTMLElement | null>,
    popup: Ref<HTMLElement | null>,
    open: Ref<boolean>,
    {
        matchWidth = true,
        contentWidth = false,
        maxHeight = 320,
        align = "left",
    }: FloatingOptions = {},
): FloatingState {
    const target = ref<string | HTMLElement>("body");
    const style = ref<CSSProperties>({});
    let resize: ResizeObserver | null = null;

    function position() {
        if (!open.value || !anchor.value || !popup.value) return;

        const rect = anchor.value.getBoundingClientRect();
        const gap = 6;
        const margin = 8;
        const width = Math.min(
            matchWidth
                ? rect.width
                : contentWidth
                  ? naturalWidth(popup.value)
                  : Math.max(rect.width, naturalWidth(popup.value)),
            window.innerWidth - margin * 2,
        );
        const below = window.innerHeight - rect.bottom - gap - margin;
        const above = rect.top - gap - margin;
        const flip =
            below < Math.min(popup.value.scrollHeight, maxHeight - 40) &&
            above > below;
        const height = Math.max(0, flip ? above : below);
        const rightAligned = (typeof align === "function" ? align() : align) === "right";
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
            maxHeight: `${Math.min(maxHeight, height)}px`,
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
            target.value = anchor.value?.closest<HTMLElement>("[data-overlay]") ?? document.body;
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
