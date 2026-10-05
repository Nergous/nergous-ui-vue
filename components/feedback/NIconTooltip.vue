<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

// NIconTooltip — one shared tooltip for every icon-only button or link: shown
// on hover after `delay` and on keyboard focus, with the element's aria-label as
// text. Mount once near the app root. Elements with visible text or their own
// title attribute are skipped; data-no-tip on an element or ancestor opts out.
// The bubble is aria-hidden: screen readers already announce the aria-label.
const props = defineProps({
    /** Hover delay in milliseconds. */
    delay: { type: Number, default: 400 },
    /** Elements that may get the tooltip. */
    selector: {
        type: String,
        default: "button[aria-label], a[aria-label], [role='button'][aria-label]",
    },
});

const EDGE = 8;
type Tip = { text: string; x: number; y: number; below: boolean };

const tip = ref<Tip | null>(null);
const bubble = ref<HTMLElement | null>(null);
let current: HTMLElement | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

// Text an element shows to everyone: aria-hidden decorations (icons, counter
// badges of icon buttons) do not count.
function visibleText(el: Element): string {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let text = "";
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.parentElement?.closest("[aria-hidden='true']")) text += node.nodeValue ?? "";
    }
    return text.trim();
}

function iconOnly(node: EventTarget | null): HTMLElement | null {
    if (!(node instanceof Element)) return null;
    const el = node.closest<HTMLElement>(props.selector);
    if (!el || el.hasAttribute("title") || el.closest("[data-no-tip]")) return null;
    return visibleText(el) === "" ? el : null;
}

function place(el: HTMLElement): void {
    const rect = el.getBoundingClientRect();
    const below = rect.top < 44;
    tip.value = {
        text: el.getAttribute("aria-label") ?? "",
        x: rect.left + rect.width / 2,
        y: below ? rect.bottom + 8 : rect.top - 8,
        below,
    };
    // Keep the bubble inside the viewport once its width is known.
    requestAnimationFrame(() => {
        const box = bubble.value?.getBoundingClientRect();
        if (!box || !tip.value) return;
        const half = box.width / 2;
        const x = Math.min(Math.max(tip.value.x, EDGE + half), window.innerWidth - EDGE - half);
        if (x !== tip.value.x) tip.value = { ...tip.value, x };
    });
}

function hide(): void {
    if (timer) clearTimeout(timer);
    timer = null;
    current = null;
    tip.value = null;
}

function onPointerOver(event: PointerEvent): void {
    if (event.pointerType === "touch") return;
    const el = iconOnly(event.target);
    if (el === current) return;
    hide();
    if (!el) return;
    current = el;
    timer = setTimeout(() => {
        if (current === el && el.isConnected) place(el);
    }, props.delay);
}
function onPointerOut(event: PointerEvent): void {
    if (!current) return;
    const next = event.relatedTarget;
    if (next instanceof Node && current.contains(next)) return;
    hide();
}
function onFocusIn(event: FocusEvent): void {
    const el = iconOnly(event.target);
    hide();
    if (el && el.matches(":focus-visible")) {
        current = el;
        place(el);
    }
}
function onKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") hide();
}

onMounted(() => {
    document.addEventListener("pointerover", onPointerOver, true);
    document.addEventListener("pointerout", onPointerOut, true);
    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("focusout", hide, true);
    document.addEventListener("pointerdown", hide, true);
    document.addEventListener("keydown", onKeydown, true);
    window.addEventListener("scroll", hide, { capture: true, passive: true });
    window.addEventListener("resize", hide);
});
onBeforeUnmount(() => {
    document.removeEventListener("pointerover", onPointerOver, true);
    document.removeEventListener("pointerout", onPointerOut, true);
    document.removeEventListener("focusin", onFocusIn, true);
    document.removeEventListener("focusout", hide, true);
    document.removeEventListener("pointerdown", hide, true);
    document.removeEventListener("keydown", onKeydown, true);
    window.removeEventListener("scroll", hide, true);
    window.removeEventListener("resize", hide);
    hide();
});
</script>

<template>
    <Teleport to="body">
        <div
            v-if="tip"
            ref="bubble"
            class="n-itip"
            :class="{ 'n-itip--below': tip.below }"
            :style="{ left: tip.x + 'px', top: tip.y + 'px' }"
            aria-hidden="true"
        >
            {{ tip.text }}
        </div>
    </Teleport>
</template>

<style scoped>
.n-itip {
    position: fixed;
    z-index: 3000;
    max-width: 260px;
    padding: 5px 9px;
    border-radius: 7px;
    background: var(--text);
    color: var(--surface);
    font-size: 12px;
    font-weight: 600;
    line-height: 1.35;
    pointer-events: none;
    transform: translate(-50%, -100%);
    box-shadow: var(--shadow-md);
}
.n-itip--below {
    transform: translate(-50%, 0);
}
</style>
