import { test, expect } from "@playwright/test";
import fs from "node:fs";

test("search popup Tab in modal moves relative to trigger, not portal position", async ({
    page,
}) => {
    await load(page, "overlay");
    await page.locator("#open-modal").click();
    const trigger = page.getByRole("combobox", { name: "Search", exact: true });
    await trigger.click();
    await page.locator(".n-selects__search").press("Tab");
    await expect(
        page.getByRole("button", { name: "Actions", exact: true }),
    ).toBeFocused();
    await trigger.click();
    await page.locator(".n-selects__search").press("Shift+Tab");
    await expect(
        page.getByRole("combobox", { name: "Basic", exact: true }),
    ).toBeFocused();
});
test("closing lower overlay preserves eventual return to original trigger", async ({
    page,
}) => {
    await load(page, "overlay");
    await page.locator("#open").click();
    await page.locator("#inner").click();
    await page.evaluate(() => (window.audit.drawer.value = false));
    await expect(page.locator(".n-drawer")).toBeHidden();
    await page.keyboard.press("Escape");
    await expect(page.locator("#open")).toBeFocused();
});
test("editor drop inserts at pointer caret rather than old selection", async ({
    page,
}) => {
    await load(page, "rte");
    await page.evaluate(
        () => (window.audit.html.value = "<p>first</p><p>last</p>"),
    );
    await expect(page.locator(".n-rte__content p")).toHaveCount(2);
    await page.locator(".n-rte__content").evaluate((el) => {
        el.focus();
        const paragraphs = el.querySelectorAll("p"),
            selection = getSelection();
        const old = document.createRange();
        old.setStart(paragraphs[0].firstChild, 0);
        old.collapse(true);
        selection.removeAllRanges();
        selection.addRange(old);
        const end = document.createRange();
        end.selectNodeContents(paragraphs[1]);
        const box = end.getBoundingClientRect();
        const data = new DataTransfer();
        data.setData("text/html", "<b>DROP</b>");
        el.dispatchEvent(
            new DragEvent("drop", {
                dataTransfer: data,
                clientX: box.right - 1,
                clientY: box.y + box.height / 2,
                bubbles: true,
                cancelable: true,
            }),
        );
    });
    await expect(page.locator(".n-rte__content p").first()).toHaveText("first");
    await expect(page.locator(".n-rte__content p").last()).toContainText(
        "DROP",
    );
});
test("dynamic background nodes and pre-inert nodes restore correctly", async ({
    page,
}) => {
    await load(page, "overlay");
    await page.evaluate(() => {
        const node = document.createElement("div");
        node.id = "pre-inert";
        node.inert = true;
        document.body.append(node);
    });
    await page.locator("#open-modal").click();
    await page.evaluate(() => {
        const node = document.createElement("button");
        node.id = "dynamic";
        node.textContent = "Background";
        document.body.append(node);
    });
    await expect
        .poll(() => page.locator("#dynamic").evaluate((el) => el.inert))
        .toBe(true);
    await page.keyboard.press("Escape");
    expect(await page.locator("#pre-inert").evaluate((el) => el.inert)).toBe(
        true,
    );
    expect(await page.locator("#dynamic").evaluate((el) => el.inert)).toBe(
        false,
    );
});
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
        if (!error.message.includes("Audit blocked storage")) throw error;
    });
});
async function load(page, mode) {
    await page.goto("/?mode=" + mode);
    await page.waitForFunction(() => !!window.audit);
}
test("editor strips malicious initial, external, pasted and dropped HTML", async ({
    page,
}) => {
    await load(page, "xss");
    expect(await page.evaluate(() => window.auditXss)).toBeUndefined();
    await expect(page.locator(".n-rte__content img")).toHaveCount(0);
    const payloads = [
        '<img src=x onerror="window.auditXss=1"><b onclick="window.auditXss=1">safe</b>',
        '<svg><a href="javascript:alert(1)">x</a></svg><math><mtext><img src=x onerror=alert(1)></mtext></math>',
        '<iframe srcdoc="<script>alert(1)</script>"></iframe><script>alert(1)</script>',
        '<a href="java&#x09;script:alert(1)">bad</a><a href="data:text/html,test">bad</a>',
        '<a href="HTTPS://example.com">safe</a><a href="/relative">relative</a><a href="#anchor">anchor</a>',
        '<form id=app><input name=innerHTML></form><span style="color:red" onmouseover=alert(1)>safe</span>',
    ];
    for (const html of payloads) {
        await page.evaluate(
            (html) => (window.audit.html.value = html + "<p>marker</p>"),
            html,
        );
        await expect(page.locator(".n-rte__content")).toContainText("marker");
        const result = await page
            .locator(".n-rte__content")
            .evaluate((el) => ({
                tags: [...el.querySelectorAll("*")].map((n) => n.localName),
                attrs: [...el.querySelectorAll("*")].flatMap((n) =>
                    [...n.attributes].map((a) => a.name),
                ),
                urls: [...el.querySelectorAll("a[href]")].map(
                    (a) => a.protocol,
                ),
            }));
        expect(
            result.tags.some((t) =>
                [
                    "img",
                    "svg",
                    "math",
                    "iframe",
                    "script",
                    "input",
                    "form",
                ].includes(t),
            ),
        ).toBe(false);
        expect(
            result.attrs.some(
                (a) => a.startsWith("on") || a === "style" || a === "id",
            ),
        ).toBe(false);
        expect(result.urls.every((u) => ["http:", "https:"].includes(u))).toBe(
            true,
        );
    }
    for (const kind of ["paste", "drop"]) {
        await page.locator(".n-rte__content").evaluate((el, kind) => {
            el.focus();
            const data = new DataTransfer();
            data.setData(
                "text/html",
                '<img src=x onerror="window.auditXss=1"><a href="java&#x09;script:alert(1)">bad</a><b>safe</b>',
            );
            el.dispatchEvent(
                kind === "paste"
                    ? new ClipboardEvent("paste", {
                          clipboardData: data,
                          bubbles: true,
                          cancelable: true,
                      })
                    : new DragEvent("drop", {
                          dataTransfer: data,
                          bubbles: true,
                          cancelable: true,
                      }),
            );
        }, kind);
        await expect(page.locator(".n-rte__content img")).toHaveCount(0);
        expect(await page.evaluate(() => window.auditXss)).toBeUndefined();
        expect(
            await page
                .locator(".n-rte__content a")
                .evaluateAll((es) =>
                    es.some((e) => e.protocol === "javascript:"),
                ),
        ).toBe(false);
    }
});
test("editor keyboard toolbar preserves selection and opens named link dialog", async ({
    page,
}) => {
    await load(page, "rte");
    await page.locator(".n-rte__content").evaluate((el) => {
        el.focus();
        const r = document.createRange();
        r.selectNodeContents(el);
        const s = getSelection();
        s.removeAllRanges();
        s.addRange(r);
        document.dispatchEvent(new Event("selectionchange"));
    });
    const bold = page.getByRole("button", {
        name: "Bold (Ctrl+B)",
        exact: true,
    });
    await bold.focus();
    await bold.press("Enter");
    await expect(
        page.locator(".n-rte__content b, .n-rte__content strong"),
    ).toHaveText("hello");
    const link = page.getByRole("button", { name: "Link", exact: true });
    await link.focus();
    await link.press("Space");
    await expect(
        page.getByRole("dialog", { name: "Insert link" }),
    ).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Link URL" })).toBeFocused();
    await page
        .getByRole("textbox", { name: "Link URL" })
        .fill("javascript:alert(1)");
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(page.locator(".n-rte__content a")).toHaveCount(0);
});
test("theme survives unavailable and invalid storage, preserves renamed legacy preferences", async ({
    page,
}) => {
    await page.addInitScript(() => {
        Storage.prototype.getItem = () => {
            throw new DOMException("Audit blocked storage", "SecurityError");
        };
        Storage.prototype.setItem = () => {
            throw new DOMException("Audit blocked storage", "SecurityError");
        };
    });
    await load(page, "storage");
    await expect(page.getByRole("button", { name: "Mounted" })).toBeVisible();
    await page.evaluate(() => window.audit.ds.useTheme().setTheme("dark"));
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
test("theme validates storage and migrates legacy reads", async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem("nergous-ui-theme", "dark");
        localStorage.setItem("nergous-ui-density", "compact");
    });
    await load(page, "storage");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("html")).toHaveAttribute(
        "data-density",
        "compact",
    );
    await page.evaluate(() => {
        localStorage.setItem("nergous-ui-vue-theme", "invalid");
        localStorage.setItem("nergous-ui-vue-density", "invalid");
    });
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator("html")).toHaveAttribute(
        "data-density",
        "comfortable",
    );
});
test("disabled and loading polymorphic buttons cannot activate", async ({
    page,
}) => {
    await load(page, "button");
    for (const text of ["Disabled link", "Loading router"]) {
        const el = page.getByRole("link", { name: text });
        await el.evaluate((el) => el.click());
        await el.focus();
        await page.keyboard.press("Enter");
    }
    expect(
        await page.evaluate(() => ({
            actions: window.audit.actions,
            hash: location.hash,
        })),
    ).toEqual({ actions: 0, hash: "" });
    await page.getByRole("button", { name: "Enabled button" }).click();
    expect(await page.evaluate(() => window.audit.actions)).toBe(1);
});
test("search select exposes form state, virtual focus, restores focus and tabs forward", async ({
    page,
}) => {
    await load(page, "select");
    const trigger = page.locator(".n-selects__control");
    await expect(trigger).toHaveAttribute("aria-required", "true");
    await expect(trigger).toHaveAttribute("aria-invalid", "true");
    await expect(trigger).toHaveAccessibleName("City");
    await expect(trigger).toHaveAccessibleDescription("Required");
    await trigger.press("Enter");
    const input = page.locator(".n-selects__search");
    await expect(input).toBeFocused();
    await input.press("ArrowDown");
    await expect(input).toHaveAttribute("aria-activedescendant", /.+-opt-2/);
    await input.press("Enter");
    await expect(trigger).toBeFocused();
    await expect(trigger).toContainText("Beta");
    await trigger.press("Enter");
    await input.press("Escape");
    await expect(trigger).toBeFocused();
    await trigger.press("Enter");
    await input.press("Tab");
    await expect(page.locator("#after")).toBeFocused();
});
test("pagination normalizes and table checkbox keyboard never activates row", async ({
    page,
}) => {
    await load(page, "pagination");
    await expect(page.locator('[aria-current="page"]')).toHaveText("3");
    await page.getByRole("button", { name: "Previous page" }).click();
    await expect(page.locator('[aria-current="page"]')).toHaveText("2");
    const jumpInput = page.getByRole("spinbutton", { name: "Page" });
    await jumpInput.fill("1");
    await jumpInput.press("Enter");
    await expect(page.locator('[aria-current="page"]')).toHaveText("1");
    expect(await page.evaluate(() => window.audit.parentSubmits.value)).toBe(0);
    await jumpInput.fill("4");
    await expect(jumpInput).toHaveAttribute("aria-invalid", "true");
    await expect(
        page.getByRole("button", { name: "Go", exact: true }),
    ).toBeDisabled();
    const sizeSelect = page.getByRole("combobox", { name: "Rows per page" });
    await expect(sizeSelect).toContainText("10");
    await sizeSelect.press("Enter");
    await page.getByRole("option", { name: "25" }).click();
    await expect(sizeSelect).toContainText("25");
    expect(await page.evaluate(() => window.audit.pageSize.value)).toBe(25);
    expect(await page.evaluate(() => window.audit.parentSubmits.value)).toBe(0);
    await load(page, "table");
    const check = page.locator("tbody [role=checkbox]").first();
    await check.press("Space");
    await expect(check).toHaveAttribute("aria-checked", "true");
    expect(await page.evaluate(() => window.audit.rowClicks)).toBe(0);
    await page.getByRole("button", { name: "10", exact: true }).click();
    await page.evaluate(
        () => (window.audit.rows.value = window.audit.rows.value.slice(0, 3)),
    );
    await expect(page.locator('[aria-current="page"]')).toHaveText("2");
    await expect(page.locator("tbody")).toContainText("Row 3");
});
test("nested overlays order, inertness, Escape, focus and scroll restoration agree", async ({
    page,
}) => {
    await load(page, "overlay");
    await page.locator("#open").click();
    await page.locator("#inner").click();
    const modal = page.getByRole("dialog", { name: "Modal", exact: true });
    await expect(modal).toBeVisible();
    expect(await page.locator(".n-drawer").evaluate((el) => el.inert)).toBe(
        true,
    );
    expect(
        await page
            .locator(".n-modal__overlay")
            .evaluate(
                (el) =>
                    Number(getComputedStyle(el).zIndex) >
                    Number(
                        getComputedStyle(document.querySelector(".n-drawer"))
                            .zIndex,
                    ),
            ),
    ).toBe(true);
    await modal.getByRole("combobox", { name: "Basic", exact: true }).click();
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(modal).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
    await expect(page.locator("#inner")).toBeFocused();
    expect(await page.locator(".n-drawer").evaluate((el) => el.inert)).toBe(
        false,
    );
    await page.keyboard.press("Escape");
    await expect(page.locator("#open")).toBeFocused();
    expect(await page.locator("#app").evaluate((el) => el.inert)).toBe(false);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
});
for (const theme of ["light", "dark"])
    for (const density of ["compact", "comfortable", "spacious"])
        test(
            "tall modal/select containment " + theme + "/" + density,
            async ({ page }) => {
                await load(page, "tall");
                await page.evaluate(
                    ({ theme, density }) => {
                        const t = window.audit.ds.useTheme();
                        t.setTheme(theme);
                        t.setDensity(density);
                    },
                    { theme, density },
                );
                await page.setViewportSize({ width: 390, height: 640 });
                await page.locator("#open-modal").click();
                const modal = page.locator(".n-modal");
                expect(
                    await modal.evaluate((el) => {
                        const r = el.getBoundingClientRect();
                        return (
                            r.top >= 0 &&
                            r.bottom <= innerHeight &&
                            r.left >= 0 &&
                            r.right <= innerWidth
                        );
                    }),
                ).toBe(true);
                await page
                    .getByRole("combobox", { name: "Search", exact: true })
                    .click();
                const input = page.locator(".n-selects__search");
                await expect(input).toBeFocused();
                await input.fill("beta");
                const option = page.getByRole("option", {
                    name: "Beta",
                    exact: true,
                });
                await expect(option).toBeVisible();
                if (density === "comfortable")
                    await page.screenshot({
                        path: ".test-output/modal-" + theme + ".png",
                        animations: "disabled",
                    });
                expect(
                    await option.evaluate((el) => {
                        const r = el.getBoundingClientRect();
                        return el.contains(
                            document.elementFromPoint(
                                r.x + r.width / 2,
                                r.y + r.height / 2,
                            ),
                        );
                    }),
                ).toBe(true);
                await option.click();
                await expect(
                    page.getByRole("combobox", { name: "Search", exact: true }),
                ).toBeFocused();
                await page.locator("#save").click();
                await expect(modal).toBeHidden();
            },
        );
test("file drop filters types and honors single-file mode", async ({
    page,
}) => {
    await load(page, "drop");
    await page.locator(".n-dz").evaluate((el) => {
        const dt = new DataTransfer();
        for (const [name, type] of [
            ["bad.exe", "application/octet-stream"],
            ["a.txt", "text/plain"],
            ["b.png", "image/png"],
        ])
            dt.items.add(new File(["test"], name, { type }));
        el.dispatchEvent(
            new DragEvent("drop", {
                dataTransfer: dt,
                bubbles: true,
                cancelable: true,
            }),
        );
    });
    expect(await page.evaluate(() => window.audit.dropped)).toEqual(["a.txt"]);
});
test("lightbox initially open handles arrows and async palette clamps selection", async ({
    page,
}) => {
    await load(page, "lightbox");
    await page.getByRole("dialog").waitFor();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".n-lb__img")).toHaveAttribute("alt", "Two");
    await load(page, "command");
    await page.getByRole("combobox").focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.evaluate(
        () => (window.audit.commands.value = [{ label: "New" }]),
    );
    await expect(page.locator(".n-cmd__item.on")).toHaveText("New");
    await page.keyboard.press("Enter");
    expect(await page.evaluate(() => window.audit.ran)).toBe("New");
});
test("toaster fits 320px, scroll offset honored, empty format values preserved", async ({
    page,
}) => {
    await load(page, "toaster");
    await page.setViewportSize({ width: 320, height: 640 });
    await page.evaluate(() =>
        window.audit.ds.useToast().push({ title: "Test", duration: 0 }),
    );
    await expect(page.locator(".n-toast")).toBeVisible();
    expect(
        await page.locator(".n-toast").evaluate((el) => {
            const r = el.getBoundingClientRect();
            return r.left >= 0 && r.right <= innerWidth;
        }),
    ).toBe(true);
    await load(page, "spy");
    await page.evaluate(() => window.audit.spy.scrollTo("b"));
    await expect
        .poll(() =>
            page.evaluate(
                () =>
                    document.querySelector("[data-spy=b]").parentElement
                        .scrollTop,
            ),
        )
        .toBe(240);
    expect(
        await page.evaluate(() =>
            [null, "", "invalid", 0].map((v) =>
                window.audit.ds.createFormat("en").formatNumber(v),
            ),
        ),
    ).toEqual(["—", "—", "—", "0"]);
});
test("accessible names for titleless windows and axe smoke for audited surfaces", async ({
    page,
}) => {
    for (const mode of [
        "select",
        "rte",
        "rte-full",
        "drop",
        "pagination",
        "unnamed",
    ]) {
        await load(page, mode);
        if (mode === "unnamed") {
            await page.locator("#open-modal").click();
            await expect(
                page.getByRole("dialog", { name: "Named dialog" }),
            ).toBeVisible();
        }
        await page.addScriptTag({ content: axe });
        const violations = await page.evaluate(async () =>
            (
                await window.axe.run(document, {
                    runOnly: {
                        type: "tag",
                        values: ["wcag2a", "wcag2aa", "wcag21aa"],
                    },
                })
            ).violations.map((v) => ({
                id: v.id,
                targets: v.nodes.map((n) => n.target),
            })),
        );
        expect(violations, mode).toEqual([]);
    }
});

async function caretAtEnd(page) {
    await page.locator(".n-rte__content").evaluate((el) => {
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el.lastElementChild ?? el);
        range.collapse(false);
        const selection = getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        document.dispatchEvent(new Event("selectionchange"));
    });
}
test("full editor keeps images, tables and layout styles but strips unsafe parts", async ({
    page,
}) => {
    await load(page, "rte-full");
    await page.evaluate(
        () =>
            (window.audit.html.value =
                '<p style="text-align: center; color: red">c</p>' +
                '<img src="/a.png" alt="A" onerror="window.auditXss=1">' +
                '<img src="javascript:alert(1)"><img src="data:image/png,x">' +
                '<table border="1"><tbody><tr><td colspan="2" onclick="window.auditXss=1" style="width: 50%; background: red">1</td></tr></tbody></table>' +
                '<h4>h</h4><p>x<sub>2</sub><sup>3</sup><u>u</u></p><hr>' +
                '<a href="/f" target="_blank">f</a><a href="javascript:alert(1)" target="_top">bad</a>' +
                "<p>marker</p>"),
    );
    const content = page.locator(".n-rte__content");
    await expect(content).toContainText("marker");
    expect(await page.evaluate(() => window.auditXss)).toBeUndefined();
    await expect(content.locator("p").first()).toHaveAttribute(
        "style",
        "text-align: center",
    );
    await expect(content.locator("img")).toHaveCount(1);
    await expect(content.locator("img")).toHaveAttribute("alt", "A");
    await expect(content.locator("td")).toHaveAttribute("colspan", "2");
    await expect(content.locator("td")).toHaveAttribute("style", "width: 50%");
    await expect(content.locator("table")).toHaveAttribute("border", "1");
    await expect(content.locator("h4, sub, sup, u, hr")).toHaveCount(5);
    await expect(content.locator('a[target="_blank"]')).toHaveAttribute(
        "rel",
        "noopener noreferrer",
    );
    const attrs = await content.evaluate((el) =>
        [...el.querySelectorAll("*")].flatMap((n) =>
            [...n.attributes].map((a) => a.name + "=" + a.value),
        ),
    );
    expect(attrs.some((a) => a.startsWith("on"))).toBe(false);
    expect(attrs.some((a) => /javascript:|data:|_top|red/.test(a))).toBe(
        false,
    );
});
test("full editor inserts tables and edits rows and columns", async ({
    page,
}) => {
    await load(page, "rte-full");
    await caretAtEnd(page);
    await page.getByRole("button", { name: "Table", exact: true }).click();
    await expect(
        page.getByRole("dialog", { name: "Insert table" }),
    ).toBeVisible();
    await page.getByRole("spinbutton", { name: "Rows" }).fill("2");
    await page.getByRole("spinbutton", { name: "Columns" }).fill("3");
    await page.getByRole("button", { name: "Insert", exact: true }).click();
    const table = page.locator(".n-rte__content table");
    await expect(table.locator("tr")).toHaveCount(2);
    await expect(table.locator("th")).toHaveCount(3);
    await expect(table.locator("td")).toHaveCount(3);
    expect(await page.evaluate(() => window.audit.html.value)).toContain(
        "<table>",
    );
    const tools = page.getByRole("toolbar", { name: "Table" });
    await expect(tools).toBeVisible();
    await tools.getByRole("button", { name: "Row below" }).click();
    await expect(table.locator("tr")).toHaveCount(3);
    await expect(table.locator("thead tr")).toHaveCount(1);
    await tools.getByRole("button", { name: "Column right" }).click();
    await expect(table.locator("th")).toHaveCount(4);
    await tools.getByRole("button", { name: "Delete column" }).click();
    await expect(table.locator("th")).toHaveCount(3);
    await page.keyboard.press("Tab");
    await page.keyboard.type("next");
    // The caret followed the new body row; Tab moved it one cell to the right.
    await expect(
        table.locator("tbody tr").first().locator("td").nth(2),
    ).toHaveText("next");
    await tools.getByRole("button", { name: "Delete table" }).click();
    await expect(page.locator(".n-rte__content table")).toHaveCount(0);
});
test("full editor inserts picked images and edits their alt text", async ({
    page,
}) => {
    await load(page, "rte-full");
    await caretAtEnd(page);
    await page.getByRole("button", { name: "Image", exact: true }).click();
    const image = page.locator(".n-rte__content img");
    await expect(image).toHaveAttribute("src", "/picked.png");
    await expect(image).toHaveAttribute("alt", "Picked");
    await image.dblclick();
    await expect(page.getByRole("dialog", { name: "Image" })).toBeVisible();
    await page
        .getByRole("textbox", { name: "Alternative text" })
        .fill("New alt");
    await page.getByRole("textbox", { name: "Width, px" }).fill("320");
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(image).toHaveAttribute("alt", "New alt");
    await expect(image).toHaveAttribute("width", "320");
    expect(await page.evaluate(() => window.audit.html.value)).toContain(
        'alt="New alt"',
    );
});
test("full editor link dialog picks a file and opens it in a new tab", async ({
    page,
}) => {
    await load(page, "rte-full");
    await caretAtEnd(page);
    await page.getByRole("button", { name: "Link", exact: true }).click();
    await page.getByRole("button", { name: "Choose file" }).click();
    await expect(page.getByRole("textbox", { name: "Link URL" })).toHaveValue(
        "/files/doc.pdf",
    );
    await page.getByRole("checkbox", { name: "Open in a new tab" }).click();
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    const link = page.locator('.n-rte__content a[href="/files/doc.pdf"]');
    await expect(link).toHaveText("doc.pdf");
    await expect(link).toHaveAttribute("target", "_blank");
});
