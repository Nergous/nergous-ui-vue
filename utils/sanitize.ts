// Internal editor policy. Construct a fresh HTML-only tree inside inert templates;
// never move untrusted nodes (including custom elements) into the live document.
const TAGS = new Set<string>(
    "b strong i em s strike u h2 h3 p br span div ul ol li blockquote code pre a".split(
        " ",
    ),
);
const DROP = new Set<string>(
    "script style noscript iframe object embed template link meta head base form input button textarea select".split(
        " ",
    ),
);
const SCHEMES = new Set<string>(["http:", "https:", "mailto:", "tel:"]);

export function safeUrl(value: unknown): string {
    const url = String(value ?? "").trim();
    if (!url || /[\u0000-\u001f\u007f\\]/.test(url)) return "";
    try {
        return SCHEMES.has(new URL(url, "https://editor.invalid/").protocol)
            ? url
            : "";
    } catch {
        return "";
    }
}

export function sanitizeHtml(value: unknown): string {
    if (typeof document === "undefined") return "";
    const input = document.createElement("template");
    const output = document.createElement("template");
    input.innerHTML = String(value ?? "");
    const doc = output.content.ownerDocument;

    function copy(source: ParentNode, target: Node) {
        for (const node of source.childNodes) {
            if (node instanceof Text) {
                target.appendChild(doc.createTextNode(node.textContent ?? ""));
                continue;
            }

            if (
                !(node instanceof Element) ||
                node.namespaceURI !== "http://www.w3.org/1999/xhtml"
            ) {
                continue;
            }

            const tag = node.localName;
            if (DROP.has(tag)) continue;
            if (!TAGS.has(tag)) {
                copy(node, target);
                continue;
            }

            const clean = doc.createElement(tag);
            if (tag === "a") {
                const href = safeUrl(node.getAttribute("href"));
                if (href) {
                    clean.setAttribute("href", href);
                    clean.setAttribute("rel", "noopener noreferrer");
                }
            }

            copy(node, clean);
            target.appendChild(clean);
        }
    }

    copy(input.content, output.content);
    return output.innerHTML;
}
