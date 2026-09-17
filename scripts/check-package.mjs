// Archive consumer smoke. All writes stay in a unique ignored test directory.
// npm install prefers cached packages and fetches missing registry data; lifecycle
// scripts are disabled. No application env, backend, production database,
// or application API is involved.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { build, preview } from "vite";
import vue from "@vitejs/plugin-vue";
import { chromium } from "@playwright/test";

const root = process.cwd(),
    output = path.join(root, ".test-output");

fs.mkdirSync(output, { recursive: true });

const temp = fs.mkdtempSync(path.join(output, "package-"));
const npm = process.env.npm_execpath;
assert.ok(npm, "Run with npm run test:package.");

const run = (args, cwd = root) =>
    execFileSync(process.execPath, [npm, ...args], {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
    });

const packed = JSON.parse(
    run([
        "pack",
        "--json",
        "--ignore-scripts",
        "--offline",
        "--pack-destination",
        temp,
    ]),
)[0];

const names = packed.files.map((f) => f.path);
for (const required of [
    "index.js",
    "index.d.ts",
    "styles/tokens.css",
    "utils/sanitize.ts",
    "LICENSE",
])
    assert.ok(names.includes(required), required);

assert.equal(names.filter((f) => f.endsWith(".woff2")).length, 8);
const allowedRootFiles = new Set([
    "package.json", "index.js", "index.d.ts", "README.md", "CHANGELOG.md", "LICENSE",
]);

for (const name of names) {
    assert.ok(
        allowedRootFiles.has(name) ||
            /^(components\/.*\.vue|components\/primitives\/icons\.(?:js|ts)|composables\/.*\.(?:js|ts)|utils\/.*\.(?:js|ts)|styles\/.*\.css|fonts\/.*\.woff2|docs\/(?:API|MIGRATION)\.md)$/.test(name),
        "Unexpected package file: " + name,
    );
}

const host = path.join(temp, "consumer");
fs.mkdirSync(host);
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
fs.writeFileSync(
    path.join(host, "package.json"),
    JSON.stringify({
        name: "isolated-package-consumer",
        private: true,
        type: "module",
        dependencies: { vue: pkg.devDependencies.vue },
    }),
);

run(
    [
        "install",
        "--prefer-offline",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        path.join(temp, packed.filename),
    ],
    host,
);

fs.writeFileSync(
    path.join(host, "index.html"),
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Package smoke</title></head><body class="nergous-ui-vue-reset"><div id="app"></div><script type="module" src="/main.js"></script></body></html>',
);

fs.writeFileSync(
    path.join(host, "main.js"),
    'import {createApp,h} from "vue"; import * as ds from "nergous-ui-vue"; import "nergous-ui-vue/styles"; window.packageExports=Object.keys(ds); createApp({render:()=>h(ds.NButton,null,()=> "Archive works")}).mount("#app");',
);

fs.copyFileSync(
    path.join(root, "tests/types/contract.ts"),
    path.join(host, "contract.ts"),
);

fs.copyFileSync(
    path.join(root, "tests/types/tsconfig.json"),
    path.join(host, "tsconfig.json"),
);

execFileSync(
    process.execPath,
    [
        path.join(root, "node_modules/typescript/bin/tsc"),
        "--noEmit",
        "-p",
        path.join(host, "tsconfig.json"),
    ],
    { cwd: host, stdio: "pipe" },
);

const config = {
    configFile: false,
    root: host,
    envDir: false,
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
    const page = await browser.newPage();
    const origin = server.resolvedUrls.local[0].replace(/\/$/, "");
    await page.route("**/*", (r) =>
        new URL(r.request().url()).origin === origin ? r.continue() : r.abort(),
    );
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(origin);
    await page.getByRole("button", { name: "Archive works" }).waitFor();
    assert.equal(
        await page.evaluate(
            () => window.packageExports.filter((n) => n.startsWith("N")).length,
        ),
        41,
    );
    assert.equal(
        await page
            .locator(".n-btn")
            .evaluate((el) => getComputedStyle(el).display),
        "inline-flex",
    );
    assert.deepEqual(errors, []);
    console.log(
        "PASS: archive installed cache-first, 41 exports, TypeScript, production build, CSS/fonts and rendered button. " +
            packed.filename,
    );
} finally {
    await browser?.close();
    await new Promise((resolve, reject) =>
        server.httpServer.close((e) => (e ? reject(e) : resolve())),
    );
}
