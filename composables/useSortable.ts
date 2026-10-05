// useSortable — drag-to-reorder for a vertical list with animated moves (FLIP),
// keyboard moves and a screen-reader announcement.
//
// Rows need `data-sort-id` (the item id) and must be direct children of the
// element bound to `list`, which must be positioned (the rows' offsetParent).
// A drag starts from a handle via startDrag; onHandleKeydown moves a row with
// ↑/↓, and move() does the same for up/down buttons (mark them data-sort-move
// so focus stays on the row). `commit` receives the new id order once it changed.
// Render `announcement` in a polite live region.
//
//   const { items, list, draggingId, announcement, startDrag, onHandleKeydown } =
//       useSortable(() => props.items, (ids) => save(ids), (item) => item.title)
import { nextTick, onBeforeUnmount, ref, watch, type Ref } from "vue";
import { scrollParent, isPageScroller, prefersReducedMotion } from "../utils/dom.ts";
import { useMessages } from "./useLocale.ts";

/** Item identifier; rows carry it as data-sort-id. */
export type SortableId = string | number;

interface SortableItem {
    id: SortableId;
}

/** Options of useSortable. */
export interface SortableOptions {
    /** Delay before commit after keyboard or button moves, so quick moves save once. 0 commits at once. Default 400 ms. */
    commitDelay?: number;
    /** Announcement text; defaults to the locale's "sort.position". */
    positionLabel?: (label: string, position: number, total: number) => string;
}

const DURATION = 220;
const EASING = "cubic-bezier(0.2, 0, 0, 1)";
const COMMIT_DELAY = 400;
const SCROLL_EDGE = 56;
const SCROLL_MAX_STEP = 18;

/**
 * Drag-to-reorder state for a list; call during component setup.
 * @param source - Getter of the server order; changes are adopted unless the user is mid-arrangement.
 * @param commit - Receives the ids in the new order after a changed drag or a settled series of moves.
 * @param label - Item name used in the position announcement.
 * @param options - Commit delay and announcement text.
 * @returns Local items, the list ref, drag state, announcement and handlers.
 */
export function useSortable<T extends SortableItem>(
    source: () => T[],
    commit: (ids: T["id"][]) => void,
    label: (item: T) => string,
    options: SortableOptions = {},
) {
    const messages = useMessages();
    const items = ref(source().slice()) as Ref<T[]>;
    const list = ref<HTMLElement | null>(null);
    const draggingId = ref<T["id"] | null>(null);
    const announcement = ref("");
    const commitDelay = options.commitDelay ?? COMMIT_DELAY;

    let commitTimer: ReturnType<typeof setTimeout> | undefined;
    let scrollFrame = 0;
    let scroller: HTMLElement | null = null;
    let drag: {
        id: T["id"];
        pointerId: number;
        grabOffset: number;
        clientY: number;
        heights: Map<string, number>;
        top: number;
        busy: boolean;
    } | null = null;

    const key = (id: SortableId) => String(id);
    const rows = () =>
        list.value
            ? Array.from(list.value.querySelectorAll<HTMLElement>(":scope > [data-sort-id]"))
            : [];
    const keyOf = (el: HTMLElement) => el.dataset.sortId ?? "";
    const rowById = (id: SortableId) => rows().find((el) => keyOf(el) === key(id));
    const sameOrder = (a: T[], b: T[]) =>
        a.length === b.length && a.every((item, i) => item.id === b[i].id);

    // Animate a row from its previous on-screen top to its current place.
    function flip(el: HTMLElement, fromTop: number) {
        el.style.transition = "none";
        el.style.transform = "";
        const dy = fromTop - el.getBoundingClientRect().top;
        if (prefersReducedMotion() || Math.abs(dy) < 0.5) {
            el.style.transition = "";
            return;
        }
        el.style.transform = "translateY(" + dy + "px)";
        void el.offsetHeight;
        el.style.transition = "transform " + DURATION + "ms " + EASING;
        el.style.transform = "";
    }

    async function reorder(next: T[], skipId: SortableId | null = null) {
        const before = new Map(rows().map((el) => [keyOf(el), el.getBoundingClientRect().top]));
        items.value = next;
        await nextTick();
        for (const el of rows()) {
            const from = before.get(keyOf(el));
            if ((skipId === null || keyOf(el) !== key(skipId)) && from !== undefined) flip(el, from);
        }
    }

    function announce(id: SortableId) {
        const index = items.value.findIndex((item) => item.id === id);
        if (index < 0) return;
        const text = options.positionLabel ?? messages.value["sort.position"];
        announcement.value = text(label(items.value[index]), index + 1, items.value.length);
    }

    function commitIfChanged() {
        commitTimer = undefined;
        const current = source();
        if (sameOrder(items.value, current)) return;
        // Rows were added or removed meanwhile: take the source as it is.
        const ids = new Set(current.map((item) => item.id));
        if (items.value.length !== ids.size || items.value.some((item) => !ids.has(item.id))) {
            void reorder(current.slice());
            return;
        }
        commit(items.value.map((item) => item.id));
    }

    function scheduleCommit() {
        if (commitTimer !== undefined) clearTimeout(commitTimer);
        if (commitDelay <= 0) commitIfChanged();
        else commitTimer = setTimeout(commitIfChanged, commitDelay);
    }

    // Keep the dragged row under the pointer, relative to its layout slot.
    function place() {
        if (!drag) return;
        const row = rowById(drag.id);
        if (row) row.style.transform = "translateY(" + (drag.top - row.offsetTop) + "px)";
    }

    function update() {
        if (!drag || !list.value) return;
        const heights = drag.heights;
        const total = [...heights.values()].reduce((sum, h) => sum + h, 0);
        const height = heights.get(key(drag.id)) ?? 0;
        const listTop = list.value.getBoundingClientRect().top;
        drag.top = Math.min(
            Math.max(drag.clientY - listTop - drag.grabOffset, 0),
            Math.max(total - height, 0),
        );

        // Nearest slot among the other rows, by accumulated heights.
        const draggedId = drag.id;
        const others = items.value.filter((item) => item.id !== draggedId);
        let slot = 0;
        let bestDistance = Infinity;
        let offset = 0;
        for (let k = 0; k <= others.length; k++) {
            const distance = Math.abs(drag.top - offset);
            if (distance < bestDistance) {
                bestDistance = distance;
                slot = k;
            }
            if (k < others.length) offset += heights.get(key(others[k].id)) ?? 0;
        }

        const current = items.value.findIndex((item) => item.id === draggedId);
        if (slot === current || drag.busy) {
            place();
            return;
        }
        const next = others.slice();
        next.splice(slot, 0, items.value[current]);
        drag.busy = true;
        void reorder(next, draggedId).then(() => {
            if (drag?.id !== draggedId) return;
            drag.busy = false;
            place();
        });
    }

    // Scroll while the pointer rests near the top or bottom edge, so a row can
    // travel past the visible part of a long list.
    function autoScroll() {
        scrollFrame = 0;
        if (!drag || !scroller) return;
        const page = isPageScroller(scroller);
        const top = page ? 0 : scroller.getBoundingClientRect().top;
        const bottom = page ? window.innerHeight : scroller.getBoundingClientRect().bottom;
        const y = drag.clientY;
        let step = 0;
        if (y < top + SCROLL_EDGE) step = -(top + SCROLL_EDGE - y);
        else if (y > bottom - SCROLL_EDGE) step = y - (bottom - SCROLL_EDGE);
        if (!step) return;
        step =
            Math.sign(step) *
            Math.min(SCROLL_MAX_STEP, Math.ceil((Math.abs(step) / SCROLL_EDGE) * SCROLL_MAX_STEP));
        const before = scroller.scrollTop;
        scroller.scrollTop += step;
        if (scroller.scrollTop === before) return;
        update();
        scrollFrame = requestAnimationFrame(autoScroll);
    }

    function onPointerMove(event: PointerEvent) {
        if (!drag || event.pointerId !== drag.pointerId) return;
        drag.clientY = event.clientY;
        update();
        if (!scrollFrame) scrollFrame = requestAnimationFrame(autoScroll);
    }

    // Pointer events are tracked on the window: when a row moves up, Vue
    // reinserts the dragged row's DOM node, which drops pointer capture on its
    // handle and would otherwise end the drag after one step.
    function stopListening() {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerEnd);
        window.removeEventListener("pointercancel", onPointerEnd);
    }

    async function onPointerEnd(event: PointerEvent) {
        if (!drag || event.pointerId !== drag.pointerId) return;
        const { id } = drag;
        stopListening();
        cancelAnimationFrame(scrollFrame);
        scrollFrame = 0;
        drag = null;
        draggingId.value = null;

        // Settle the row into its slot, then save if the order changed.
        const fromTop = rowById(id)?.getBoundingClientRect().top;
        await nextTick();
        const row = rowById(id);
        if (row && fromTop !== undefined) flip(row, fromTop);
        announce(id);
        commitIfChanged();
    }

    /**
     * Start dragging a row from its handle's pointerdown (primary button only).
     * @param event - The handle's pointerdown event.
     * @param id - The row's item id.
     */
    function startDrag(event: PointerEvent, id: T["id"]) {
        if (event.button !== 0 || drag || !list.value) return;
        const row = rowById(id);
        if (!row) return;
        event.preventDefault();
        if (commitTimer !== undefined) clearTimeout(commitTimer);
        commitTimer = undefined;

        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerEnd);
        window.addEventListener("pointercancel", onPointerEnd);

        row.style.transition = "none";
        row.style.transform = "";
        scroller = scrollParent(list.value);
        drag = {
            id,
            pointerId: event.pointerId,
            grabOffset: event.clientY - row.getBoundingClientRect().top,
            clientY: event.clientY,
            heights: new Map(rows().map((el) => [keyOf(el), el.offsetHeight])),
            top: row.offsetTop,
            busy: false,
        };
        draggingId.value = id;
    }

    /**
     * Move a row one step up (-1) or down (1) with animation; focus stays in the row.
     * @param id - The row's item id.
     * @param delta - -1 for up, 1 for down.
     */
    async function move(id: T["id"], delta: number) {
        if (drag) return;
        const from = items.value.findIndex((item) => item.id === id);
        const to = from + delta;
        if (from < 0 || to < 0 || to >= items.value.length) return;
        const focused = document.activeElement as HTMLElement | null;

        const next = items.value.slice();
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        await reorder(next);

        // Moving DOM nodes can drop focus; keep it on the control that made the
        // move. A button disabled at the list edge passes focus to the row's other
        // enabled move button, or to its handle.
        const row = rowById(id);
        if (row && focused && row.contains(focused)) {
            const usable = (el: Element | null): el is HTMLElement =>
                el instanceof HTMLElement && !(el instanceof HTMLButtonElement && el.disabled);
            const target = usable(focused)
                ? focused
                : (Array.from(row.querySelectorAll("[data-sort-move]")).find(usable) ??
                  row.querySelector("[data-sort-handle]"));
            if (usable(target) && document.activeElement !== target) target.focus();
        }
        announce(id);
        scheduleCommit();
    }

    /**
     * Keyboard handler for a row handle: ↑/↓ move the row.
     * @param event - The handle's keydown event.
     * @param id - The row's item id.
     */
    function onHandleKeydown(event: KeyboardEvent, id: T["id"]) {
        const delta = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
        if (!delta || drag) return;
        event.preventDefault();
        void move(id, delta);
    }

    // Source data wins, except while the user is still arranging rows.
    watch(source, (next) => {
        if (drag || commitTimer !== undefined) return;
        if (sameOrder(items.value, next)) items.value = next.slice();
        else void reorder(next.slice());
    });

    onBeforeUnmount(() => {
        if (commitTimer !== undefined) clearTimeout(commitTimer);
        cancelAnimationFrame(scrollFrame);
        stopListening();
    });

    return { items, list, draggingId, announcement, startDrag, onHandleKeydown, move };
}
