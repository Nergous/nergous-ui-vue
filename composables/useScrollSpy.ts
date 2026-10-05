// useScrollSpy — track which section is in view and smooth-scroll to a section
// on demand. Sections are descendants of the container marked with
// `data-spy="<value>"`.
//
// Two scroll models:
//   scroller: "self" (default) — the container itself scrolls (NAnchoredForm).
//     Section offsetTop must be relative to it (position: relative).
//   scroller: "ancestor" — the page or nearest scrolling ancestor scrolls and the
//     container is only the sections' root, so a long form keeps normal page flow.
//     At the very bottom the last section wins, so short trailing ones activate.
//
// Usage:
//   const formEl = ref(null)
//   const { active, scrollTo } = useScrollSpy(formEl, { offset: 16, scroller: "ancestor" })
import { ref, watch, onMounted, onBeforeUnmount, type Ref } from "vue";
import { scrollParent, isPageScroller, prefersReducedMotion } from "../utils/dom.ts";

/** Reactive container reference or getter, allowing an element not yet mounted. */
type ScrollContainer = Ref<HTMLElement | null> | (() => HTMLElement | null);

/** Positioning configuration resolved when scrolling or recomputing. */
interface ScrollSpyOptions {
    /** Pixel offset, defaulting to 16; a getter reads the current value per operation. */
    offset?: number | (() => number);
    /** Which element scrolls: the container ("self") or its nearest scrolling ancestor. */
    scroller?: "self" | "ancestor";
}

/** Section identifier matched against the string value of data-spy. */
type ScrollSpyValue = string | number;

/**
 * Track data-spy descendants with per-call state; call during Vue setup.
 * Mount and container changes bind a passive scroll listener, removed on unmount.
 *
 * Active starts null. The last qualifying section in DOM order wins, with a 2 px
 * tolerance; no match retains the prior selection. Offset/DOM changes alone do
 * not trigger recomputation; call recompute() after layout changes.
 * @param container - Container ref or getter; null is tolerated before/after mounting.
 * @param options - Offset (default 16 px, may be a getter) and scroll model.
 * @returns The active section ref and methods to select or recompute it.
 */
export function useScrollSpy(container: ScrollContainer, options: ScrollSpyOptions = {}) {
    const { offset = 16, scroller = "self" } = options;
    const active = ref<string | null>(null);

    const getContainer = (): HTMLElement | null =>
        typeof container === "function" ? container() : container?.value;

    // `offset` may be a number or a getter (reactive prop) — resolve per call.
    const getOffset = (): number => (typeof offset === "function" ? offset() : offset);

    function sectionEls(): HTMLElement[] {
        const c = getContainer();
        return c ? Array.from(c.querySelectorAll<HTMLElement>("[data-spy]")) : [];
    }

    // The element whose scrollTop moves.
    function scrollEl(c: HTMLElement): HTMLElement {
        return scroller === "ancestor" ? scrollParent(c) : c;
    }
    function viewportTop(el: HTMLElement): number {
        return isPageScroller(el) ? 0 : el.getBoundingClientRect().top;
    }
    // Section start in the scroller's content coordinates.
    function sectionTop(el: HTMLElement, s: HTMLElement): number {
        if (scroller === "self") return el.offsetTop;
        return s.scrollTop + el.getBoundingClientRect().top - viewportTop(s);
    }

    /**
     * Select the last section in DOM order whose start passed the offset line.
     * A missing container or no qualifying sections leaves active unchanged.
     * @returns Nothing.
     */
    function recompute() {
        const c = getContainer();
        if (!c) return;
        const s = scrollEl(c);
        const top = s.scrollTop;
        const off = getOffset();
        const sections = sectionEls();
        // Page flow starts at the first section even before it reaches the line.
        let current: string | null =
            scroller === "ancestor" ? (sections[0]?.dataset.spy ?? null) : null;
        for (const el of sections) {
            if (sectionTop(el, s) - off <= top + 2) {
                const spy = el.dataset.spy;
                if (spy !== undefined) current = spy;
            }
        }
        if (
            scroller === "ancestor" &&
            sections.length &&
            s.scrollHeight > s.clientHeight &&
            s.scrollTop + s.clientHeight >= s.scrollHeight - 2
        )
            current = sections[sections.length - 1].dataset.spy ?? current;

        if (current != null && current !== active.value) active.value = current;
    }

    /**
     * Scroll to the first section matching String(value) and set active immediately.
     * A missing container/section does nothing; zero matches data-spy="0".
     * Scrolling is smooth unless reduced motion is requested.
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

        const s = scrollEl(c);
        s.scrollTo({
            top: Math.max(0, sectionTop(el, s) - getOffset()),
            behavior: prefersReducedMotion() ? "auto" : "smooth",
        });
    }

    // Re-bind the scroll listener when the container element changes (mount,
    // v-if), keeping at most one listener attached.
    let bound: HTMLElement | Window | null = null;
    let boundFor: HTMLElement | null = null;
    function unbind() {
        bound?.removeEventListener("scroll", recompute);
        bound = boundFor = null;
    }
    function bind() {
        const c = getContainer();
        if (c === boundFor) return;
        unbind();
        if (!c) return;
        const s = scrollEl(c);
        bound = isPageScroller(s) ? window : s;
        boundFor = c;
        bound.addEventListener("scroll", recompute, { passive: true });
        recompute();
    }

    onMounted(bind);
    watch(getContainer, bind);
    onBeforeUnmount(unbind);

    return { active, scrollTo, recompute };
}
