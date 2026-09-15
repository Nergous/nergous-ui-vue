// useTheme — light/dark theme + layout density, persisted to localStorage and
// reflected on <html> via data-attributes.
//
// Blade contract (anti-flash): before CSS loads, the host app must read these same
// localStorage keys and set the matching data-attributes on <html>, so the page
// never flashes the wrong theme on first paint:
//   data-theme   <- THEME_STORAGE_KEY    ("nergous-cit-ui-vue-theme")
//   data-density <- DENSITY_STORAGE_KEY  ("nergous-cit-ui-vue-density")
import { ref, watch } from "vue";

// localStorage keys — exported so the host app's anti-flash script can reuse them.
export const THEME_STORAGE_KEY = "nergous-cit-ui-vue-theme";
export const DENSITY_STORAGE_KEY = "nergous-cit-ui-vue-density";

// Read a persisted value, falling back to a default (safe in private mode / SSR).
const themes = ["light", "dark"];
const densities = ["compact", "comfortable", "spacious"];
function stored(key, fallback, allowed, legacyKey) {
    try {
        const value =
            localStorage.getItem(key) ?? localStorage.getItem(legacyKey);
        return allowed.includes(value) ? value : fallback;
    } catch {
        return fallback;
    }
}

// Module-level singleton state shared across every useTheme() caller.
const theme = ref(
    stored(THEME_STORAGE_KEY, "light", themes, "nergouscit-theme"),
);
const density = ref(
    stored(DENSITY_STORAGE_KEY, "comfortable", densities, "nergouscit-density"),
);

// Reflect the current theme/density onto <html> so tokens.css can react to them.
function apply() {
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
    } catch (e) {}
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
        setTheme: (v) => {
            theme.value = themes.includes(v) ? v : "light";
        },
        setDensity: (v) => {
            density.value = densities.includes(v) ? v : "comfortable";
        },
    };
}
