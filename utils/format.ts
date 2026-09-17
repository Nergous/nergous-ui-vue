// Locale-aware formatting helpers using Intl and an em dash for empty values.
// Usage:
//   import { createFormat } from "nergous-ui-vue";
//   const { formatDateTime } = createFormat("ru-RU");

/**
 * Native Date input: strings use host parsing, numbers represent epoch milliseconds.
 * Null, undefined, empty strings, numeric zero, and NaN are treated as absent.
 */
export type DateInput = string | number | Date | null | undefined;

const EMPTY = "—";

/**
 * Parse with the native Date constructor, or return an existing valid Date unchanged.
 * Falsy values (including numeric zero and NaN) and invalid dates return null.
 * No ISO-only validation is performed; use unambiguous strings for portable parsing.
 * The input Date is neither cloned nor mutated.
 * @param value - Date instance, date string, epoch milliseconds, or absent value.
 * @returns A valid Date, or null for empty/invalid input.
 */
export function toDate(value: DateInput): Date | null {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

// Thresholds (in seconds) for choosing a relative-time unit, largest first.
const REL_UNITS: readonly [
    Intl.RelativeTimeFormatUnit,
    number,
][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
];

/**
 * Create formatters with Intl instances cached separately for each call.
 * Dates use the host time zone; omitted locale uses the host default. Malformed
 * locale identifiers can throw during construction. No global locale state changes.
 * @param locale - BCP 47 locale identifier or ordered preference list.
 * @returns Date parsing, date/time, relative-time, and number formatting methods.
 */
export function createFormat(locale?: string | string[]) {
    const dtf = new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    const dshort = new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    const nf = new Intl.NumberFormat(locale);

    return {
        /**
         * Parse a date without cloning existing Date instances.
         * @param value - Native date input; numeric zero and other empty/invalid inputs yield null.
         * @returns A valid Date or null.
         */
        toDate,

        /**
         * Format a numeric day/month/year and hour/minute in the host time zone.
         * Order, punctuation, and hour cycle follow the resolved locale.
         * @param value - Date input; empty/invalid values, including numeric zero, yield an em dash.
         * @returns The localized date/time, or an em dash.
         */
        formatDateTime(value: DateInput) {
            const d = toDate(value);
            return d ? dtf.format(d) : EMPTY;
        },

        /**
         * Format a numeric day/year and short month in the host time zone.
         * @param value - Date input; empty/invalid values, including numeric zero, yield an em dash.
         * @returns The localized short date, or an em dash.
         */
        formatDateShort(value: DateInput) {
            const d = toDate(value);
            return d ? dshort.format(d) : EMPTY;
        },

        /**
         * Format time relative to Date.now() at each call, with automatic locale wording.
         * Round to seconds, choose the largest matching fixed unit (365-day year,
         * 30-day month, day, hour, minute), then round that unit's count.
         * Rounded differences below a minute use zero seconds, not a seconds count.
         * @param value - Date input; empty/invalid values, including numeric zero, yield an em dash.
         * @returns Localized relative time, or an em dash.
         */
        formatRelative(value: DateInput) {
            const d = toDate(value);
            if (!d) return EMPTY;

            const sec = Math.round((d.getTime() - Date.now()) / 1000);
            const abs = Math.abs(sec);
            for (const [unit, secs] of REL_UNITS) {
                if (abs >= secs)
                    return rtf.format(Math.round(sec / secs), unit);
            }

            return rtf.format(0, "second"); // ru: "сейчас", en: "now"
        },

        /**
         * Format finite numbers using default Intl grouping and fraction rounding.
         * Nonblank strings use Number conversion; zero is valid. Null, undefined,
         * blank strings, NaN, and infinities produce an em dash.
         * @param value - Number, numeric string, or absent value.
         * @returns The localized number, or an em dash.
         */
        formatNumber(value: string | number | null | undefined) {
            if (value == null || (typeof value === "string" && !value.trim()))
                return EMPTY;

            const n = typeof value === "number" ? value : Number(value);
            return Number.isFinite(n) ? nf.format(n) : EMPTY;
        },
    };
}
