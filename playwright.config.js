import { defineConfig } from "@playwright/test";
export default defineConfig({
    testDir: "./tests/browser",
    timeout: 20000,
    expect: { timeout: 5000 },
    fullyParallel: false,
    workers: 1,
    reporter: "list",
    outputDir: ".test-output/results",
    use: {
        baseURL: "http://127.0.0.1:4179",
        viewport: { width: 1100, height: 850 },
        reducedMotion: "reduce",
        trace: "retain-on-failure",
    },
    projects: [{ name: "chromium", use: { browserName: "chromium" } }],
    webServer: {
        command: "npm run dev",
        url: "http://127.0.0.1:4179",
        reuseExistingServer: false,
    },
});
