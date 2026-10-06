// NDatePicker browser regressions. Same isolation as kit.spec.js: only the
// local fixture origin is reachable. The fixture uses the English defaults
// (en-US: MM/DD/YYYY, weeks start on Sunday).
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
    await page.goto("/?mode=datepicker");
    await page.waitForFunction(() => !!window.audit);
});
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
const value = (page, key) =>
    page.evaluate((k) => window.audit.dp[k].value, key);
const set = (page, key, v) =>
    page.evaluate(([k, x]) => (window.audit.dp[k].value = x), [key, v]);

test("date: shows the locale format, picks with the keyboard and returns focus", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "Date", exact: true });
    await expect(input).toHaveValue("10/06/2026");
    await page.getByRole("button", { name: "Choose date" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Choose date" });
    await expect(dialog).toBeVisible();
    await expect(page.locator(":focus")).toHaveAccessibleName("Tuesday, October 6, 2026");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowDown");
    await expect(page.locator(":focus")).toHaveAccessibleName("Wednesday, October 14, 2026");
    await page.keyboard.press("PageDown");
    await expect(dialog.getByText("November 2026", { exact: true }).first()).toBeVisible();
    await page.keyboard.press("Enter");
    expect(await value(page, "date")).toBe("2026-11-14");
    await expect(dialog).toBeHidden();
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("11/14/2026");
    expect(await axeViolations(page)).toEqual([]);
});

test("date: typed text commits, bad text is flagged, empty text clears", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "Date", exact: true });
    await input.fill("12/25/26");
    await input.press("Enter");
    expect(await value(page, "date")).toBe("2026-12-25");
    await expect(input).toHaveValue("12/25/2026");
    await input.fill("2027-01-02");
    await input.press("Tab");
    expect(await value(page, "date")).toBe("2027-01-02");
    await input.fill("31/31/2026");
    await input.press("Tab");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    expect(await value(page, "date")).toBe("2027-01-02");
    await input.fill("");
    await input.press("Tab");
    expect(await value(page, "date")).toBe("");
    await expect(input).not.toHaveAttribute("aria-invalid");
});

test("date: min/max disable days and clamp typed values", async ({ page }) => {
    await set(page, "min", "2026-10-05");
    await set(page, "max", "2026-10-20");
    await page.getByRole("button", { name: "Choose date" }).first().click();
    const early = page.getByRole("button", { name: "Sunday, October 4, 2026" });
    await expect(early).toHaveAttribute("aria-disabled", "true");
    await early.click({ force: true });
    expect(await value(page, "date")).toBe("2026-10-06");
    await page.keyboard.press("Escape");
    const input = page.getByRole("textbox", { name: "Date", exact: true });
    await input.fill("10/30/2026");
    await input.press("Enter");
    expect(await value(page, "date")).toBe("2026-10-20");
});

test("date: title zooms out to months and years", async ({ page }) => {
    await page.getByRole("button", { name: "Choose date" }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "October 2026" }).click();
    await dialog.getByRole("button", { name: "2026" }).click();
    await expect(dialog.getByText("2016–2027").first()).toBeVisible();
    await dialog.getByRole("button", { name: "Next years" }).click();
    await dialog.getByRole("button", { name: "2030" }).click();
    await dialog.getByRole("button", { name: "March" }).click();
    await expect(dialog.getByRole("button", { name: "March 2030" })).toBeVisible();
    await dialog.getByRole("button", { name: "Friday, March 15, 2030" }).click();
    expect(await value(page, "date")).toBe("2030-03-15");
});

test("datetime: day keeps the time, spin fields edit it, Done closes", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "When" });
    await expect(input).toHaveAttribute("placeholder", "MM/DD/YYYY, hh:mm");
    await page.getByRole("button", { name: "Choose date" }).nth(1).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /October 10, 2026/ }).click();
    expect(await value(page, "datetime")).toBe("2026-10-10T10:30");
    await expect(dialog).toBeVisible();
    const hours = dialog.getByRole("spinbutton", { name: "Hours" });
    await hours.click();
    await page.keyboard.type("09");
    await expect(dialog.getByRole("spinbutton", { name: "Minutes" })).toBeFocused();
    await page.keyboard.type("5");
    await page.keyboard.press("Enter");
    expect(await value(page, "datetime")).toBe("2026-10-10T09:05");
    await page.keyboard.press("ArrowUp");
    expect(await value(page, "datetime")).toBe("2026-10-10T09:06");
    expect(await axeViolations(page)).toEqual([]);
    await dialog.getByRole("button", { name: "Done" }).click();
    await expect(dialog).toBeHidden();
    await expect(input).toHaveValue("10/10/2026, 09:06");
    await input.fill("10/11/2026 7:45");
    await input.press("Enter");
    expect(await value(page, "datetime")).toBe("2026-10-11T07:45");
});

test("Enter in the open picker applies the text without submitting", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "Date", exact: true });
    await input.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await input.fill("11/02/2026");
    const prevented = page.evaluate(
        () =>
            new Promise((resolve) =>
                window.addEventListener("keydown", (e) => resolve(e.defaultPrevented), { once: true }),
            ),
    );
    await input.press("Enter");
    expect(await prevented).toBe(true);
    expect(await value(page, "date")).toBe("2026-11-02");
    await expect(page.getByRole("dialog")).toBeHidden();
});

test("time, month and year pickers emit their native formats", async ({ page }) => {
    const time = page.getByRole("textbox", { name: "Time" });
    await time.fill("7:05");
    await time.press("Enter");
    expect(await value(page, "time")).toBe("07:05");
    await page.getByRole("button", { name: "Choose time" }).click();
    await expect(page.getByRole("spinbutton", { name: "Hours" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    expect(await value(page, "time")).toBe("06:05");
    await page.keyboard.press("Escape");

    await set(page, "month", "2026-10");
    await page.getByRole("button", { name: "Choose date" }).nth(2).click();
    await page.getByRole("dialog").getByRole("button", { name: "March" }).click();
    expect(await value(page, "month")).toBe("2026-03");
    await expect(page.getByRole("textbox", { name: "Month" })).toHaveValue("03/2026");

    await page.getByRole("button", { name: "Choose date" }).nth(3).click();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    const year = await value(page, "year");
    expect(Number(year)).toBe(new Date().getFullYear() + 1);
});

test("clear button and disabled state", async ({ page }) => {
    const root = page.locator(".dp-date");
    await root.getByRole("button", { name: "Clear" }).click();
    expect(await value(page, "date")).toBe("");
    await expect(root.getByRole("button", { name: "Clear" })).toHaveCount(0);
    await page.evaluate(() => (window.audit.dp.disabled.value = true));
    await expect(page.getByRole("textbox", { name: "Date", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Choose date" }).first()).toBeDisabled();
});
