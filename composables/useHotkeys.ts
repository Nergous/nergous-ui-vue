// useHotkeys — window keyboard shortcuts for a component's mounted lifetime.
// Letters and digits match the physical key (KeyboardEvent.code), so "mod+s"
// also works under a Cyrillic or other non-Latin layout. Combo syntax:
// "mod+" (Ctrl or ⌘), "alt+", "shift+" (letters/digits only), then the key name:
// a letter, a digit, or a KeyboardEvent.key in lower case ("escape", "/", "?").
//   useHotkeys({ "mod+s": save, "/": focusSearch, "mod+shift+p": openPalette })
import { onMounted, onBeforeUnmount } from "vue";

/** Shortcut map: combo string → handler. */
export type HotkeyMap = Record<string, (event: KeyboardEvent) => void>;

/** Options of useHotkeys. */
export interface HotkeyOptions {
    /** Also fire while typing in inputs, textareas and contenteditable. Combos with mod always fire. Default false. */
    inInputs?: boolean;
}

function keyName(e: KeyboardEvent): { name: string; physical: boolean } {
    if (/^Key[A-Z]$/.test(e.code)) return { name: e.code.slice(3).toLowerCase(), physical: true };
    if (/^Digit[0-9]$/.test(e.code)) return { name: e.code.slice(5), physical: true };
    return { name: e.key.toLowerCase(), physical: false };
}

function typing(target: EventTarget | null): boolean {
    return (
        target instanceof HTMLElement &&
        (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
    );
}

/**
 * Register window shortcuts while the calling component is mounted.
 * A matched combo calls preventDefault before the handler.
 * @param map - Combo strings and their handlers.
 * @param options - Whether plain keys fire inside text fields.
 */
export function useHotkeys(map: HotkeyMap, options: HotkeyOptions = {}): void {
    function handler(e: KeyboardEvent) {
        if (e.defaultPrevented || e.isComposing) return;
        const mod = e.metaKey || e.ctrlKey;
        if (!mod && !options.inInputs && typing(e.target)) return;
        const { name, physical } = keyName(e);
        const combo =
            (mod ? "mod+" : "") +
            (e.altKey ? "alt+" : "") +
            (e.shiftKey && physical ? "shift+" : "") +
            name;
        const run = map[combo];
        if (!run) return;
        e.preventDefault();
        run(e);
    }
    onMounted(() => window.addEventListener("keydown", handler));
    onBeforeUnmount(() => window.removeEventListener("keydown", handler));
}
