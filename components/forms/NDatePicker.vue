<script setup lang="ts">
import {
    computed,
    nextTick,
    onBeforeUnmount,
    ref,
    useAttrs,
    useId,
    watch,
    type PropType,
} from "vue";
import NIcon from "../primitives/NIcon.vue";
import NButton from "./NButton.vue";
import { useFormField } from "../../composables/useFormField.ts";
import { useFloating } from "../../composables/useFloating.ts";
import { useDismiss } from "../../composables/useDismiss.ts";
import { focusableWithin } from "../../composables/useFocusTrap.ts";
import { useLabels, useMessages } from "../../composables/useLocale.ts";
import {
    addDays,
    addMonths,
    clampValue,
    daysInMonth,
    displayText,
    formatHint,
    formatter,
    formatValue,
    normalizeBound,
    now,
    pad,
    parseText,
    parseValue,
    toUTC,
    weekday,
    type DateParts,
    type PickerType,
} from "../../utils/dateValue.ts";

// NDatePicker — one picker for dates, date+time, time, months and years.
// v-model holds the same string a native input would: date "2026-10-06",
// datetime "2026-10-06T14:30", time "14:30", month "2026-10", year "2026";
// "" is empty. The field accepts typed text in the locale format (or the value
// format) and commits on Enter / blur. The trailing button opens a themed popup:
// a day grid whose title zooms out to months and years, plus hour/minute fields
// for datetime and time. min/max bound the value (a datetime also takes plain
// dates). Keyboard in the grid: arrows, Home/End, PageUp/PageDown (+Shift for a
// year), Enter/Space pick, Esc closes. Locale and first weekday come from the
// locale provider unless passed as props. Attributes other than class/style go
// to the text input.
type View = "days" | "months" | "years";

const props = defineProps({
    modelValue: { type: String, default: "" },
    type: {
        type: String as PropType<PickerType>,
        default: "date",
        validator: (value: string) =>
            ["date", "datetime", "time", "month", "year"].includes(value),
    },
    min: { type: String, default: "" },
    max: { type: String, default: "" },
    // Undefined → a format hint such as "DD.MM.YYYY"; pass "" for none.
    placeholder: { type: String, default: undefined },
    error: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    clearable: { type: Boolean, default: true },
    // BCP 47 locale for names and the typed format (default: dictionary).
    locale: { type: String, default: undefined },
    // First day of the week, 0 = Sunday (default: dictionary).
    weekStart: { type: Number, default: undefined },
    // Step of the minute arrows.
    minuteStep: { type: Number, default: 1 },
    // "HH:mm" used when a datetime gets its first date; "" → the current time.
    defaultTime: { type: String, default: "" },
});
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const lbl = useLabels(props, {
    locale: "datePicker.locale",
    weekStart: "datePicker.weekStart",
});
const t = useMessages();

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }));
const controlAttrs = computed(() => {
    const { class: _class, style: _style, ...rest } = attrs;
    return rest;
});

const field = useFormField();
// Typed text that could not be read: the field shows it as invalid until fixed.
const badInput = ref(false);
const invalid = computed(
    () => props.error || badInput.value || !!field?.invalid.value,
);

const hasCalendar = computed(() => props.type !== "time");
const hasTime = computed(
    () => props.type === "datetime" || props.type === "time",
);
const locale = computed(() => lbl.value.locale);
const firstDay = computed(() => ((lbl.value.weekStart % 7) + 7) % 7);
const lo = computed(() => normalizeBound(props.type, props.min, "min"));
const hi = computed(() => normalizeBound(props.type, props.max, "max"));
const current = computed(() => parseValue(props.type, props.modelValue));

const openLabel = computed(() =>
    props.type === "time"
        ? t.value["datePicker.openTime"]
        : t.value["datePicker.openDate"],
);
const placeholderText = computed(() =>
    props.placeholder ??
    formatHint(props.type, locale.value, t.value["datePicker.tokens"]),
);

// ---- text field -----------------------------------------------------------
const draft = ref("");
const editing = ref(false);
const display = (value: string): string =>
    displayText(props.type, value, locale.value);

watch(
    () => [props.modelValue, props.type, locale.value],
    () => {
        if (editing.value) return;
        draft.value = display(props.modelValue);
        badInput.value = false;
    },
    { immediate: true },
);

function setValue(value: string): void {
    const next = value ? clampValue(value, lo.value, hi.value) : "";
    if (next !== props.modelValue) emit("update:modelValue", next);
    draft.value = display(next);
    badInput.value = false;
}

function commitDraft(): void {
    if (!editing.value) return;
    editing.value = false;
    const text = draft.value.trim();
    if (!text) return setValue("");
    const parts = parseText(props.type, text, locale.value);
    if (!parts) {
        badInput.value = true;
        return;
    }
    setValue(formatValue(props.type, parts));
}

function onInput(e: Event): void {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    draft.value = target.value;
    editing.value = true;
    badInput.value = false;
    // Keep an open calendar on the date being typed.
    const parts = open.value ? parseText(props.type, target.value, locale.value) : null;
    if (parts) {
        cursor.value = parts;
        if (hasTime.value) time.value = { h: parts.h, i: parts.i };
    }
}

function onInputKeydown(e: KeyboardEvent): void {
    if (e.key === "ArrowDown") {
        e.preventDefault();
        openPopup(true);
    } else if (e.key === "Enter") {
        // With the popup open Enter only applies the text; closed, it is left to
        // the page (installEnterSubmit), as with a native field.
        if (open.value) e.preventDefault();
        commitDraft();
        closePopup();
    }
}

// ---- popup ----------------------------------------------------------------
const open = ref(false);
const root = ref<HTMLElement | null>(null);
const inputEl = ref<HTMLInputElement | null>(null);
const popup = ref<HTMLElement | null>(null);
const minutesEl = ref<HTMLInputElement | null>(null);
const floating = useFloating(root, popup, open, {
    matchWidth: false,
    contentWidth: true,
    maxHeight: 520,
});
const sid = useId();
const popupId = sid + "-popup";
const titleId = sid + "-title";

const view = ref<View>("days");
const cursor = ref<DateParts>(now());
const today = ref<DateParts>(now());
const time = ref({ h: 0, i: 0 });

// Length of the value prefix compared in each view: day, month, year.
const unitLength = { days: 10, months: 7, years: 4 } as const;
function outOfRange(key: string): boolean {
    const n = key.length;
    return (
        (!!lo.value && key < lo.value.slice(0, n)) ||
        (!!hi.value && key > hi.value.slice(0, n))
    );
}

function defaultClock(): { h: number; i: number } {
    const own = parseValue("time", props.defaultTime);
    if (own) return { h: own.h, i: own.i };
    const step = Math.max(1, props.minuteStep);
    const n = now();
    return { h: n.h, i: Math.floor(n.i / step) * step };
}

// Calendar start: the value, otherwise today pulled into [min, max].
function startCursor(): DateParts {
    if (current.value) return { ...current.value };
    const today = now();
    const n = props.type === "year" ? 4 : props.type === "month" ? 7 : 10;
    const key = formatValue("date", today).slice(0, n);
    const edge =
        lo.value && key < lo.value.slice(0, n)
            ? lo.value
            : hi.value && key > hi.value.slice(0, n)
              ? hi.value
              : "";
    return (edge && parseValue(props.type, edge)) || today;
}

function openPopup(focusInside = false): void {
    if (props.disabled) return;
    if (!open.value) {
        today.value = now();
        cursor.value = startCursor();
        time.value =
            current.value && hasTime.value
                ? { h: current.value.h, i: current.value.i }
                : defaultClock();
        view.value =
            props.type === "year"
                ? "years"
                : props.type === "month"
                  ? "months"
                  : "days";
        open.value = true;
    }
    if (focusInside) focusActive();
}

function closePopup(returnFocus = false): void {
    if (!open.value) return;
    open.value = false;
    if (returnFocus) inputEl.value?.focus();
}

function togglePopup(): void {
    if (open.value) closePopup(true);
    else openPopup(true);
}

// Focus the roving item of the current view (or the first control).
function focusActive(): void {
    nextTick(() => {
        const el =
            popup.value?.querySelector<HTMLElement>('[data-active="true"]') ??
            (popup.value ? focusableWithin(popup.value)[0] : null);
        el?.focus({ preventScroll: true });
    });
}

function isInside(node: EventTarget | null): boolean {
    return (
        node instanceof Node &&
        (!!root.value?.contains(node) || !!popup.value?.contains(node))
    );
}
// The event path is fixed at dispatch: a clicked title or tile that a view
// switch has already removed from the DOM still counts as inside.
function onDocClick(e: MouseEvent): void {
    const path = e.composedPath();
    if (root.value && path.includes(root.value)) return;
    if (popup.value && path.includes(popup.value)) return;
    closePopup();
}
// Focus moving elsewhere (Tab out of the field or the popup) closes the popup.
function onFocusOut(e: FocusEvent): void {
    if (open.value && e.relatedTarget && !isInside(e.relatedTarget)) closePopup();
}
// Tab cycles inside the popup.
function onPopupKeydown(e: KeyboardEvent): void {
    if (e.key !== "Tab" || !popup.value) return;
    const items = focusableWithin(popup.value);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
    }
}

watch(open, (isOpen) => {
    if (isOpen) document.addEventListener("click", onDocClick);
    else document.removeEventListener("click", onDocClick);
});
watch(
    () => props.disabled,
    (disabled) => disabled && closePopup(),
);
// A value clamped by min/max moves the time fields with it.
watch(current, (p) => {
    if (p && hasTime.value) time.value = { h: p.h, i: p.i };
});
useDismiss(open, () => closePopup(true));
onBeforeUnmount(() => document.removeEventListener("click", onDocClick));

// ---- calendar views -------------------------------------------------------
const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const monthName = (m: number): string =>
    capitalize(formatter(locale.value, { month: "long" }).format(toUTC({ y: 2001, m, d: 1, h: 0, i: 0 })));
const dateKey = (p: DateParts): string => formatValue("date", p);

const weekdays = computed(() => {
    const short = formatter(locale.value, { weekday: "short" });
    const long = formatter(locale.value, { weekday: "long" });
    return Array.from({ length: 7 }, (_, k) => {
        // 2023-01-01 was a Sunday.
        const date = new Date(Date.UTC(2023, 0, 1 + ((firstDay.value + k) % 7)));
        return { short: short.format(date), long: long.format(date) };
    });
});

const weeks = computed(() => {
    const first = { ...cursor.value, d: 1 };
    const offset = (weekday(first) - firstDay.value + 7) % 7;
    const start = addDays(first, -offset);
    return Array.from({ length: 6 }, (_, w) =>
        Array.from({ length: 7 }, (_, k) => addDays(start, w * 7 + k)),
    );
});

const yearStart = computed(() => cursor.value.y - (cursor.value.y % 12));
const years = computed(() =>
    Array.from({ length: 12 }, (_, k) => yearStart.value + k),
);

const title = computed(() => {
    if (view.value === "years")
        return yearStart.value + "–" + (yearStart.value + 11);
    if (view.value === "months") return String(cursor.value.y);
    return monthName(cursor.value.m) + " " + cursor.value.y;
});

const navLabels = computed(() => {
    const m = t.value;
    if (view.value === "days")
        return [m["datePicker.prevMonth"], m["datePicker.nextMonth"]];
    if (view.value === "months")
        return [m["datePicker.prevYear"], m["datePicker.nextYear"]];
    return [m["datePicker.prevYears"], m["datePicker.nextYears"]];
});

const sameDay = (a: DateParts | null, b: DateParts): boolean =>
    !!a && a.y === b.y && a.m === b.m && a.d === b.d;
const dayLabel = (p: DateParts): string =>
    formatter(locale.value, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(toUTC(p));
const dayDisabled = (p: DateParts): boolean => outOfRange(dateKey(p));
const monthKey = (m: number): string => pad(cursor.value.y, 4) + "-" + pad(m);
const monthDisabled = (m: number): boolean => outOfRange(monthKey(m));
const yearDisabled = (y: number): boolean => outOfRange(pad(y, 4));
const showsDay = computed(
    () => props.type === "date" || props.type === "datetime",
);

function shift(dir: number): void {
    const c = cursor.value;
    cursor.value =
        view.value === "days"
            ? addMonths(c, dir)
            : addMonths(c, dir * (view.value === "months" ? 12 : 144));
}

function zoomOut(): void {
    view.value = view.value === "days" ? "months" : "years";
    focusActive();
}

function onGridKeydown(e: KeyboardEvent): void {
    const v = view.value;
    const c = cursor.value;
    const cols = v === "days" ? 7 : 3;
    const moves: Record<string, number> = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -cols,
        ArrowDown: cols,
    };
    const by = (n: number): DateParts =>
        v === "days" ? addDays(c, n) : addMonths(c, v === "months" ? n : n * 12);
    let next: DateParts | null = null;
    if (e.key in moves) next = by(moves[e.key]);
    else if (e.key === "PageUp" || e.key === "PageDown") {
        const dir = e.key === "PageUp" ? -1 : 1;
        const months = v === "days" ? (e.shiftKey ? 12 : 1) : v === "months" ? 12 : 144;
        next = addMonths(c, dir * months);
    } else if (e.key === "Home" || e.key === "End") {
        const col =
            v === "days"
                ? (weekday(c) - firstDay.value + 7) % 7
                : v === "months"
                  ? (c.m - 1) % 3
                  : (c.y - yearStart.value) % 3;
        next = by(e.key === "Home" ? -col : cols - 1 - col);
    }
    if (!next) return;
    e.preventDefault();
    cursor.value = next;
    focusActive();
}

function pickDay(day: DateParts): void {
    if (dayDisabled(day)) return;
    cursor.value = day;
    if (props.type === "date") {
        setValue(dateKey(day));
        closePopup(true);
        return;
    }
    setValue(formatValue("datetime", { ...day, h: time.value.h, i: time.value.i }));
    focusActive();
}

function pickMonth(m: number): void {
    if (monthDisabled(m)) return;
    const y = cursor.value.y;
    cursor.value = { ...cursor.value, m, d: Math.min(cursor.value.d, daysInMonth(y, m)) };
    if (props.type === "month") {
        setValue(formatValue("month", cursor.value));
        closePopup(true);
        return;
    }
    view.value = "days";
    focusActive();
}

function pickYear(y: number): void {
    if (yearDisabled(y)) return;
    const m = cursor.value.m;
    cursor.value = { ...cursor.value, y, d: Math.min(cursor.value.d, daysInMonth(y, m)) };
    if (props.type === "year") {
        setValue(formatValue("year", cursor.value));
        closePopup(true);
        return;
    }
    view.value = "months";
    focusActive();
}

// ---- time -----------------------------------------------------------------
function setTime(h: number, i: number): void {
    time.value = { h: (h + 24) % 24, i: (i + 60) % 60 };
    const base = props.type === "time" ? now() : current.value;
    // A datetime without a date keeps the time until a day is picked.
    if (base) setValue(formatValue(props.type, { ...base, ...time.value }));
}

function onSpinKeydown(e: KeyboardEvent, part: "h" | "i"): void {
    const step = part === "h" ? 1 : Math.max(1, props.minuteStep);
    const { h, i } = time.value;
    let next: number | null = null;
    const value = part === "h" ? h : i;
    if (e.key === "ArrowUp") next = value + step;
    else if (e.key === "ArrowDown") next = value - step;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = part === "h" ? 23 : 60 - step;
    if (next === null) return;
    e.preventDefault();
    if (part === "h") setTime(next, i);
    else setTime(h, next);
}

function onSpinChange(e: Event, part: "h" | "i"): void {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    const n = Number.parseInt(target.value, 10);
    const limit = part === "h" ? 23 : 59;
    if (!Number.isNaN(n)) {
        const value = Math.min(limit, Math.max(0, n));
        if (part === "h") setTime(value, time.value.i);
        else setTime(time.value.h, value);
    }
    target.value = pad(part === "h" ? time.value.h : time.value.i);
}

// Two typed hour digits move on to the minutes.
function onHoursInput(e: Event): void {
    const target = e.target;
    if (target instanceof HTMLInputElement && /^\d{2}$/.test(target.value)) {
        onSpinChange(e, "h");
        minutesEl.value?.focus();
        minutesEl.value?.select();
    }
}

function selectAll(e: FocusEvent): void {
    if (e.target instanceof HTMLInputElement) e.target.select();
}

// ---- footer ---------------------------------------------------------------
const todayDisabled = computed(() => outOfRange(dateKey(today.value)));
function pickNow(): void {
    setValue(formatValue(props.type, now()));
    closePopup(true);
}
function clearValue(): void {
    setValue("");
    closePopup(true);
}
const showClear = computed(
    () => props.clearable && !!props.modelValue && !props.disabled,
);
</script>

<template>
    <div
        ref="root"
        class="n-dp"
        :class="{ open, disabled, 'n-dp--clear': showClear }"
        v-bind="rootAttrs"
        @focusout="onFocusOut"
    >
        <input
            ref="inputEl"
            class="n-dp__input"
            :class="{ 'n-dp__input--error': invalid }"
            type="text"
            autocomplete="off"
            :value="draft"
            :placeholder="placeholderText"
            :disabled="disabled"
            v-bind="controlAttrs"
            :aria-invalid="invalid || undefined"
            :aria-required="field?.required.value || undefined"
            :aria-labelledby="field?.labelledby.value || undefined"
            :aria-describedby="field?.describedBy.value || undefined"
            @input="onInput"
            @change="commitDraft"
            @blur="commitDraft"
            @keydown="onInputKeydown"
            @click="openPopup()"
        />
        <button
            v-if="showClear"
            type="button"
            class="n-dp__btn n-dp__clear"
            tabindex="-1"
            :aria-label="t['datePicker.clear']"
            @click="setValue('')"
        >
            <NIcon name="x" :size="14" />
        </button>
        <button
            type="button"
            class="n-dp__btn n-dp__toggle"
            :aria-label="openLabel"
            aria-haspopup="dialog"
            :aria-expanded="open"
            :aria-controls="open ? popupId : undefined"
            :disabled="disabled"
            @click="togglePopup"
        >
            <NIcon :name="type === 'time' ? 'clock' : 'calendar'" :size="16" />
        </button>

        <Teleport :to="floating.target.value">
            <Transition name="n-dp-pop">
                <div
                    v-if="open"
                    :id="popupId"
                    ref="popup"
                    class="n-dp__pop"
                    role="dialog"
                    :aria-label="openLabel"
                    :style="floating.style.value"
                    @keydown="onPopupKeydown"
                    @focusout="onFocusOut"
                >
                    <template v-if="hasCalendar">
                        <div class="n-dp__head">
                            <button
                                type="button"
                                class="n-dp__nav"
                                :aria-label="navLabels[0]"
                                @click="shift(-1)"
                            >
                                <NIcon name="chevron-left" :size="16" />
                            </button>
                            <button
                                v-if="view !== 'years'"
                                :id="titleId"
                                type="button"
                                class="n-dp__title"
                                :title="
                                    view === 'days'
                                        ? t['datePicker.chooseMonth']
                                        : t['datePicker.chooseYear']
                                "
                                @click="zoomOut"
                            >
                                {{ title }}
                            </button>
                            <span
                                v-else
                                :id="titleId"
                                class="n-dp__title n-dp__title--static"
                                >{{ title }}</span
                            >
                            <button
                                type="button"
                                class="n-dp__nav"
                                :aria-label="navLabels[1]"
                                @click="shift(1)"
                            >
                                <NIcon name="chevron-right" :size="16" />
                            </button>
                        </div>
                        <span class="n-dp__sr" aria-live="polite">{{ title }}</span>

                        <table
                            v-if="view === 'days'"
                            class="n-dp__days"
                            role="grid"
                            :aria-labelledby="titleId"
                            @keydown="onGridKeydown"
                        >
                            <thead>
                                <tr>
                                    <th
                                        v-for="w in weekdays"
                                        :key="w.long"
                                        scope="col"
                                        :abbr="w.long"
                                    >
                                        {{ w.short }}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(week, wi) in weeks" :key="wi">
                                    <td
                                        v-for="day in week"
                                        :key="dateKey(day)"
                                        :aria-selected="
                                            showsDay && sameDay(current, day)
                                        "
                                    >
                                        <button
                                            type="button"
                                            class="n-dp__cell"
                                            :class="{
                                                outside: day.m !== cursor.m,
                                                today: sameDay(today, day),
                                                selected:
                                                    showsDay &&
                                                    sameDay(current, day),
                                            }"
                                            :tabindex="
                                                sameDay(cursor, day) ? 0 : -1
                                            "
                                            :data-active="
                                                sameDay(cursor, day)
                                                    ? 'true'
                                                    : undefined
                                            "
                                            :aria-label="dayLabel(day)"
                                            :aria-current="
                                                sameDay(today, day)
                                                    ? 'date'
                                                    : undefined
                                            "
                                            :aria-disabled="
                                                dayDisabled(day) || undefined
                                            "
                                            @click="pickDay(day)"
                                        >
                                            {{ day.d }}
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <div
                            v-else
                            class="n-dp__tiles"
                            role="group"
                            :aria-labelledby="titleId"
                            @keydown="onGridKeydown"
                        >
                            <template v-if="view === 'months'">
                                <button
                                    v-for="m in 12"
                                    :key="m"
                                    type="button"
                                    class="n-dp__tile"
                                    :class="{
                                        today:
                                            today.y === cursor.y &&
                                            today.m === m,
                                        selected:
                                            !!current &&
                                            type !== 'year' &&
                                            current.y === cursor.y &&
                                            current.m === m,
                                    }"
                                    :tabindex="cursor.m === m ? 0 : -1"
                                    :data-active="
                                        cursor.m === m ? 'true' : undefined
                                    "
                                    :aria-pressed="
                                        !!current &&
                                        type !== 'year' &&
                                        current.y === cursor.y &&
                                        current.m === m
                                    "
                                    :aria-disabled="monthDisabled(m) || undefined"
                                    @click="pickMonth(m)"
                                >
                                    {{ monthName(m) }}
                                </button>
                            </template>
                            <template v-else>
                                <button
                                    v-for="y in years"
                                    :key="y"
                                    type="button"
                                    class="n-dp__tile"
                                    :class="{
                                        today: today.y === y,
                                        selected: current?.y === y,
                                    }"
                                    :tabindex="cursor.y === y ? 0 : -1"
                                    :data-active="
                                        cursor.y === y ? 'true' : undefined
                                    "
                                    :aria-pressed="current?.y === y"
                                    :aria-disabled="yearDisabled(y) || undefined"
                                    @click="pickYear(y)"
                                >
                                    {{ y }}
                                </button>
                            </template>
                        </div>
                    </template>

                    <div
                        v-if="hasTime"
                        class="n-dp__time"
                        role="group"
                        :aria-label="t['datePicker.time']"
                    >
                        <NIcon name="clock" :size="16" class="n-dp__time-icon" />
                        <input
                            class="n-dp__spin"
                            type="text"
                            inputmode="numeric"
                            maxlength="2"
                            role="spinbutton"
                            aria-valuemin="0"
                            aria-valuemax="23"
                            :aria-valuenow="time.h"
                            :aria-label="t['datePicker.hours']"
                            :value="pad(time.h)"
                            :data-active="type === 'time' ? 'true' : undefined"
                            @focus="selectAll"
                            @input="onHoursInput"
                            @change="onSpinChange($event, 'h')"
                            @keydown="onSpinKeydown($event, 'h')"
                        />
                        <span class="n-dp__colon" aria-hidden="true">:</span>
                        <input
                            ref="minutesEl"
                            class="n-dp__spin"
                            type="text"
                            inputmode="numeric"
                            maxlength="2"
                            role="spinbutton"
                            aria-valuemin="0"
                            aria-valuemax="59"
                            :aria-valuenow="time.i"
                            :aria-label="t['datePicker.minutes']"
                            :value="pad(time.i)"
                            @focus="selectAll"
                            @change="onSpinChange($event, 'i')"
                            @keydown="onSpinKeydown($event, 'i')"
                        />
                    </div>

                    <div
                        v-if="type === 'date' || hasTime || showClear"
                        class="n-dp__foot"
                    >
                        <NButton
                            v-if="type === 'date'"
                            size="sm"
                            variant="ghost"
                            :disabled="todayDisabled"
                            @click="pickNow"
                            >{{ t["datePicker.today"] }}</NButton
                        >
                        <NButton
                            v-else-if="hasTime"
                            size="sm"
                            variant="ghost"
                            @click="pickNow"
                            >{{ t["datePicker.now"] }}</NButton
                        >
                        <span class="n-dp__spacer" />
                        <NButton
                            v-if="showClear"
                            size="sm"
                            variant="ghost"
                            @click="clearValue"
                            >{{ t["datePicker.clear"] }}</NButton
                        >
                        <NButton
                            v-if="hasTime"
                            size="sm"
                            @click="closePopup(true)"
                            >{{ t["datePicker.done"] }}</NButton
                        >
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<style scoped>
.n-dp {
    position: relative;
    display: block;
}
.n-dp__input {
    width: 100%;
    height: var(--control-h);
    padding: 0 40px 0 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
    color: var(--text);
    font-family: inherit;
    font-size: var(--fs);
    font-variant-numeric: tabular-nums;
    outline: none;
    transition: 0.14s;
}
.n-dp--clear .n-dp__input {
    padding-right: 68px;
}
.n-dp__input::placeholder {
    color: var(--text-3);
}
.n-dp__input:focus,
.n-dp.open .n-dp__input {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent);
}
.n-dp__input--error {
    border-color: var(--danger);
    border-width: 1.5px;
}
.n-dp__input:disabled {
    background: var(--surface-3);
    color: var(--text-3);
    cursor: not-allowed;
}
.n-dp__btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-3);
    cursor: pointer;
}
.n-dp__toggle {
    right: 6px;
}
.n-dp__clear {
    right: 34px;
}
.n-dp__btn:hover:not(:disabled) {
    color: var(--text);
    background: var(--surface-3);
}
.n-dp__btn:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
}
.n-dp__btn:disabled {
    cursor: not-allowed;
}

.n-dp__pop {
    position: absolute;
    z-index: 1200;
    box-sizing: border-box;
    overflow: auto;
    padding: 12px;
    background: var(--surface);
    border: 1px solid var(--border-2);
    border-radius: 12px;
    box-shadow: var(--shadow-lg);
    color: var(--text);
}
.n-dp__head {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 8px;
}
.n-dp__nav,
.n-dp__title,
.n-dp__cell,
.n-dp__tile {
    border: none;
    background: transparent;
    color: inherit;
    font-family: inherit;
    cursor: pointer;
}
.n-dp__nav {
    flex: none;
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    color: var(--text-2);
}
.n-dp__title {
    flex: 1;
    height: 32px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 700;
    text-align: center;
}
.n-dp__title--static {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: default;
}
.n-dp__nav:hover,
button.n-dp__title:hover {
    background: var(--surface-3);
}
.n-dp__days {
    border-collapse: collapse;
    border-spacing: 0;
}
.n-dp__days th {
    width: 36px;
    height: 28px;
    padding: 0;
    color: var(--text-3);
    font-size: 11.5px;
    font-weight: 700;
}
.n-dp__days td {
    padding: 1px;
}
.n-dp__cell {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    font-size: 13.5px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}
.n-dp__cell.outside {
    color: var(--text-3);
    font-weight: 500;
}
.n-dp__tiles {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    width: 252px;
    min-height: 244px;
    align-content: start;
}
.n-dp__tile {
    height: 52px;
    border-radius: 8px;
    font-size: 13.5px;
    font-weight: 600;
}
.n-dp__cell:hover,
.n-dp__tile:hover {
    background: var(--surface-3);
}
.n-dp__cell.today,
.n-dp__tile.today {
    box-shadow: inset 0 0 0 1px var(--accent);
}
.n-dp__cell.selected,
.n-dp__tile.selected {
    background: var(--accent);
    color: var(--accent-on);
}
.n-dp__cell[aria-disabled="true"],
.n-dp__tile[aria-disabled="true"] {
    background: transparent;
    color: var(--text-3);
    opacity: 0.45;
    cursor: not-allowed;
}
.n-dp__nav:focus-visible,
.n-dp__title:focus-visible,
.n-dp__cell:focus-visible,
.n-dp__tile:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
}
.n-dp__time {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--border);
}
.n-dp__time:first-child {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
}
.n-dp__time-icon {
    color: var(--text-3);
    margin-right: 4px;
}
.n-dp__spin {
    width: 44px;
    height: 34px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text);
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    text-align: center;
    outline: none;
}
.n-dp__spin:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent);
}
.n-dp__colon {
    font-weight: 700;
    color: var(--text-2);
}
.n-dp__foot {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--border);
}
.n-dp__spacer {
    flex: 1;
}
.n-dp__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
}
.n-dp-pop-enter-active,
.n-dp-pop-leave-active {
    transition:
        opacity 0.14s ease,
        transform 0.14s ease;
}
.n-dp-pop-enter-from,
.n-dp-pop-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}
@media (prefers-reduced-motion: reduce) {
    .n-dp__input,
    .n-dp-pop-enter-active,
    .n-dp-pop-leave-active {
        transition: none;
    }
}
</style>
