// useTheme — light/dark theme + layout density, persisted to localStorage and
// reflected on <html> via data-attributes.
//
// Blade contract (anti-flash): before CSS loads, the host app must read these same
// localStorage keys and set the matching data-attributes on <html>, so the page
// never flashes the wrong theme on first paint:
//   data-theme   <- THEME_STORAGE_KEY    ("nergous-ui-vue-theme")
//   data-density <- DENSITY_STORAGE_KEY  ("nergous-ui-vue-density")
import { ref, watch } from "vue";

// localStorage keys — exported so the host app's anti-flash script can reuse them.
export const THEME_STORAGE_KEY = "nergous-ui-vue-theme";
export const DENSITY_STORAGE_KEY = "nergous-ui-vue-density";

export type Theme = "light" | "dark";
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
    stored(THEME_STORAGE_KEY, "light", themes, "nergous-ui-theme"),
);

const density = ref<Density>(
    stored(DENSITY_STORAGE_KEY, "comfortable", densities, "nergous-ui-density"),
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
    } catch (e) {}
    apply();
});

watch(density, (v) => {
    if (!densities.includes(v)) {
        density.value = "comfortable";
        return;
    }

    try {
        localStorage.setItem(DENSITY_STORAGE_KEY, v);
    } catch (e) { }

    apply();
});

// Public API: reactive theme/density refs plus setters and a light/dark toggle.
export function useTheme() {
    return {
        theme,
        density,
        toggle: () => {
            theme.value = theme.value === "dark" ? "light" : "dark";
        },
        setTheme: (v: Theme) => {
            theme.value = themes.includes(v) ? v : "light";
        },
        setDensity: (v: Density) => {
            density.value = densities.includes(v) ? v : "comfortable";
        },
    };
}
