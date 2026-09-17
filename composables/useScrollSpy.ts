// useScrollSpy — track which section of a scroll container is in view and
// smooth-scroll to a section on demand. Sections are marked in the DOM with a
// `data-spy="<value>"` attribute on descendants of the container (their
// `offsetTop` must be relative to it, so the container needs `position:
// relative`). Backs NAnchoredForm but is reusable for any anchored long page.
//
// Usage:
//   const scrollEl = ref(null)
//   const { active, scrollTo } = useScrollSpy(scrollEl, { offset: 16 })
//   // active.value → the last qualifying section's data-spy string in DOM order
//   // scrollTo('seo') → smooth-scroll that section to the top (respects
//   //   prefers-reduced-motion)
//
// `active` starts null, then holds a raw `data-spy` string; callers using non-string
// values should compare with String(value).
import { ref, watch, onMounted, onBeforeUnmount, type Ref } from "vue";

/** Reactive container reference or getter, allowing an element not yet mounted. */
type ScrollContainer = Ref<HTMLElement | null> | (() => HTMLElement | null);

/** Positioning configuration resolved when scrolling or recomputing. */
interface ScrollSpyOptions {
    /** Pixel offset, defaulting to 16; a getter reads the current value per operation. */
    offset?: number | (() => number);
}

/** Section identifier matched against the string value of data-spy. */
type ScrollSpyValue = string | number;

/**
 * Track data-spy descendants with per-call state; call during Vue setup.
 * Mount and container changes bind a passive scroll listener, removed on unmount.
 * Section offsetTop values must use the container's coordinate system, typically
 * a positioned container with direct section children.
 *
 * Active starts null. The last qualifying section in DOM order wins, with a 2 px
 * tolerance; no match retains the prior selection. Offset/DOM changes alone do
 * not trigger recomputation. Zero/negative offsets are accepted without validation.
 * @param container - Container ref or getter; null is tolerated before/after mounting.
 * @param options - Configuration; offset defaults to 16 px and may be a getter.
 * @returns The active section ref and methods to select or recompute it.
 */
export function useScrollSpy(container: ScrollContainer, options: ScrollSpyOptions = {}) {
    const { offset = 16 } = options;
    const active = ref<string | null>(null);

    const getContainer = (): HTMLElement | null =>
        typeof container === "function" ? container() : container?.value;

    // `offset` may be a number or a getter (reactive prop) — resolve per call.
    const getOffset = (): number => (typeof offset === "function" ? offset() : offset);

    function sectionEls(): HTMLElement[] {
        const c = getContainer();
        return c ? Array.from(c.querySelectorAll<HTMLElement>("[data-spy]")) : [];
    }

    /**
     * Select the last descendant in DOM order whose start passed the offset line.
     * A missing container or no qualifying sections leaves active unchanged.
     * @returns Nothing.
     */
    function recompute() {
        const c = getContainer();
        if (!c) return;

        const top = c.scrollTop;
        const off = getOffset();
        let current = null;
        for (const el of sectionEls()) {
            if (el.offsetTop - off <= top + 2) {
                const spy = el.dataset.spy;
                if (spy !== undefined) current = spy;
            }
        }

        if (current != null && current !== active.value) active.value = current;
    }

    /**
     * Scroll to the first section matching String(value) and set active immediately.
     * A missing container/section does nothing; zero matches data-spy="0".
     * The target is clamped to zero. Scrolling is smooth unless reduced motion is
     * requested, and requires browser matchMedia and element scrollTo support.
     * @param value - Section identifier to convert to a string for matching.
     * @returns Nothing.
     */
    function scrollTo(value: ScrollSpyValue) {
        const c = getContainer();
        if (!c) return;

        const el = sectionEls().find((e) => e.dataset.spy === String(value));
        if (!el) return;

        const spy = el.dataset.spy;
        if (spy !== undefined) active.value = spy;

        const reduce = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        c.scrollTo({
            top: Math.max(0, el.offsetTop - getOffset()),
            behavior: reduce ? "auto" : "smooth",
        });
    }

    // Re-bind the scroll listener when the container element changes (mount,
    // v-if), keeping at most one listener attached.
    let bound: HTMLElement | null = null;
    function bind() {
        const c = getContainer();
        if (c === bound) return;
        if (bound) bound.removeEventListener("scroll", recompute);
        bound = c;
        if (c) {
            c.addEventListener("scroll", recompute, { passive: true });
            recompute();
        }
    }

    onMounted(bind);
    watch(getContainer, bind);
    onBeforeUnmount(() => {
        if (bound) bound.removeEventListener("scroll", recompute);
        bound = null;
    });

    return { active, scrollTo, recompute };
}
