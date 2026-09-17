// useTheme — light/dark theme + layout density, persisted to localStorage and
// reflected on <html> via data-attributes.
//
// To avoid a first-paint flash, before CSS loads the host app can read these same
// localStorage keys and set the matching data-attributes on <html>, so the page
// never flashes the wrong theme on first paint:
//   data-theme   <- THEME_STORAGE_KEY    ("nergous-ui-vue-theme")
//   data-density <- DENSITY_STORAGE_KEY  ("nergous-ui-vue-density")
import { ref, watch } from "vue";

/**
 * localStorage key for the theme, reusable by host startup scripts before CSS loads.
 */
export const THEME_STORAGE_KEY = "nergous-ui-vue-theme";
/** localStorage key for layout density, reusable by host startup scripts. */
export const DENSITY_STORAGE_KEY = "nergous-ui-vue-density";

/** Supported color themes; the default is light. */
export type Theme = "light" | "dark";
/** Supported layout densities; the default is comfortable. */
export type Density = "compact" | "comfortable" | "spacious";

// Read a persisted value, falling back to a default (safe in private mode / SSR).
const themes: readonly Theme[] = ["light", "dark"];
const densities: readonly Density[] = ["compact", "comfortable", "spacious"];

function stored<T extends string>(
    key: string,
    fallback: T,
    allowed: readonly T[],
    legacyKey: string,
): T {
    try {
        const value = localStorage.getItem(key) ?? localStorage.getItem(legacyKey);

        return value !== null && isAllowed(value, allowed) ? value : fallback;
    } catch {
        return fallback;
    }
}

function isAllowed<T extends string>(
    value: string,
    allowed: readonly T[],
): value is T {
    return allowed.some((item) => item === value);
}

// Module-level singleton state shared across every useTheme() caller.
const theme = ref<Theme>(
    stored(THEME_STORAGE_KEY, "light", themes, "nergouscit-theme"),
);

const density = ref<Density>(
    stored(DENSITY_STORAGE_KEY, "comfortable", densities, "nergouscit-density"),
);

// Reflect the current theme/density onto <html> so tokens.css can react to them.
function apply(): void {
    if (typeof document === "undefined") return;

    document.documentElement.dataset.theme = theme.value;
    document.documentElement.dataset.density = density.value;
}
apply();

// Persist and re-apply whenever either value changes.
watch(theme, (v) => {
    if (!themes.includes(v)) {
        theme.value = "light";
        return;
    }

    try {
        localStorage.setItem(THEME_STORAGE_KEY, v);
    } catch {}
    apply();
});

watch(density, (v) => {
    if (!densities.includes(v)) {
        density.value = "comfortable";
        return;
    }

    try {
        localStorage.setItem(DENSITY_STORAGE_KEY, v);
    } catch {}

    apply();
});

/**
 * Access theme and density refs shared by all callers of this module.
 *
 * Module evaluation reads storage once and applies data-theme/data-density to
 * the document root when available. Defaults are light/comfortable when stored
 * values are absent, invalid, or inaccessible. Legacy keys are consulted only
 * when the corresponding current key is absent.
 *
 * Vue watchers persist changes and update root attributes, swallowing storage
 * errors and resetting invalid ref assignments to the defaults. State is shared
 * across apps and SSR requests; there is no cross-tab storage synchronization.
 * @returns The shared writable refs and methods that update them.
 */
export function useTheme() {
    return {
        /** Shared theme ref; direct assignments also trigger validation/persistence. */
        theme,
        /** Shared density ref; direct assignments also trigger validation/persistence. */
        density,
        /**
         * Switch dark to light, or any other current value to dark.
         * The shared Vue watcher handles persistence and document updates.
         * @returns Nothing.
         */
        toggle: () => {
            theme.value = theme.value === "dark" ? "light" : "dark";
        },
        /**
         * Set the shared theme; unsupported runtime values fall back to light.
         * The shared Vue watcher handles persistence and document updates.
         * @param v - Desired color theme.
         * @returns Nothing.
         */
        setTheme: (v: Theme) => {
            theme.value = themes.includes(v) ? v : "light";
        },
        /**
         * Set the shared density; unsupported runtime values fall back to comfortable.
         * The shared Vue watcher handles persistence and document updates.
         * @param v - Desired layout density.
         * @returns Nothing.
         */
        setDensity: (v: Density) => {
            density.value = densities.includes(v) ? v : "comfortable";
        },
    };
}
