import { getCurrentInstance, ref, type ComponentInternalInstance, type Ref } from "vue";

export type OverlayRoot = Ref<HTMLElement | null>;

export interface OverlayOwner {
    roots: OverlayRoot[];
    layer: Ref<number>;
}

// One activation order shared by layering, inertness, keyboard and focus.
const owners = new WeakMap<ComponentInternalInstance, OverlayOwner>();
const stack: OverlayOwner[] = [];
const inerted = new Map<HTMLElement, boolean>();

let observer: MutationObserver | null = null;

export function overlayOwner(): OverlayOwner {
    const instance = getCurrentInstance();
    if (!instance) {
        throw new Error("overlayOwner() must be called during component setup")
    }

    let owner = owners.get(instance)

    if (!owner) {
        owner = {
            roots: [],
            layer: ref(1300),
        };

        owners.set(instance, owner)
    }
    return owner;
}

export function isTopOverlay(owner: OverlayOwner): boolean {
    return stack.at(-1) === owner;
}

function restore(el: HTMLElement) {
    if (!inerted.has(el)) return;
    const inert = inerted.get(el);
    if (inert !== undefined) {
        el.inert = inert;
        inerted.delete(el);
    }
}

function sync() {
    const top = stack.at(-1);
    stack.forEach((entry, i) => {
        entry.layer.value = 1300 + i * 20;
    });

    const roots = top?.roots.map((r) => r.value).filter((r): r is HTMLElement => r !== null) ?? [];
    for (const el of document.body.children) {
        if (!(el instanceof HTMLElement)) continue;

        if (!top || roots.some((root) => el === root || el.contains(root))) {
            restore(el);
        } else {
            if (!inerted.has(el)) inerted.set(el, el.inert);
            el.inert = true;
        }
    }
    for (const el of inerted.keys()) if (!el.isConnected || !top) restore(el);
}

export function activateOverlay(owner: OverlayOwner, roots: OverlayRoot[]) {
    owner.roots = roots;
    if (!stack.includes(owner)) stack.push(owner);

    if (!observer) {
        observer = new MutationObserver(sync);
        observer.observe(document.body, { childList: true, subtree: true });
    }

    sync();
}

export function deactivateOverlay(owner: OverlayOwner) {
    const i = stack.indexOf(owner);
    if (i !== -1) stack.splice(i, 1);

    sync();

    if (!stack.length) {
        observer?.disconnect();
        observer = null;
    }
}
