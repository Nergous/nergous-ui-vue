import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import {
    parse,
    compileScript,
    compileTemplate,
    compileStyle,
} from "@vue/compiler-sfc";
const root = process.cwd();
function files(dir) {
    return fs
        .readdirSync(dir, { withFileTypes: true })
        .flatMap((e) =>
            e.isDirectory()
                ? files(path.join(dir, e.name))
                : [path.join(dir, e.name)],
        );
}
const components = files("components").filter((f) => f.endsWith(".vue"));
const sources = [
    ...components,
    ...files("examples").filter((f) => f.endsWith(".vue")),
];
const entry = fs.readFileSync("index.js", "utf8");
const types = fs.readFileSync("index.d.ts", "utf8");
for (const f of components) {
    const name = path.basename(f, ".vue");
    assert.ok(entry.includes(name), name);
    assert.ok(types.includes("const " + name + ":"), name + " missing types");
}
for (const [i, f] of sources.entries()) {
    const { descriptor, errors } = parse(fs.readFileSync(f, "utf8"), {
        filename: f,
    });
    assert.deepEqual(errors, [], f);
    const id = "test" + i,
        script = compileScript(descriptor, { id });
    if (descriptor.template)
        assert.deepEqual(
            compileTemplate({
                source: descriptor.template.content,
                filename: f,
                id,
                compilerOptions: { bindingMetadata: script.bindings },
            }).errors,
            [],
            f,
        );
    for (const s of descriptor.styles)
        assert.deepEqual(
            compileStyle({
                source: s.content,
                filename: f,
                id,
                scoped: s.scoped,
            }).errors,
            [],
            f,
        );
}
for (const match of entry.matchAll(/(?:from|import)\s*["'](\.[^"']+)["']/g))
    assert.ok(fs.existsSync(path.join(root, match[1])), match[1]);
assert.equal(components.length, 41);
console.log("PASS: 41 exports/types, 43 Vue SFCs, public entry imports.");
