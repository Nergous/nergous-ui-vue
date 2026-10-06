// English messages: the built-in defaults of every component label.
// Apps localize by providing a partial dictionary (see composables/useLocale.ts).

/** Every localizable component string. Function entries build text from values. */
export interface Messages {
    "select.placeholder": string;
    "select.search": string;
    "select.noResults": string;
    "input.reveal": string;
    "input.hide": string;
    "dropzone.title": string;
    "dropzone.or": string;
    "dropzone.browse": string;
    "dialog.label": string;
    "dialog.close": string;
    "drawer.label": string;
    "lightbox.label": string;
    "lightbox.prev": string;
    "lightbox.next": string;
    "command.placeholder": string;
    "command.empty": string;
    "command.navigate": string;
    "command.select": string;
    "toaster.region": string;
    "toaster.dismiss": string;
    "nav.main": string;
    "nav.steps": string;
    "nav.sections": string;
    "topbar.toggle": string;
    "empty.title": string;
    "pagination.label": string;
    "pagination.prev": string;
    "pagination.next": string;
    "pagination.jump": string;
    "pagination.jumpButton": string;
    "pagination.of": string;
    "pagination.jumpError": string;
    "pagination.pageSize": string;
    "table.empty": string;
    "table.clear": string;
    "table.selection": (count: number) => string;
    "table.range": (from: number, to: number, total: number) => string;
    "table.selectAll": string;
    "table.selectRow": string;
    "table.selectAllMatching": (total: number) => string;
    "table.columns": string;
    "multiSelect.search": string;
    "multiSelect.noResults": string;
    "multiSelect.selected": (count: number) => string;
    "multiSelect.clear": string;
    "filters.label": string;
    "filters.reset": string;
    "filters.remove": (label: string, value: string) => string;
    "actionBar.idle": string;
    "actionBar.dirty": string;
    "confirm.title": string;
    "confirm.confirm": string;
    "confirm.cancel": string;
    "sort.hint": string;
    "sort.position": (label: string, position: number, total: number) => string;
    "breadcrumbs.label": string;
    "datePicker.locale": string;
    "datePicker.weekStart": number;
    "datePicker.tokens": {
        year: string;
        month: string;
        day: string;
        hour: string;
        minute: string;
    };
    "datePicker.openDate": string;
    "datePicker.openTime": string;
    "datePicker.prevMonth": string;
    "datePicker.nextMonth": string;
    "datePicker.prevYear": string;
    "datePicker.nextYear": string;
    "datePicker.prevYears": string;
    "datePicker.nextYears": string;
    "datePicker.chooseMonth": string;
    "datePicker.chooseYear": string;
    "datePicker.today": string;
    "datePicker.now": string;
    "datePicker.clear": string;
    "datePicker.done": string;
    "datePicker.time": string;
    "datePicker.hours": string;
    "datePicker.minutes": string;
    richText: Partial<Record<string, string>>;
}

/** Built-in English dictionary. */
export const enMessages: Messages = {
    "select.placeholder": "Select…",
    "select.search": "Search…",
    "select.noResults": "No results",
    "input.reveal": "Show password",
    "input.hide": "Hide password",
    "dropzone.title": "Drop files here",
    "dropzone.or": "or",
    "dropzone.browse": "browse your device",
    "dialog.label": "Dialog",
    "dialog.close": "Close",
    "drawer.label": "Panel",
    "lightbox.label": "Image viewer",
    "lightbox.prev": "Previous",
    "lightbox.next": "Next",
    "command.placeholder": "Search…",
    "command.empty": "No results",
    "command.navigate": "Navigate",
    "command.select": "Select",
    "toaster.region": "Notifications",
    "toaster.dismiss": "Dismiss",
    "nav.main": "Main navigation",
    "nav.steps": "Steps",
    "nav.sections": "Sections",
    "topbar.toggle": "Toggle navigation",
    "empty.title": "Nothing found",
    "pagination.label": "Pagination",
    "pagination.prev": "Previous page",
    "pagination.next": "Next page",
    "pagination.jump": "Page",
    "pagination.jumpButton": "Go",
    "pagination.of": "of",
    "pagination.jumpError": "Enter a valid page number",
    "pagination.pageSize": "Rows per page",
    "table.empty": "No data",
    "table.clear": "Clear selection",
    "table.selection": (count) => `${count} selected`,
    "table.range": (from, to, total) => `${from}–${to} of ${total}`,
    "table.selectAll": "Select all",
    "table.selectRow": "Select row",
    "table.selectAllMatching": (total) => `Select all ${total}`,
    "table.columns": "Columns",
    "multiSelect.search": "Search…",
    "multiSelect.noResults": "No results",
    "multiSelect.selected": (count) => `${count} selected`,
    "multiSelect.clear": "Clear",
    "filters.label": "Active filters",
    "filters.reset": "Reset all",
    "filters.remove": (label) => `Remove filter “${label}”`,
    "actionBar.idle": "No changes",
    "actionBar.dirty": "Unsaved changes",
    "confirm.title": "Confirm action",
    "confirm.confirm": "Confirm",
    "confirm.cancel": "Cancel",
    "sort.hint": "Use the up and down arrow keys to move",
    "sort.position": (label, position, total) =>
        `${label}: position ${position} of ${total}`,
    "breadcrumbs.label": "Breadcrumb",
    "datePicker.locale": "en-US",
    "datePicker.weekStart": 0,
    "datePicker.tokens": {
        year: "YYYY",
        month: "MM",
        day: "DD",
        hour: "hh",
        minute: "mm",
    },
    "datePicker.openDate": "Choose date",
    "datePicker.openTime": "Choose time",
    "datePicker.prevMonth": "Previous month",
    "datePicker.nextMonth": "Next month",
    "datePicker.prevYear": "Previous year",
    "datePicker.nextYear": "Next year",
    "datePicker.prevYears": "Previous years",
    "datePicker.nextYears": "Next years",
    "datePicker.chooseMonth": "Choose month",
    "datePicker.chooseYear": "Choose year",
    "datePicker.today": "Today",
    "datePicker.now": "Now",
    "datePicker.clear": "Clear",
    "datePicker.done": "Done",
    "datePicker.time": "Time",
    "datePicker.hours": "Hours",
    "datePicker.minutes": "Minutes",
    richText: {},
};
