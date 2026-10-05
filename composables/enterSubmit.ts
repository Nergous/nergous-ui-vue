// installEnterSubmit — Enter submits the current form, modal or drawer.
//
// Mark the primary action with data-enter-submit. Enter in a text field clicks
// the nearest marked button walking up from the field: inside an open dialog
// it is the dialog's button, on a page the page's save button. Ctrl/⌘+Enter
// does the same from a textarea or contenteditable, where plain Enter inserts a
// line break. Fields that handle Enter themselves (comboboxes, listboxes,
// [data-enter-ignore]) and forms with a native submit button are left alone.
// The search stops at a boundary: a dialog, [data-enter-scope] or options.boundary.
// Dialogs that contain a marked action move their initial focus from the close
// button to the first field, so Enter submits instead of closing.
//
//   const uninstall = installEnterSubmit({ boundary: "#app-main" })

/** Options of installEnterSubmit. */
export interface EnterSubmitOptions {
    /** Extra selector that stops the search for a submit button (e.g. the page's main area). */
    boundary?: string;
    /** Selector of submit buttons. Default "[data-enter-submit]". */
    submit?: string;
}

const DIALOG_CLOSE = ".n-modal__x, .n-drawer__x";
const TEXT_TYPES = new Set([
    "text", "email", "password", "search", "tel", "url", "number",
    "date", "datetime-local", "time", "month", "week",
]);

const isTextField = (el: Element): el is HTMLInputElement =>
    el instanceof HTMLInputElement && TEXT_TYPES.has(el.type);
const isMultiline = (el: Element): boolean =>
    el instanceof HTMLTextAreaElement || (el instanceof HTMLElement && el.isContentEditable);
const isVisible = (el: HTMLElement): boolean => el.getClientRects().length > 0;
const isDisabled = (el: HTMLElement): boolean =>
    el.matches(":disabled") || el.getAttribute("aria-disabled") === "true";
const firstVisible = (root: Element, selector: string): HTMLElement | null =>
    Array.from(root.querySelectorAll<HTMLElement>(selector)).find(isVisible) ?? null;

let uninstallCurrent: (() => void) | null = null;

/**
 * Install the document-wide Enter-to-submit behaviour. A second call replaces
 * the first installation. Does nothing outside the browser.
 * @param options - Boundary and submit selectors.
 * @returns A function that removes the listeners.
 */
export function installEnterSubmit(options: EnterSubmitOptions = {}): () => void {
    if (typeof window === "undefined") return () => {};
    uninstallCurrent?.();
    const submit = options.submit ?? "[data-enter-submit]";
    const boundary = ['[role="dialog"]', "[data-enter-scope]", options.boundary]
        .filter(Boolean)
        .join(", ");

    // Walk up to the nearest marked button. A form with its own submit button
    // wins, so the browser submits it as usual.
    function findSubmit(from: Element): HTMLElement | "native" | null {
        for (let el = from.parentElement; el; el = el.parentElement) {
            if (
                el instanceof HTMLFormElement &&
                el.querySelector('button[type="submit"], input[type="submit"]')
            )
                return "native";
            const button = firstVisible(el, submit);
            if (button) return button;
            if (el.matches(boundary)) return null;
        }
        return null;
    }

    function onKeydown(e: KeyboardEvent) {
        if (e.key !== "Enter" || e.defaultPrevented || e.isComposing || e.repeat) return;
        if (e.altKey || e.shiftKey) return;
        const target = e.target;
        if (!(target instanceof Element)) return;
        const withModifier = e.ctrlKey || e.metaKey;
        if (!isTextField(target) && !(withModifier && isMultiline(target))) return;
        if (
            target.matches('[role="combobox"]') ||
            target.closest('[role="listbox"], [data-enter-ignore]')
        )
            return;
        const button = findSubmit(target);
        if (!button || button === "native") return;
        e.preventDefault();
        if (!isDisabled(button)) button.click();
    }

    function onFocusin(e: FocusEvent) {
        const target = e.target;
        if (!(target instanceof HTMLElement) || !target.matches(DIALOG_CLOSE)) return;
        const dialog = target.closest<HTMLElement>('[role="dialog"]');
        if (!dialog) return;
        if (e.relatedTarget instanceof Node && dialog.contains(e.relatedTarget)) return;
        const button = firstVisible(dialog, submit);
        if (!button) return;
        const field =
            firstVisible(dialog, "[autofocus]:not(:disabled)") ??
            Array.from(
                dialog.querySelectorAll<HTMLElement>(
                    "input:not(:disabled):not([readonly]), textarea:not(:disabled):not([readonly])",
                ),
            ).find((el) => isVisible(el) && (isTextField(el) || isMultiline(el)));
        (field ?? (isDisabled(button) ? null : button))?.focus();
    }

    window.addEventListener("keydown", onKeydown);
    document.addEventListener("focusin", onFocusin);
    const uninstall = () => {
        window.removeEventListener("keydown", onKeydown);
        document.removeEventListener("focusin", onFocusin);
        if (uninstallCurrent === uninstall) uninstallCurrent = null;
    };
    uninstallCurrent = uninstall;
    return uninstall;
}
