// DOM helpers shared by composables. Browser-only; callers run after mount.

/**
 * Nearest ancestor that scrolls vertically, or the document scrolling element.
 * @param el - Start element; its own overflow is not considered.
 * @returns The scrolling ancestor or document.scrollingElement/documentElement.
 */
export function scrollParent(el: Element | null): HTMLElement {
    for (let node = el?.parentElement; node; node = node.parentElement) {
        const overflow = getComputedStyle(node).overflowY;
        if (overflow === "auto" || overflow === "scroll" || overflow === "overlay")
            return node;
    }
    return (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
}

/** True when the element is the page scroller (scroll events fire on window). */
export function isPageScroller(el: Element): boolean {
    return el === document.scrollingElement || el === document.documentElement || el === document.body;
}

/** Whether the user asked the system to reduce motion. */
export function prefersReducedMotion(): boolean {
    return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}
