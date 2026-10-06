// Internal helpers of NDatePicker. Values are the strings native inputs use:
// date "2026-10-06", datetime "2026-10-06T14:30", time "14:30", month "2026-10",
// year "2026". Calendar math runs in UTC so daylight-saving shifts never move a
// wall-clock value; the text shown to people follows Intl for the given locale.

/** Picker kind; also the value format. */
export type PickerType = "date" | "datetime" | "time" | "month" | "year";

/** Wall-clock parts; month is 1-based. Unused parts stay at their defaults. */
export interface DateParts {
    y: number;
    m: number;
    d: number;
    h: number;
    i: number;
}

/** Placeholder tokens for each field of the typed format. */
export interface DateTokens {
    year: string;
    month: string;
    day: string;
    hour: string;
    minute: string;
}

type Field = keyof DateTokens;

const PATTERNS: Record<PickerType, RegExp> = {
    date: /^(\d{4})-(\d{2})-(\d{2})$/,
    datetime: /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/,
    time: /^(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/,
    month: /^(\d{4})-(\d{2})$/,
    year: /^(\d{4})$/,
};

const OPTIONS: Record<PickerType, Intl.DateTimeFormatOptions> = {
    date: { day: "2-digit", month: "2-digit", year: "numeric" },
    datetime: {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    },
    time: { hour: "2-digit", minute: "2-digit", hourCycle: "h23" },
    month: { month: "2-digit", year: "numeric" },
    year: { year: "numeric" },
};

const FIELDS: readonly string[] = ["year", "month", "day", "hour", "minute"];

// Fixed sample for reading the field order of a locale format.
const SAMPLE: DateParts = { y: 2001, m: 11, d: 22, h: 13, i: 44 };

export const pad = (n: number, length = 2): string =>
    String(n).padStart(length, "0");

export function daysInMonth(y: number, m: number): number {
    return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function isValid(p: DateParts): boolean {
    return (
        Number.isInteger(p.y) &&
        p.y >= 1000 &&
        p.y <= 9999 &&
        p.m >= 1 &&
        p.m <= 12 &&
        p.d >= 1 &&
        p.d <= daysInMonth(p.y, p.m) &&
        p.h >= 0 &&
        p.h <= 23 &&
        p.i >= 0 &&
        p.i <= 59
    );
}

/** Parse a value string of the given kind; null when it does not match. */
export function parseValue(type: PickerType, value: string): DateParts | null {
    const match = PATTERNS[type].exec(value);
    if (!match) return null;
    const n = match.slice(1).map(Number);
    const p =
        type === "time"
            ? { y: 2000, m: 1, d: 1, h: n[0], i: n[1] }
            : { y: n[0], m: n[1] ?? 1, d: n[2] ?? 1, h: n[3] ?? 0, i: n[4] ?? 0 };
    return isValid(p) ? p : null;
}

/** Build the value string of the given kind. */
export function formatValue(type: PickerType, p: DateParts): string {
    const date = pad(p.y, 4) + "-" + pad(p.m) + "-" + pad(p.d);
    const time = pad(p.h) + ":" + pad(p.i);
    switch (type) {
        case "date":
            return date;
        case "datetime":
            return date + "T" + time;
        case "time":
            return time;
        case "month":
            return date.slice(0, 7);
        default:
            return pad(p.y, 4);
    }
}

/**
 * Normalize a min/max bound to the picker format. A datetime picker also takes a
 * plain date: the start of that day for min, its end for max.
 */
export function normalizeBound(
    type: PickerType,
    value: string,
    edge: "min" | "max",
): string {
    if (!value) return "";
    const own = parseValue(type, value);
    if (own) return formatValue(type, own);
    const day = type === "datetime" ? parseValue("date", value) : null;
    if (!day) return "";
    return formatValue("datetime", {
        ...day,
        h: edge === "min" ? 0 : 23,
        i: edge === "min" ? 0 : 59,
    });
}

/** Values of one kind compare as strings; out-of-range values snap to the bound. */
export function clampValue(value: string, min: string, max: string): string {
    if (min && value < min) return min;
    if (max && value > max) return max;
    return value;
}

export function toUTC(p: DateParts): Date {
    return new Date(Date.UTC(p.y, p.m - 1, p.d, p.h, p.i));
}

function fromUTC(date: Date, base: DateParts): DateParts {
    return {
        ...base,
        y: date.getUTCFullYear(),
        m: date.getUTCMonth() + 1,
        d: date.getUTCDate(),
    };
}

export function addDays(p: DateParts, days: number): DateParts {
    const next = fromUTC(new Date(Date.UTC(p.y, p.m - 1, p.d + days)), p);
    return isValid(next) ? next : p;
}

/** Shift by months, keeping the day inside the target month. */
export function addMonths(p: DateParts, months: number): DateParts {
    const total = p.y * 12 + (p.m - 1) + months;
    const y = Math.floor(total / 12);
    const m = total - y * 12 + 1;
    if (y < 1000 || y > 9999) return p;
    return { ...p, y, m, d: Math.min(p.d, daysInMonth(y, m)) };
}

/** Day of the week, 0 = Sunday. */
export function weekday(p: DateParts): number {
    return toUTC(p).getUTCDay();
}

/** The current local date and time. */
export function now(): DateParts {
    const t = new Date();
    return {
        y: t.getFullYear(),
        m: t.getMonth() + 1,
        d: t.getDate(),
        h: t.getHours(),
        i: t.getMinutes(),
    };
}

const formatters = new Map<string, Intl.DateTimeFormat>();

/** Cached Intl formatter in UTC (the parts are wall-clock values). */
export function formatter(
    locale: string,
    options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
    const key = locale + JSON.stringify(options);
    let cached = formatters.get(key);
    if (!cached) {
        try {
            cached = new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" });
        } catch {
            cached = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" });
        }
        formatters.set(key, cached);
    }
    return cached;
}

function parts(type: PickerType, locale: string): Intl.DateTimeFormatPart[] {
    return formatter(locale, OPTIONS[type]).formatToParts(toUTC(SAMPLE));
}

/** Text shown in the field; an unparsable value is shown as is. */
export function displayText(
    type: PickerType,
    value: string,
    locale: string,
): string {
    const p = value ? parseValue(type, value) : null;
    if (!p) return value;
    if (type === "year") return pad(p.y, 4);
    return formatter(locale, OPTIONS[type]).format(toUTC(p));
}

/** Format hint built from the locale format, e.g. "DD.MM.YYYY". */
export function formatHint(
    type: PickerType,
    locale: string,
    tokens: DateTokens,
): string {
    if (type === "year") return tokens.year;
    return parts(type, locale)
        .map((part) =>
            FIELDS.includes(part.type) ? tokens[part.type as Field] : part.value,
        )
        .join("");
}

/**
 * Read typed text: the value format itself, or digit groups in the order of the
 * locale format ("6.10.2026", "06/10/26 9:05"). A datetime may omit the time
 * (midnight). Two-digit years mean 20xx. Returns null when nothing valid matches.
 */
export function parseText(
    type: PickerType,
    text: string,
    locale: string,
): DateParts | null {
    const value = text.trim();
    const own = parseValue(type, value);
    if (own) return own;
    const groups = value.match(/\d+/g);
    if (!groups) return null;
    const orderOf = (kind: PickerType): Field[] =>
        kind === "year"
            ? ["year"]
            : (parts(kind, locale)
                  .map((part) => part.type)
                  .filter((t) => FIELDS.includes(t)) as Field[]);
    let order = orderOf(type);
    if (type === "datetime" && groups.length === 3) order = orderOf("date");
    if (groups.length !== order.length) return null;
    const p: DateParts = { y: 2000, m: 1, d: 1, h: 0, i: 0 };
    order.forEach((field, index) => {
        const raw = groups[index];
        const n = Number(raw);
        if (field === "year") p.y = raw.length <= 2 ? 2000 + n : n;
        else if (field === "month") p.m = n;
        else if (field === "day") p.d = n;
        else if (field === "hour") p.h = n;
        else p.i = n;
    });
    return isValid(p) ? p : null;
}

