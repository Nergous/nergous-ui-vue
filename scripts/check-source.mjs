import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import ts from "typescript";
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
const entry = fs.readFileSync("index.ts", "utf8");
const legacyEntry = fs.readFileSync("index.js", "utf8");
const types = fs.readFileSync("index.d.ts", "utf8");
const typeSource = ts.createSourceFile(
    "index.d.ts",
    types,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

function hasDocs(node) {
    return ts.getJSDocCommentsAndTags(node).length > 0;
}

for (const statement of typeSource.statements) {
    const exported = statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    );
    if (exported && !ts.isImportDeclaration(statement)) {
        assert.ok(hasDocs(statement), "Missing public TSDoc: " + statement.getText(typeSource).split(/\r?\n/)[0]);
    }
}

function checkPublicMembers(node) {
    if (ts.isPropertySignature(node) || ts.isMethodSignature(node)) {
        assert.ok(hasDocs(node), "Missing public member TSDoc: " + node.getText(typeSource).split(/\r?\n/)[0]);
    }
    ts.forEachChild(node, checkPublicMembers);
}
checkPublicMembers(typeSource);

const typeProgram = ts.createProgram(["index.d.ts"], {
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022,
    skipLibCheck: false,
    strict: true,
});
const typeChecker = typeProgram.getTypeChecker();
const declarationFile = typeProgram.getSourceFile("index.d.ts");
const moduleSymbol = declarationFile && typeChecker.getSymbolAtLocation(declarationFile);
assert.ok(moduleSymbol, "index.d.ts module symbol");
const publicSymbols = new Map(
    typeChecker.getExportsOfModule(moduleSymbol).map((symbol) => [symbol.name, symbol]),
);
for (const name of ["NButton", "NDataTable", "useTheme", "useToast", "createFormat"]) {
    const symbol = publicSymbols.get(name);
    assert.ok(symbol, name + " public symbol");
    assert.ok(
        ts.displayPartsToString(symbol.getDocumentationComment(typeChecker)).trim(),
        name + " missing TypeScript symbol documentation",
    );
}

const consumerConfigPath = "tests/types/tsconfig.json";
const consumerConfig = ts.readConfigFile(consumerConfigPath, ts.sys.readFile);
assert.equal(consumerConfig.error, undefined, "consumer TypeScript config");
const parsedConsumerConfig = ts.parseJsonConfigFileContent(
    consumerConfig.config,
    ts.sys,
    path.dirname(consumerConfigPath),
);
const consumerProgram = ts.createProgram(
    parsedConsumerConfig.fileNames,
    parsedConsumerConfig.options,
);
const consumerChecker = consumerProgram.getTypeChecker();
const consumerSource = consumerProgram.getSourceFile("tests/types/contract.ts");
assert.ok(consumerSource, "consumer type contract");
const documentedImports = new Set();
function checkConsumerImports(node) {
    if (ts.isImportSpecifier(node)) {
        const name = node.name.text;
        if (["NButton", "useTheme", "createFormat"].includes(name)) {
            let symbol = consumerChecker.getSymbolAtLocation(node.name);
            if (symbol?.flags & ts.SymbolFlags.Alias) {
                symbol = consumerChecker.getAliasedSymbol(symbol);
            }
            assert.ok(symbol, name + " imported symbol");
            assert.ok(
                ts
                    .displayPartsToString(
                        symbol.getDocumentationComment(consumerChecker),
                    )
                    .trim(),
                name + " missing consumer hover documentation",
            );
            documentedImports.add(name);
        }
    }
    ts.forEachChild(node, checkConsumerImports);
}
checkConsumerImports(consumerSource);
assert.deepEqual(
    [...documentedImports].sort(),
    ["NButton", "createFormat", "useTheme"],
    "documented consumer imports",
);
for (const f of components) {
    const name = path.basename(f, ".vue");
    assert.ok(entry.includes(name), name);
    assert.ok(legacyEntry.includes(name), name + " missing legacy export");
    assert.ok(types.includes("const " + name + ":"), name + " missing types");
}
for (const name of [
    "useTheme",
    "THEME_STORAGE_KEY",
    "DENSITY_STORAGE_KEY",
    "useToast",
    "useScrollSpy",
    "createFormat",
    "toDate",
]) {
    assert.ok(entry.includes(name), name);
    assert.ok(legacyEntry.includes(name), name + " missing legacy export");
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
console.log("PASS: 41 exports/types, 43 Vue SFCs, public entry imports and IDE TSDoc.");
