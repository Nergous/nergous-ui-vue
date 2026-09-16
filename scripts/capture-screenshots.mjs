import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { build, preview } from "vite";
import vue from "@vitejs/plugin-vue";
import { chromium } from "@playwright/test";

// Render repository examples only. Never load application env files or APIs.
const root = fileURLToPath(new URL("..", import.meta.url));
const output = path.join(root, ".test-output");
const screenshots = path.join(root, "docs/screenshots");
fs.mkdirSync(output, { recursive: true });
fs.mkdirSync(screenshots, { recursive: true });
const host = fs.mkdtempSync(path.join(output, "screenshots-"));
const examplePath = (name) =>
    JSON.stringify(path.relative(host, path.join(root, "examples", name)).replaceAll("\\", "/"));
fs.writeFileSync(
    path.join(host, "index.html"),
    '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>nergous-ui-vue examples</title></head><body class="nergous-ui-vue-reset"><div id="app"></div><script type="module" src="/main.js"></script></body></html>',
);
fs.writeFileSync(
    path.join(host, "main.js"),
    'import { createApp } from "vue";\n' +
    "import Showcase from " + examplePath("App.vue") + ";\n" +
    "import Admin from " + examplePath("AdminApp.vue") + ";\n" +
    'createApp(new URLSearchParams(location.search).has("admin") ? Admin : Showcase).mount("#app");\n',
);
const config = {
    configFile: false,
    envDir: false,
    root: host,
    plugins: [vue()],
    resolve: { dedupe: ["vue"] },
    logLevel: "error",
    build: { outDir: path.join(host, "build") },
};
await build(config);
const server = await preview({
    ...config,
    preview: { host: "127.0.0.1", port: 0 },
});
let browser;
try {
    browser = await chromium.launch({ headless: true });
    const origin = server.resolvedUrls.local[0].replace(/\/$/, "");
    for (const shot of [
        { name: "components-light", theme: "light", admin: false },
        { name: "components-dark", theme: "dark", admin: false },
        { name: "admin-light", theme: "light", admin: true },
    ]) {
        const context = await browser.newContext({
            viewport: { width: shot.admin ? 1440 : 1200, height: shot.admin ? 820 : 1040 },
            deviceScaleFactor: 1,
            reducedMotion: "reduce",
            locale: "ru-RU",
            timezoneId: "UTC",
            serviceWorkers: "block",
        });
        const errors = [];
        await context.route("**/*", route =>
            new URL(route.request().url()).origin === origin
                ? route.continue()
                : route.abort(),
        );
        await context.addInitScript(theme => {
            localStorage.setItem("nergous-ui-vue-theme", theme);
            localStorage.setItem("nergous-ui-vue-density", "comfortable");
        }, shot.theme);
        const page = await context.newPage();
        page.on("pageerror", error => errors.push(error.message));
        await page.goto(origin + (shot.admin ? "/?admin" : "/"));
        await page.locator(shot.admin ? ".admin" : ".demo").waitFor();
        if (shot.admin) {
            await page.getByRole("button", { name: /Участники/ }).click();
            await page.locator(".n-table").waitFor();
        }
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.locator("html").getAttribute("data-theme"), shot.theme);
        assert.deepEqual(errors, []);
        await page.screenshot({
            path: path.join(screenshots, shot.name + ".png"),
            animations: "disabled",
            fullPage: !shot.admin,
        });
        await context.close();
        console.log("Captured " + shot.name + ".png");
    }
} finally {
    await browser?.close();
    await new Promise((resolve, reject) =>
        server.httpServer.close(error => error ? reject(error) : resolve()),
    );
}
