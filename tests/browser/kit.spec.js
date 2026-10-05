// Browser regressions for the components and fixes added in 1.1.0. Same
// isolation as regressions.spec.js: only the local fixture origin is reachable.
import { test, expect } from "@playwright/test";
import fs from "node:fs";

const axe = fs.readFileSync(
    new URL("../../node_modules/axe-core/axe.min.js", import.meta.url),
    "utf8",
);
test.beforeEach(async ({ context, page }) => {
    await context.route("**/*", (route) =>
        new URL(route.request().url()).origin === "http://127.0.0.1:4179"
            ? route.continue()
            : route.abort(),
    );
    page.on("pageerror", (error) => {
        throw error;
    });
});
async function load(page, mode) {
    await page.goto("/?mode=" + mode);
    await page.waitForFunction(() => !!window.audit);
}
async function axeViolations(page) {
    await page.addScriptTag({ content: axe });
    return page.evaluate(async () =>
        (
            await window.axe.run(document, {
                runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
            })
        ).violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
    );
}

test("locale provider translates defaults while explicit props win", async ({ page }) => {
    await load(page, "locale");
    await expect(page.getByRole("navigation", { name: "Навигация по страницам" })).toHaveCount(2);
    await expect(page.getByRole("button", { name: "Предыдущая страница" })).toHaveCount(2);
    await expect(page.getByRole("button", { name: "Explicit next" })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Следующая страница" })).toHaveCount(1);
    await expect(page.getByText("Есть несохранённые изменения")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Навигационная цепочка" })).toBeVisible();
    await page.locator("#ask").click();
    await expect(page.getByRole("button", { name: "Отмена" })).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Подтвердите действие" })).toBeVisible();
});

test("english stays the default without a provider", async ({ page }) => {
    await load(page, "kit");
    await expect(page.getByRole("navigation", { name: "Pagination" })).toHaveCount(2);
    await expect(page.getByRole("button", { name: "Previous page" })).toHaveCount(2);
    await expect(page.getByText("Unsaved changes")).toBeVisible();
});

test("standalone select takes aria-label on its combobox, class stays on wrapper", async ({ page }) => {
    await load(page, "kit");
    const combo = page.getByRole("combobox", { name: "Sort order" });
    await expect(combo).toHaveClass(/n-select__control/);
    await expect(page.locator(".n-select[aria-label]")).toHaveCount(0);
});

test("multi-select keeps option order, summarizes, clears and returns focus", async ({ page }) => {
    await load(page, "kit");
    const trigger = page.getByRole("button", { name: /^Letters:/ });
    await expect(trigger).toHaveAccessibleName("Letters: Select…");
    await trigger.click();
    const panel = page.getByRole("group", { name: "Letters" });
    await expect(panel.getByRole("textbox")).toBeFocused();
    await panel.getByRole("checkbox", { name: "Beta" }).click();
    await panel.getByRole("checkbox", { name: "Alpha" }).click();
    expect(await page.evaluate(() => window.audit.multi.value)).toEqual(["a", "b"]);
    await expect(panel.getByRole("checkbox", { name: "Disabled" })).toBeDisabled();
    await panel.getByRole("textbox").fill("bet");
    await expect(panel.getByRole("checkbox")).toHaveCount(1);
    await expect(panel.getByText("2 selected")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAccessibleName("Letters: Alpha +1");
    await trigger.click();
    await panel.getByRole("button", { name: "Clear" }).click();
    expect(await page.evaluate(() => window.audit.multi.value)).toEqual([]);
    await page.locator("h1").click();
    await expect(panel).toBeHidden();
});

test("content-width popups open at their natural width and stay put", async ({ page }) => {
    await load(page, "kit");
    await page.getByRole("button", { name: /^Letters:/ }).click();
    const panel = page.locator(".n-ms__panel");
    await expect(panel).toBeVisible();
    // Sample a few frames: the old scrollWidth feedback shrank the panel 2px
    // per ResizeObserver pass, starting from the full viewport width.
    const widths = await panel.evaluate(async (el) => {
        const out = [];
        for (let i = 0; i < 8; i++) {
            out.push(el.getBoundingClientRect().width);
            await new Promise(requestAnimationFrame);
        }
        return out;
    });
    expect(new Set(widths).size).toBe(1);
    expect(widths[0]).toBeLessThan(400);
});

test("popover closes on outside click and via slot close with focus return", async ({ page }) => {
    await load(page, "kit");
    const toggle = page.getByRole("button", { name: "Export" });
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await page.locator("h1").click();
    await expect(page.locator("#pop-inner")).toBeHidden();
    await toggle.click();
    await page.locator("#pop-inner").click();
    await expect(page.locator("#pop-inner")).toBeHidden();
    await expect(toggle).toBeFocused();
    await toggle.click();
    await page.keyboard.press("Escape");
    await expect(toggle).toBeFocused();
    expect(await page.evaluate(() => window.audit.popoverOpen)).toBe(false);
});

test("column picker and filter chips emit their changes", async ({ page }) => {
    await load(page, "kit");
    await page.getByRole("button", { name: "Columns" }).click();
    await page.getByRole("checkbox", { name: "Updated" }).click();
    expect(await page.evaluate(() => window.audit.hidden.value)).toEqual(["b"]);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Remove filter “Status”" }).click();
    await page.getByRole("button", { name: "Reset all" }).click();
    expect(await page.evaluate(() => [window.audit.removed, window.audit.resets])).toEqual([["status"], 1]);
    await expect(page.getByRole("group", { name: "Active filters" })).toBeVisible();
});

test("sortable moves a row by keyboard, keeps focus, announces and commits", async ({ page }) => {
    await load(page, "kit");
    const handle = page.getByRole("button", { name: /^Move One\./ });
    await handle.focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#sort-status")).toHaveText("One: position 2 of 3");
    await expect.poll(() => page.evaluate(() => window.audit.committed)).toEqual([2, 1, 3]);
    await expect(page.getByRole("button", { name: /^Move One\./ })).toBeFocused();
    await expect(page.locator("[data-sort-id]")).toHaveText(["Two", "One", "Three"]);
});

test("enter submits the nearest marked action and hotkeys match physical keys", async ({ page }) => {
    await load(page, "kit");
    await page.getByRole("textbox", { name: "Name" }).fill("Ann");
    await page.keyboard.press("Enter");
    expect(await page.evaluate(() => window.audit.enterSubmits)).toBe(1);
    await page.evaluate(() =>
        window.dispatchEvent(
            new KeyboardEvent("keydown", { key: "л", code: "KeyK", ctrlKey: true, bubbles: true }),
        ),
    );
    await page.getByRole("textbox", { name: "Name" }).press("/");
    await page.locator("h1").click();
    await page.keyboard.press("/");
    expect(await page.evaluate(() => [window.audit.hotkeys, window.audit.slash])).toEqual([1, 1]);
});

test("confirm dialog passes the payload, closes after run and reports cancel", async ({ page }) => {
    await load(page, "kit");
    await page.locator("#ask").click();
    const dialog = page.getByRole("dialog", { name: "Confirm action" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Confirm" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(dialog).toBeHidden();
    expect(await page.evaluate(() => window.audit.confirmed)).toBe(7);
    await page.locator("#ask").click();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
    expect(await page.evaluate(() => window.audit.cancels)).toBe(1);
});

test("table offers select-all-matching and stacks rows on phones", async ({ page }) => {
    await load(page, "table-matching");
    await page.getByRole("checkbox", { name: "Select all" }).click();
    await page.getByRole("button", { name: "Select all 20" }).click();
    await expect(page.getByText("20 selected")).toBeVisible();
    expect(await page.evaluate(() => window.audit.allMatching.value)).toBe(true);
    await page.getByRole("checkbox", { name: "Select row" }).first().click();
    expect(
        await page.evaluate(() => [window.audit.allMatching.value, window.audit.selectedRows.value]),
    ).toEqual([false, [2]]);
    await page.getByRole("button", { name: "Clear selection" }).click();
    await page.setViewportSize({ width: 390, height: 700 });
    const cell = page.locator("tbody td[data-label='Name']").first();
    expect(await cell.evaluate((el) => getComputedStyle(el, "::before").content)).toBe('"Name"');
    expect(await page.locator("thead").evaluate((el) => getComputedStyle(el).position)).toBe("absolute");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("pagination hides on a single page until a smaller size could split the list", async ({ page }) => {
    await load(page, "pager-hide");
    await expect(page.locator(".n-pg")).toBeHidden();
    await page.evaluate(() => (window.audit.total.value = 15));
    await expect(page.getByRole("navigation", { name: "Pagination" })).toBeVisible();
});

test("page scroll-spy follows the window and picks the last section at the bottom", async ({ page }) => {
    await load(page, "page-spy");
    await expect.poll(() => page.evaluate(() => window.audit.pageSpy.active.value)).toBe("a");
    await page.evaluate(() => window.audit.pageSpy.scrollTo("b"));
    await expect.poll(() => page.evaluate(() => Math.round(scrollY))).toBeGreaterThan(800);
    await expect.poll(() => page.evaluate(() => window.audit.pageSpy.active.value)).toBe("b");
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => page.evaluate(() => window.audit.pageSpy.active.value)).toBe("c");
});

test("sidebar links render by default, badges and breadcrumbs are accessible", async ({ page }) => {
    await load(page, "sidebar");
    await expect(page.getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/docs");
    expect(await axeViolations(page)).toEqual([]);
    await load(page, "kit");
    await expect(page.locator(".n-crumbs [aria-current='page']")).toHaveText("Edit post");
    await expect(page.getByRole("link", { name: "Posts" })).toHaveAttribute("href", "/posts");
    const bell = page.getByRole("button", { name: "Notifications, 3 unread" });
    await expect(bell.locator(".n-btn__badge")).toHaveText("3");
});

test("icon tooltip shows the aria-label on keyboard focus and hides on Escape", async ({ page }) => {
    await load(page, "kit");
    await page.getByRole("button", { name: "Notifications, 3 unread" }).focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(page.locator(".n-itip")).toHaveText("Notifications, 3 unread");
    await page.keyboard.press("Escape");
    await expect(page.locator(".n-itip")).toHaveCount(0);
});

test("formatters cover bytes, plural rules and display time zones", async ({ page }) => {
    await load(page, "kit");
    const out = await page.evaluate(() => {
        const en = window.audit.ds.createFormat("en");
        const ru = window.audit.ds.createFormat("ru", { timeZone: "Asia/Tokyo" });
        const bad = window.audit.ds.createFormat("en", { timeZone: "Mars/Base" });
        const forms = { one: "# файл", few: "# файла", many: "# файлов", other: "# файла" };
        return [
            en.formatBytes(0),
            en.formatBytes(1536),
            en.formatBytes(-1),
            ru.formatBytes(5 * 1024 ** 2),
            [1, 3, 5, 21].map((n) => ru.plural(n, forms)),
            en.plural(2, { one: "# file", other: "# files" }),
            ru.formatDateTime("2026-01-01T00:00:00Z"),
            bad.formatNumber(1),
        ];
    });
    expect(out.slice(0, 3)).toEqual(["0 byte", "1.5 kB", "—"]);
    expect(out[3]).toMatch(/^5\sМБ$/);
    expect(out[4]).toEqual(["1 файл", "3 файла", "5 файлов", "21 файл"]);
    expect(out[5]).toBe("2 files");
    expect(out[6]).toContain("09:00");
    expect(out[7]).toBe("1");
});

test("axe smoke for new components in open states", async ({ page }) => {
    await load(page, "kit");
    await page.getByRole("button", { name: /^Letters:/ }).click();
    await page.getByRole("checkbox", { name: "Alpha" }).click();
    expect(await axeViolations(page), "kit multi open").toEqual([]);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Export" }).click();
    await expect(page.locator(".n-pop__panel")).toHaveCSS("opacity", "1");
    expect(await axeViolations(page), "kit popover open").toEqual([]);
    await load(page, "table-matching");
    await page.getByRole("checkbox", { name: "Select all" }).click();
    expect(await axeViolations(page), "table bulk").toEqual([]);
    await load(page, "locale");
    expect(await axeViolations(page), "locale").toEqual([]);
});
