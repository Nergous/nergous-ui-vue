// Internal editor policy. Construct a fresh HTML-only tree inside inert templates;
// never move untrusted nodes (including custom elements) into the live document.
const TAGS = new Set<string>(
    "b strong i em s strike u h2 h3 p br span div ul ol li blockquote code pre a".split(
        " ",
    ),
);
// Extra content kept by the "rich" policy (NRichText preset="full").
const RICH_TAGS = new Set<string>(
    "h4 h5 h6 sub sup small hr img figure figcaption table caption thead tbody tfoot tr th td".split(
        " ",
    ),
);
// Rich policy: allowed attributes per tag. Values are validated in copyAttributes().
const RICH_ATTRS: Record<string, readonly string[]> = {
    a: ["href", "title", "target"],
    img: ["src", "alt", "title", "width", "height"],
    ol: ["start"],
    table: ["border", "cellpadding", "cellspacing", "width"],
    th: ["colspan", "rowspan", "scope", "width"],
    td: ["colspan", "rowspan", "width"],
};
const NUMERIC_ATTRS = new Set<string>(
    "width height colspan rowspan start border cellpadding cellspacing".split(
        " ",
    ),
);
// Layout-only inline styles kept by the rich policy, with their allowed values.
const STYLE_VALUES: Record<string, RegExp> = {
    "text-align": /^(left|center|right|justify)$/,
    float: /^(left|right|none)$/,
    "vertical-align": /^(top|middle|bottom|baseline)$/,
    width: /^\d{1,4}(\.\d+)?(px|%|em|rem)?$/,
    height: /^\d{1,4}(\.\d+)?(px|%|em|rem)?$/,
};
const DROP = new Set<string>(
    "script style noscript iframe object embed template link meta head base form input button textarea select svg math frame frameset".split(
        " ",
    ),
);
const SCHEMES = new Set<string>(["http:", "https:", "mailto:", "tel:"]);
const IMAGE_SCHEMES = new Set<string>(["http:", "https:"]);

/** Options for sanitizeHtml(). */
export interface SanitizeOptions {
    /** Keep images, tables, extra headings, sub/sup and layout styles. */
    rich?: boolean;
}

export function safeUrl(value: unknown, image = false): string {
    const url = String(value ?? "").trim();
    if (!url || /[\u0000-\u001f\u007f\\]/.test(url)) return "";
    try {
        const protocol = new URL(url, "https://editor.invalid/").protocol;
        return (image ? IMAGE_SCHEMES : SCHEMES).has(protocol) ? url : "";
    } catch {
        return "";
    }
}

function safeStyle(value: string | null): string {
    if (!value) return "";
    const kept: string[] = [];
    for (const declaration of value.split(";")) {
        const colon = declaration.indexOf(":");
        if (colon < 0) continue;
        const property = declaration.slice(0, colon).trim().toLowerCase();
        const raw = declaration.slice(colon + 1).trim().toLowerCase();
        const rule = STYLE_VALUES[property];
        if (rule && rule.test(raw)) kept.push(property + ": " + raw);
    }
    return kept.join("; ");
}

function copyAttributes(source: Element, clean: Element, tag: string): void {
    for (const name of RICH_ATTRS[tag] ?? []) {
        const raw = source.getAttribute(name);
        if (raw === null) continue;
        let value = raw.trim();
        if (name === "href") value = safeUrl(value);
        else if (name === "src") value = safeUrl(value, true);
        else if (name === "target") value = value === "_blank" ? value : "";
        else if (name === "scope")
            value = /^(row|col|rowgroup|colgroup)$/.test(value) ? value : "";
        else if (NUMERIC_ATTRS.has(name))
            value = /^\d{1,4}%?$/.test(value) ? value : "";
        if (value) clean.setAttribute(name, value);
    }
    const style = safeStyle(source.getAttribute("style"));
    if (style) clean.setAttribute("style", style);
}

export function sanitizeHtml(
    value: unknown,
    options: SanitizeOptions = {},
): string {
    if (typeof document === "undefined") return "";
    const rich = !!options.rich;
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
            if (!TAGS.has(tag) && !(rich && RICH_TAGS.has(tag))) {
                copy(node, target);
                continue;
            }

            const clean = doc.createElement(tag);
            if (rich) {
                copyAttributes(node, clean, tag);
                // An image without a safe source has nothing to show.
                if (tag === "img" && !clean.hasAttribute("src")) continue;
                if (tag === "a" && clean.hasAttribute("href"))
                    clean.setAttribute("rel", "noopener noreferrer");
            } else if (tag === "a") {
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
