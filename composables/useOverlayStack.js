import { getCurrentInstance, ref } from "vue";

// One activation order shared by layering, inertness, keyboard and focus.
const owners = new WeakMap();
const stack = [];
const inerted = new Map();
let observer;

export function overlayOwner() {
    const instance = getCurrentInstance();
    if (!owners.has(instance))
        owners.set(instance, { roots: [], layer: ref(1300) });
    return owners.get(instance);
}

export function isTopOverlay(owner) {
    return stack.at(-1) === owner;
}

function restore(el) {
    if (!inerted.has(el)) return;
    el.inert = inerted.get(el);
    inerted.delete(el);
}

function sync() {
    const top = stack.at(-1);
    stack.forEach((entry, i) => {
        entry.layer.value = 1300 + i * 20;
    });
    const roots = top?.roots.map((r) => r.value).filter(Boolean) || [];
    for (const el of document.body.children) {
        if (!top || roots.some((root) => el === root || el.contains(root))) {
            restore(el);
        } else {
            if (!inerted.has(el)) inerted.set(el, el.inert);
            el.inert = true;
        }
    }
    for (const el of inerted.keys()) if (!el.isConnected || !top) restore(el);
}

export function activateOverlay(owner, roots) {
    owner.roots = roots;
    if (!stack.includes(owner)) stack.push(owner);
    if (!observer) {
        observer = new MutationObserver(sync);
        observer.observe(document.body, { childList: true, subtree: true });
    }
    sync();
}

export function deactivateOverlay(owner) {
    const i = stack.indexOf(owner);
    if (i !== -1) stack.splice(i, 1);
    sync();
    if (!stack.length) {
        observer?.disconnect();
        observer = null;
    }
}
