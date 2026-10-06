import type {
    Component,
    ComponentCustomProps,
    HTMLAttributes,
    InputHTMLAttributes,
    TextareaHTMLAttributes,
    VNode,
    VNodeProps,
    AllowedComponentProps,
    Ref,
    ComputedRef,
    Plugin,
} from "vue";

/** Value accepted by selection controls and navigation components. */
export type Value = string | number;
/** Shared semantic color tones. Individual components can support a subset. */
export type Tone = "neutral" | "accent" | "ok" | "warn" | "danger" | "info";
/** Supported color themes. */
export type Theme = "light" | "dark";
/** Supported layout densities. */
export type Density = "compact" | "comfortable" | "spacious";
/** Select, radio, segmented-control, or tab option. */
export interface Option {
    /** Stable value emitted when the option is selected. */
    value: Value;
    /** Visible option label. */
    label: string;
    /** Prevent selection and keyboard focus when supported. */
    disabled?: boolean;
}
/** Anchor navigation section. */
export interface Section {
    /** Stable section identifier. */
    value: Value;
    /** Visible section label. */
    label: string;
    /** Optional count displayed beside the label. */
    count?: number;
}
/** Wizard or stepper item. */
export interface Step {
    /** Stable step identifier. */
    value: Value;
    /** Visible step label. */
    label: string;
    /** Optional supporting text. */
    sub?: string;
}
/** Command palette item. */
export interface Command {
    /** Visible command label. */
    label: string;
    /** Optional NIcon name. */
    icon?: string;
    /** Optional shortcut or supporting hint. */
    hint?: string;
    /** Callback invoked after command selection. */
    action?: () => void;
}
/** Dropdown menu item or divider. */
export interface DropdownItem {
    /** Visible label. Omit for dividers. */
    label?: string;
    /** Optional NIcon name. */
    icon?: string;
    /** Apply destructive-action styling. */
    danger?: boolean;
    /** Render a separator instead of an actionable item. */
    divider?: boolean;
    /** Mark the item as selected. */
    selected?: boolean;
    /** Callback invoked after item selection. */
    action?: () => void;
}
/** Sidebar navigation item. */
export interface SidebarItem {
    /** Stable item identifier and active value. */
    id: Value;
    /** Visible item label. */
    label: string;
    /** Optional NIcon name. */
    icon?: string;
    /** Optional badge value. */
    badge?: Value;
    /** Optional destination URL. */
    href?: string;
    /** Open the URL as an external destination. */
    external?: boolean;
}
/** Generic data-table row. */
export type Row = Record<string, unknown>;
/** Data-table column definition. */
export interface Column {
    /** Row property key. */
    key: string;
    /** Visible column heading. */
    label: string;
    /** Enable sortable-column behavior. */
    sortable?: boolean;
    /** CSS width for the column. */
    width?: string;
    /** Cell and heading alignment. */
    align?: "left" | "right" | "center";
}
type Camel<S extends string> = S extends `${infer H}-${infer T}`
    ? `${H}${Capitalize<Camel<T>>}`
    : S;
type EventProps<E> = {
    [
        K in keyof E & string as `on${Capitalize<Camel<K>>}`
    ]?: E[K] extends unknown[] ? (...args: E[K]) => void : never;
};
type DefaultSlots = {
    /** Default component content. */
    default?: () => VNode[];
};
/** Constructor shape used by public Vue component declarations. */
export type UIComponent<
    P = {},
    E extends Record<string, unknown[]> = {},
    S = DefaultSlots,
    A = HTMLAttributes,
> = new () => {
    /** Component props, native attributes, and typed event listeners. */
    $props: P &
        Omit<A, keyof P> &
        VNodeProps &
        AllowedComponentProps &
        ComponentCustomProps &
        EventProps<E>;
    /** Emit a declared component event. */
    $emit: <K extends keyof E>(event: K, ...args: E[K]) => void;
    /** Typed component slots. */
    $slots: S;
};
type Model<T = Value> = {
    /** Controlled v-model value. */
    modelValue?: T;
};
type Update<T = Value> = {
    /** v-model update payload. */
    "update:modelValue": [value: T];
};
type Field = {
    /** Apply invalid-state styling. */
    error?: boolean;
    /** Disable interaction. */
    disabled?: boolean;
    /** Placeholder text. */
    placeholder?: string;
};
type DialogProps = Model<boolean> & {
    /** Visible dialog title. */
    title?: string;
    /** Accessible name used when no visible title exists. */
    dialogLabel?: string;
    /** CSS width of the dialog panel. */
    width?: string;
    /** Accessible close-button label. */
    closeLabel?: string;
};
type DialogEvents = Update<boolean> & {
    /** Emitted after user dismissal. */
    close: [];
};
type DialogSlots = DefaultSlots & {
    /** Dialog footer. The close callback emits model and close events. */
    footer?: (props: {
        /** Close the dialog. */
        close: () => void;
    }) => VNode[];
};

/** Render an icon from the bundled line-icon registry. */
export declare const NIcon: UIComponent<{
    /** Registered icon name. */
    name: string;
    /** Icon size in CSS pixels or a CSS-compatible value. @defaultValue 18 */
    size?: Value;
    /** Accessible title. Omit for a decorative icon. */
    title?: string;
}>;
/** Polymorphic action button with loading, icon, and disabled states. */
export declare const NButton: UIComponent<{
    /** Visual variant. @defaultValue "primary" */
    variant?: "primary" | "secondary" | "ghost" | "danger";
    /** Control size. @defaultValue "md" */
    size?: "sm" | "md" | "lg";
    /** Optional hover tone for ghost or icon buttons. @defaultValue "" */
    tone?: "" | "accent" | "danger";
    /** Leading NIcon name. */
    icon?: string;
    /** Show a spinner and block activation. @defaultValue false */
    loading?: boolean;
    /** Disable activation. @defaultValue false */
    disabled?: boolean;
    /** Stretch to the container width. @defaultValue false */
    block?: boolean;
    /** Native button type when rendered as a button. @defaultValue "button" */
    type?: "button" | "submit" | "reset";
    /** Root element name or compatible Vue component. @defaultValue "button" */
    as?: string | Component;
    /** Counter badge; "", null and 0 hide it. Icon-only buttons show it in the corner; include the count in aria-label. */
    badge?: string | number | null;
}>;
/** Label, validation message, and hint wrapper for form controls. */
export declare const NFormField: UIComponent<{
    /** Visible field label. */
    label?: string;
    /** Validation error text. */
    error?: string;
    /** Supporting hint shown when no error exists. */
    hint?: string;
    /** Mark the field as required for assistive technology. */
    required?: boolean;
    /** Root HTML element. Use div for grouped controls. @defaultValue "label" */
    tag?: string;
    /** Explicit id for the visible label; generated when omitted. */
    labelId?: string;
}>;
/** Single-line text input with optional icon and password reveal control. */
export declare const NInput: UIComponent<
    Model &
        Field & {
            /** Native input type. @defaultValue "text" */
            type?: string;
            /** Leading NIcon name. */
            icon?: string;
            /** Control size. @defaultValue "md" */
            size?: "sm" | "md" | "lg";
            /** Accessible label for revealing a password. */
            revealLabel?: string;
            /** Accessible label for hiding a password. */
            hideLabel?: string;
            /** v-model number and trim modifiers. */
            modelModifiers?: {
                /** Convert parseable values to numbers. */
                number?: boolean;
                /** Trim leading and trailing whitespace. */
                trim?: boolean;
            };
        },
    Update,
    DefaultSlots,
    InputHTMLAttributes
>;
/** Multi-line text input. */
export declare const NTextarea: UIComponent<
    Model &
        Field & {
            /** Visible row count. @defaultValue 3 */
            rows?: Value;
            /** v-model trim modifier. */
            modelModifiers?: {
                /** Trim leading and trailing whitespace. */
                trim?: boolean;
            };
        },
    Update,
    DefaultSlots,
    TextareaHTMLAttributes
>;
/** Toolbar command supported by NRichText. */
export type RichTextTool =
    | "bold"
    | "italic"
    | "strike"
    | "h2"
    | "h3"
    | "ul"
    | "ol"
    | "link"
    | "quote"
    | "code"
    | "clear"
    | "undo"
    | "redo"
    | "underline"
    | "sub"
    | "sup"
    | "h4"
    | "alignLeft"
    | "alignCenter"
    | "alignRight"
    | "alignJustify"
    | "image"
    | "table"
    | "hr"
    | "fullscreen";
/** Row/column command of the NRichText table toolbar. */
export type RichTextTableCommand =
    | "rowAbove"
    | "rowBelow"
    | "colLeft"
    | "colRight"
    | "rowDelete"
    | "colDelete"
    | "tableDelete";
/** Localized NRichText labels keyed by toolbar command or dialog control. */
export type RichTextLabels = Partial<
    Record<
        | RichTextTool
        | RichTextTableCommand
        | "toolbar"
        | "linkPrompt"
        | "linkTitle"
        | "linkConfirm"
        | "linkCancel"
        | "linkRemove"
        | "linkNewTab"
        | "linkPick"
        | "imageTitle"
        | "imageUrl"
        | "imageAlt"
        | "imageWidth"
        | "imagePick"
        | "imageRemove"
        | "tableTitle"
        | "tableRows"
        | "tableCols"
        | "tableHeader"
        | "tableInsert"
        | "tableTools",
        string
    >
>;
/** Image returned by an NRichText `pickImage` callback. */
export interface RichTextImage {
    /** Image URL; http, https or relative. Unsafe URLs are ignored. */
    src: string;
    /** Alternative text for the inserted image. */
    alt?: string;
    /** Optional title, kept for API symmetry; not inserted by the toolbar. */
    title?: string;
}
/** File link returned by an NRichText `pickLink` callback. */
export interface RichTextLink {
    /** Link URL; http, https, mailto, tel or relative. */
    href: string;
    /** Link text used when nothing is selected. Defaults to the URL. */
    text?: string;
}
/** Sanitizing rich-text input backed by contenteditable. */
export declare const NRichText: UIComponent<
    Model<string> &
        Field & {
            /** Partial toolbar and dialog labels. Image and table dialogs reuse linkConfirm/linkCancel. */
            labels?: RichTextLabels;
            /**
             * Toolbar and content allowlist. "full" adds undo/redo, underline,
             * sub/sup, H4, alignment, images, tables, horizontal rules, links in a
             * new tab and full screen, and keeps images, tables and layout styles.
             * @defaultValue "basic"
             */
            preset?: "basic" | "full";
            /**
             * Enabled toolbar commands. An empty list enables the preset's commands.
             * Requesting any "full" command also enables the full content allowlist.
             */
            tools?: RichTextTool[];
            /** App-side image picker (e.g. a media library). Resolve null to cancel. */
            pickImage?: () => Promise<RichTextImage | null | undefined>;
            /** App-side file picker shown in the link dialog. Resolve null to cancel. */
            pickLink?: () => Promise<RichTextLink | null | undefined>;
        },
    Update<string>
>;
/** Themeable single-select listbox. Attributes other than class/style (aria-label, id, listeners) go to the combobox button. */
export declare const NSelect: UIComponent<
    Model &
        Field & {
            /** Selectable options. */
            options?: Option[];
        },
    Update
>;
/**
 * Picker for a date, date and time, time, month, or year with a typed text field and a themed popup.
 * The value uses native input formats: date "2026-10-06", datetime "2026-10-06T14:30", time "14:30",
 * month "2026-10", year "2026"; "" is empty. Attributes other than class/style go to the text input.
 */
export declare const NDatePicker: UIComponent<
    Model<string> &
        Field & {
            /** Picker kind and value format. @defaultValue "date" */
            type?: "date" | "datetime" | "time" | "month" | "year";
            /** Earliest value in the same format; a datetime also accepts a date. */
            min?: string;
            /** Latest value in the same format; a datetime also accepts a date. */
            max?: string;
            /** Show the clear buttons. @defaultValue true */
            clearable?: boolean;
            /** BCP 47 locale for names and the typed format. Defaults to the dictionary. */
            locale?: string;
            /** First day of the week, 0 = Sunday. Defaults to the dictionary. */
            weekStart?: number;
            /** Step of the minute arrow keys. @defaultValue 1 */
            minuteStep?: number;
            /** Time "HH:mm" for a datetime that gets its first date; empty means the current time. */
            defaultTime?: string;
        },
    Update<string>,
    DefaultSlots,
    InputHTMLAttributes
>;
/** Themeable single-select listbox with client-side search. Attributes other than class/style go to the combobox button. */
export declare const NSelectWithSearch: UIComponent<
    Model &
        Field & {
            /** Selectable options. */
            options?: Option[];
            /** Search input placeholder. */
            searchPlaceholder?: string;
            /** Text shown when filtering has no matches. */
            noResultsText?: string;
        },
    Update
>;
/** Boolean checkbox with mixed-state support. */
export declare const NCheckbox: UIComponent<
    Model<boolean> & {
        /** Show the mixed state. */
        indeterminate?: boolean;
        /** Disable interaction. */
        disabled?: boolean;
        /** Accessible name when no visible label slot exists. */
        ariaLabel?: string;
    },
    Update<boolean>
>;
/** Boolean on/off switch. Supply aria-label or aria-labelledby. */
export declare const NSwitch: UIComponent<
    Model<boolean> & {
        /** Disable interaction. */
        disabled?: boolean;
    },
    Update<boolean>
>;
/** Keyboard-accessible single-choice radio group. */
export declare const NRadioGroup: UIComponent<
    Model & {
        /** Radio options. */
        options?: Option[];
    },
    Update
>;
/** Keyboard-accessible single-choice segmented control. */
export declare const NSegmented: UIComponent<
    Model & {
        /** Segment options. */
        options?: Option[];
    },
    Update
>;
/** Drag-and-drop and file-picker input that emits accepted files. */
export declare const NDropzone: UIComponent<
    {
        /** Native accept filter. Validation remains the consumer's responsibility. */
        accept?: string;
        /** Allow more than one accepted file. @defaultValue true */
        multiple?: boolean;
        /** Primary instruction text. */
        title?: string;
        /** Separator text between instructions and browse action. */
        orLabel?: string;
        /** Browse-action label. */
        browseLabel?: string;
        /** Optional format or size hint. */
        hint?: string;
    },
    {
        /** Accepted files from drop or picker input. */
        files: [files: File[]];
    }
>;
/** Status or label chip with optional dot or color swatch. */
export declare const NBadge: UIComponent<{
    /** Semantic color tone. @defaultValue "neutral" */
    tone?: Tone;
    /** Show a leading status dot. */
    dot?: boolean;
    /** CSS color for a leading square swatch. */
    swatch?: string;
    /** Use fully rounded corners. */
    pill?: boolean;
    /** Badge size. @defaultValue "md" */
    size?: "md" | "sm";
}>;
/** Image avatar with initials fallback and optional presence indicator. */
export declare const NAvatar: UIComponent<{
    /** Name used to derive fallback initials. */
    name?: string;
    /** Image URL. */
    src?: string;
    /** Width and height in CSS pixels. @defaultValue 38 */
    size?: number;
    /** Presence status. */
    status?: "" | "online" | "busy" | "away";
    /** Use rounded-square styling instead of a circle. @defaultValue true */
    square?: boolean;
    /** Image alternative text. Empty makes the avatar decorative. */
    alt?: string;
}>;
/** Overlapping avatar stack with an overflow counter. */
export declare const NAvatarGroup: UIComponent<{
    /** Names rendered as avatar initials. */
    items?: string[];
    /** Maximum visible avatars before the overflow counter. @defaultValue 4 */
    max?: number;
    /** Avatar size in CSS pixels. @defaultValue 38 */
    size?: number;
}>;
/** Bordered surface container. */
export declare const NCard: UIComponent<{
    /** CSS padding override. */
    padding?: string;
    /** Add visual lift on hover. */
    hover?: boolean;
}>;
/** Metric card with optional change indicator and sparkline. */
export declare const NStatCard: UIComponent<{
    /** Metric label. */
    label?: string;
    /** Displayed metric value. */
    value?: Value;
    /** Supporting caption. */
    sub?: string;
    /** Change text. */
    delta?: string;
    /** Change direction used for color. */
    trend?: "up" | "down";
    /** Numeric points rendered as a sparkline. */
    spark?: number[];
    /** Optional NIcon name. */
    icon?: string;
}>;
/** Presentational activity-feed row. */
export declare const NActivityRow: UIComponent<{
    /** Icon-chip tone. @defaultValue "info" */
    tone?: Tone;
    /** NIcon name. */
    icon?: string;
    /** Primary actor text. */
    actor?: string;
    /** Muted action text. */
    verb?: string;
    /** Emphasized object text. */
    object?: string;
    /** Optional tag text. */
    tag?: string;
    /** Primary metadata text. */
    time?: string;
    /** Secondary monospace metadata. */
    meta?: string;
}>;
/** WAI-ARIA tab list with automatic keyboard selection. */
export declare const NTabs: UIComponent<
    Model & {
        /** Tab definitions. */
        tabs?: Option[];
        /** Stable id prefix used to associate external tab panels. */
        idBase?: string;
    },
    Update
>;
/** Controlled pagination with optional direct page navigation and page-size selection. */
export declare const NPagination: UIComponent<
    {
        /** Current one-based page. @defaultValue 1 */
        page?: number;
        /** Total page count, normalized to at least one. @defaultValue 1 */
        pages?: number;
        /** Accessible label for the previous-page button. */
        prevLabel?: string;
        /** Accessible label for the next-page button. */
        nextLabel?: string;
        /** Show a direct page-number input and submit button. @defaultValue false */
        jumpable?: boolean;
        /** Visible label for the direct page-number input. @defaultValue "Page" */
        jumpLabel?: string;
        /** Visible label for the direct-navigation submit button. @defaultValue "Go" */
        jumpButtonLabel?: string;
        /** Visible label before the total page count. @defaultValue "of" */
        totalLabel?: string;
        /** Accessible validation text for an invalid direct page number. @defaultValue "Enter a valid page number" */
        jumpErrorLabel?: string;
        /** Current rows-per-page value for the page-size selector. @defaultValue 0 */
        pageSize?: number;
        /** Page-size choices. A non-empty list shows the selector. @defaultValue [] */
        pageSizes?: number[];
        /** Visible label for the page-size selector. @defaultValue "Rows per page" */
        pageSizeLabel?: string;
        /** Accessible name of the nav landmark. @defaultValue "Pagination" */
        navLabel?: string;
        /** Render nothing on a single page; with pageSizes it stays while total exceeds the smallest size. @defaultValue false */
        hideOnSinglePage?: boolean;
        /** Total item count used by hideOnSinglePage together with pageSizes. @defaultValue 0 */
        total?: number;
    },
    {
        /** Updated one-based page. */
        "update:page": [page: number];
        /** Selected rows-per-page value. */
        "update:pageSize": [pageSize: number];
    }
>;
/** Sortable and selectable data table with optional client-side pagination. */
export declare const NDataTable: UIComponent<
    {
        /** Column definitions. */
        columns?: Column[];
        /** Data rows. */
        rows?: Row[];
        /** Row property containing the unique key. @defaultValue "id" */
        rowKey?: string;
        /** Show row-selection checkboxes. */
        selectable?: boolean;
        /** Controlled selected row keys. */
        selected?: Value[];
        /** Rows per client-side page. Zero disables pagination. */
        pageSize?: number;
        /** Enable row hover styling. @defaultValue true */
        hover?: boolean;
        /** Emit sort changes without sorting rows locally. */
        manualSort?: boolean;
        /** Controlled active sort column. */
        sortKey?: string;
        /** Controlled sort direction. @defaultValue "asc" */
        sortDir?: "asc" | "desc";
        /** Empty-state text. */
        emptyText?: string;
        /** Clear-selection button label. */
        clearLabel?: string;
        /** Build selected-row count text. */
        selectionLabel?: (n: number) => string;
        /** Build visible-range text. */
        rangeLabel?: (from: number, to: number, total: number) => string;
        /** Accessible label for the select-all checkbox. */
        selectAllLabel?: string;
        /** Accessible label for row checkboxes. */
        selectRowLabel?: string;
        /** Build the "select all matching" button text. */
        selectAllMatchingLabel?: (total: number) => string;
        /** Rows matching the filters across all server pages; enables "select all matching". @defaultValue 0 */
        total?: number;
        /** Controlled "all matching rows selected" state (v-model:allMatching). @defaultValue false */
        allMatching?: boolean;
        /** Render rows as label/value cards below 640px viewport width. @defaultValue false */
        stacked?: boolean;
        /** Build an accessible name for an interactive row. */
        rowLabel?: ((row: Row) => string) | null;
        /** Add class bindings to each row. */
        rowClass?:
            ((row: Row) => string | string[] | Record<string, boolean>) | null;
    },
    {
        /** Updated selected row keys. */
        "update:selected": [keys: Value[]];
        /** Updated "all matching rows selected" state. */
        "update:allMatching": [value: boolean];
        /** Activated row. */
        "row-click": [row: Row];
        /** Requested sort state. */
        "sort-change": [sort: {
            /** Column key. */
            key: string;
            /** Sort direction. */
            dir: "asc" | "desc";
        }];
    },
    {
        /** Selection toolbar content. */
        bulk?: (props: {
            /** Selected row keys. */
            selected: Value[];
            /** Whether every matching row is selected. */
            allMatching: boolean;
            /** Selected row count (total when all matching rows are selected). */
            count: number;
            /** Clear current selection. */
            clear: () => void;
        }) => VNode[];
        /** Empty-state content. */
        empty?: () => VNode[];
    } & {
        [key: `cell-${string}`]:
            | ((props: {
                  /** Current row. */
                  row: Row;
                  /** Value for the matching column key. */
                  value: unknown;
              }) => VNode[])
            | undefined;
    }
>;
/** Inline semantic alert. */
export declare const NAlert: UIComponent<{
    /** Alert tone. @defaultValue "info" */
    tone?: Tone;
    /** Optional heading. */
    title?: string;
    /** NIcon override. */
    icon?: string;
    /** ARIA role override. */
    role?: string;
}>;
/** Live-region container for the shared useToast store. Mount once. */
export declare const NToaster: UIComponent<{
    /** Accessible live-region label. */
    regionLabel?: string;
    /** Accessible label for dismiss buttons. */
    dismissLabel?: string;
}>;
/** Determinate progress bar. */
export declare const NProgress: UIComponent<{
    /** Progress percentage; rendered value is clamped to 0–100. */
    value?: number;
    /** Optional visible label. */
    label?: string;
    /** Display the percentage text. */
    showValue?: boolean;
    /** Progress-bar tone. @defaultValue "accent" */
    tone?: Tone;
}>;
/** Indeterminate loading spinner. */
export declare const NSpinner: UIComponent<{
    /** Diameter in CSS pixels. @defaultValue 24 */
    size?: number;
    /** Stroke width in CSS pixels. @defaultValue 2 */
    width?: number;
    /** Accessible status label. Empty makes the spinner decorative. */
    label?: string;
}>;
/** Animated loading placeholder. */
export declare const NSkeleton: UIComponent<{
    /** CSS width. @defaultValue "100%" */
    width?: string;
    /** CSS height. @defaultValue "12px" */
    height?: string;
    /** CSS border radius. @defaultValue "6px" */
    radius?: string;
    /** Render a circular placeholder. */
    circle?: boolean;
}>;
/** Text tooltip for non-interactive trigger content. */
export declare const NTooltip: UIComponent<{
    /** Tooltip text. */
    content?: string;
    /** Preferred placement. @defaultValue "top" */
    placement?: "top" | "bottom" | "left" | "right";
}>;
/** Empty or no-results state with optional action slot. */
export declare const NEmptyState: UIComponent<{
    /** NIcon name. */
    icon?: string;
    /** Empty-state heading. */
    title?: string;
    /** Supporting description. */
    description?: string;
}>;
/** Centered modal dialog with focus trapping, dismissal, and scroll locking. */
export declare const NModal: UIComponent<
    DialogProps,
    DialogEvents,
    DialogSlots
>;
/** Right-side drawer dialog with focus trapping, dismissal, and scroll locking. */
export declare const NDrawer: UIComponent<
    DialogProps & {
        /** Supporting text below the title. */
        subtitle?: string;
    },
    DialogEvents,
    DialogSlots
>;
/** Fullscreen image viewer controlled by an active item index. */
export declare const NLightbox: UIComponent<
    {
        /** Images and optional captions; captions also provide image alt text. */
        items?: {
            /** Image URL. */
            url: string;
            /** Caption and image alternative text. */
            caption?: string;
        }[];
        /** Current item index; -1 closes the lightbox. @defaultValue -1 */
        index?: number;
        /** Accessible dialog label. */
        dialogLabel?: string;
        /** Accessible close-button label. */
        closeLabel?: string;
        /** Accessible previous-button label. */
        prevLabel?: string;
        /** Accessible next-button label. */
        nextLabel?: string;
    },
    {
        /** Updated active image index. */
        "update:index": [index: number];
    }
>;
/** WAI-ARIA menu button whose default slot supplies the trigger. */
export declare const NDropdown: UIComponent<
    {
        /** Menu items and dividers. */
        items?: DropdownItem[];
        /** Horizontal menu alignment. @defaultValue "left" */
        align?: "left" | "right";
    },
    {
        /** Selected menu item. */
        select: [item: DropdownItem];
    },
    {
        /** Trigger content. */
        default?: (props: {
            /** Current menu-open state. */
            open: boolean;
        }) => VNode[];
    }
>;
/** Keyboard command launcher with optional client-side filtering. */
export declare const NCommandPalette: UIComponent<
    Model<boolean> & {
        /** Available commands. */
        commands?: Command[];
        /** Search input placeholder. */
        placeholder?: string;
        /** Text shown when no command matches. */
        emptyText?: string;
        /** Keyboard-navigation hint. */
        navHint?: string;
        /** Selection hint. */
        selectHint?: string;
        /** Bind Cmd/Ctrl+K globally. @defaultValue true */
        shortcut?: boolean;
        /** Filter commands locally. Disable for externally supplied results. */
        filter?: boolean;
    },
    Update<boolean> & {
        /** Executed command. */
        run: [command: Command];
        /** Current search query. */
        "update:query": [query: string];
    }
>;
/** Collapsible navigation sidebar with optional custom link component. */
export declare const NSidebar: UIComponent<
    Model & {
        /** Navigation groups. */
        groups?: {
            /** Optional group heading. */
            label?: string;
            /** Navigation items in this group. */
            items: SidebarItem[];
        }[];
        /** Controlled compact or mobile-hidden state. */
        collapsed?: boolean;
        /** Use off-canvas mobile positioning. */
        mobile?: boolean;
        /** Brand lockup content. */
        brand?: {
            /** Primary brand name. */
            name?: string;
            /** Secondary brand line. */
            sub?: string;
            /** Short glyph text. */
            glyph?: string;
            /** Image URL shown instead of the glyph; falls back to the glyph if it fails to load. */
            logo?: string;
        };
        /** Element name or component used to render items with href. @defaultValue "a" */
        linkAs?: string | Component;
        /** Accessible navigation landmark label. */
        navLabel?: string;
    },
    Update & {
        /** Updated collapsed state. */
        "update:collapsed": [collapsed: boolean];
        /** Activated navigation item. */
        navigate: [item: SidebarItem];
    },
    {
        /** Sidebar footer content. */
        footer?: (props: {
            /** Current collapsed state. */
            collapsed: boolean;
        }) => VNode[];
    }
>;
/** Application header with title and navigation-toggle action. */
export declare const NTopbar: UIComponent<
    {
        /** Page title. */
        title?: string;
        /** Supporting title text. */
        subtitle?: string;
        /** Show the navigation-toggle button. */
        collapsible?: boolean;
        /** Element used for the title. @defaultValue "h1" */
        titleTag?: string;
        /** Accessible navigation-toggle label. */
        toggleLabel?: string;
    },
    {
        /** Navigation-toggle activation. */
        toggle: [];
    },
    DefaultSlots & {
        /** Content after the toggle and before the center slot. */
        left?: () => VNode[];
        /** Right-aligned actions. */
        right?: () => VNode[];
    }
>;
/** Product brand glyph and text lockup. */
export declare const NBrand: UIComponent<{
    /** Short glyph text. @defaultValue "N" */
    glyph?: string;
    /** Image URL shown instead of the glyph; falls back to the glyph if it fails to load. */
    logo?: string;
    /** Primary brand name. */
    name?: string;
    /** Secondary brand line. */
    sub?: string;
    /** Brand size. @defaultValue "md" */
    size?: "sm" | "md" | "lg";
    /** Show the name and secondary line. @defaultValue true */
    showSub?: boolean;
}>;
/** Vertical step navigation with optional explicit completion state. */
export declare const NStepper: UIComponent<
    Model & {
        /** Ordered step definitions. */
        steps?: Step[];
        /** Explicit completed values; null derives completion from active index. */
        completed?: Value[] | null;
        /** Accessible navigation landmark label. */
        navLabel?: string;
    },
    Update
>;
type WizardBody = {
    /** Active step, or null when no step exists. */
    step: Step | null;
    /** Zero-based active step index. */
    index: number;
    /** Total step count. */
    count: number;
};
/** Multi-step form shell with scoped body and footer controls. */
export declare const NWizard: UIComponent<
    Model & {
        /** Ordered step definitions. */
        steps?: Step[];
        /** Explicit completed values; null derives completion from active index. */
        completed?: Value[] | null;
        /** Optional rail heading. */
        title?: string;
        /** Show the top progress bar. @defaultValue true */
        progress?: boolean;
        /** Accessible step-navigation label. */
        navLabel?: string;
    },
    Update,
    {
        /** Active step body. */
        default?: (props: WizardBody) => VNode[];
        /** Wizard footer controls. */
        footer?: (
            props: Omit<WizardBody, "step"> & {
                /** Whether the active step is first. */
                isFirst: boolean;
                /** Whether the active step is last. */
                isLast: boolean;
                /** Select the previous step when available. */
                prev: () => void;
                /** Select the next step when available. */
                next: () => void;
                /** Select a step by value. */
                goTo: (value: Value) => void;
            },
        ) => VNode[];
    }
>;
/** Vertical section navigation controlled by modelValue. */
export declare const NAnchorNav: UIComponent<
    Model & {
        /** Ordered section definitions. */
        sections?: Section[];
        /** Accessible navigation landmark label. */
        navLabel?: string;
    },
    Update
>;
/** Anchored long-form shell with section navigation and scroll tracking. */
export declare const NAnchoredForm: UIComponent<
    Model & {
        /** Ordered section definitions. */
        sections?: Section[];
        /** Optional caption above section navigation. */
        sectionsLabel?: string;
        /** CSS height of the scrollable form shell. @defaultValue "560px" */
        height?: string;
        /** Scroll-spy offset in CSS pixels. @defaultValue 16 */
        offset?: number;
        /** Accessible navigation landmark label. */
        navLabel?: string;
    },
    Update,
    {
        /** Content above section navigation. */
        header?: () => VNode[];
        /** Status content pinned to the navigation rail. */
        status?: () => VNode[];
        /** Floating save-bar content. */
        savebar?: () => VNode[];
    } & {
        [key: `section-${string}`]:
            | ((props: {
                  /** Current section definition. */
                  section: Section;
                  /** Zero-based section index. */
                  index: number;
              }) => VNode[])
            | undefined;
    }
>;

/** Filter chip shown by NFilterChips. */
export interface FilterChip {
    /** Unique chip key emitted by remove. */
    key: string;
    /** Filter name. */
    label: string;
    /** Readable filter value. */
    value: string;
}
/** Breadcrumb trail item. */
export interface Crumb {
    /** Visible text. */
    label: string;
    /** Destination; omitted for plain text. The last item is never a link. */
    href?: string;
}
/** Multi-select with a checkbox panel; v-model is an array kept in options order. */
export declare const NMultiSelect: UIComponent<
    Model<Value[]> &
        Field & {
            /** Selectable options. */
            options?: Option[];
            /** Accessible filter name when not inside NFormField. */
            label?: string;
            /** Show a search field in the panel. @defaultValue false */
            search?: boolean;
            /** Search field placeholder and accessible name. */
            searchPlaceholder?: string;
            /** Text shown when the search has no matches. */
            noResultsText?: string;
            /** Build the selected-count text. */
            selectedLabel?: (count: number) => string;
            /** Clear-action label. */
            clearLabel?: string;
        },
    Update<Value[]>
>;
/** Sticky form save bar with an unsaved-changes state and an actions slot. */
export declare const NActionBar: UIComponent<
    {
        /** The form has unsaved changes. @defaultValue false */
        dirty?: boolean;
        /** State text without changes. */
        idleText?: string;
        /** State text with unsaved changes. */
        dirtyText?: string;
        /** Stick to the bottom of the scroll area. @defaultValue true */
        sticky?: boolean;
    },
    {},
    DefaultSlots & {
        /** Replaces the state text. */
        status?: (props: {
            /** Current dirty state. */
            dirty: boolean;
        }) => VNode[];
    }
>;
/** Drag/keyboard grip button for useSortable rows. */
export declare const NSortHandle: UIComponent<{
    /** Accessible name, e.g. "Move “News”"; the keyboard hint is appended. */
    label: string;
    /** The row is being dragged. @defaultValue false */
    active?: boolean;
    /** Keyboard hint appended to the label. */
    hint?: string;
}>;
/** Removable chips of the active list filters with a reset-all action. */
export declare const NFilterChips: UIComponent<
    {
        /** Active filters; render nothing when empty. */
        filters?: FilterChip[];
        /** Accessible group label. */
        groupLabel?: string;
        /** Reset-all button text. */
        resetLabel?: string;
        /** Build a remove-button accessible name. */
        removeLabel?: (label: string, value: string) => string;
    },
    {
        /** Remove one filter by chip key. */
        remove: [key: string];
        /** Reset all filters. */
        reset: [];
    }
>;
/** Popover with a checkbox per optional table column; v-model:hidden holds hidden keys. */
export declare const NColumnPicker: UIComponent<
    {
        /** Optional columns offered in the picker. */
        columns?: Column[];
        /** Hidden column keys. */
        hidden?: string[];
        /** Button text. */
        label?: string;
        /** Disable the picker. @defaultValue false */
        disabled?: boolean;
    },
    {
        /** Updated hidden column keys. */
        "update:hidden": [keys: string[]];
    }
>;
/** Shared tooltip for icon-only buttons and links, using their aria-label. Mount once. */
export declare const NIconTooltip: UIComponent<{
    /** Hover delay in milliseconds. @defaultValue 400 */
    delay?: number;
    /** Selector of elements that may get the tooltip. */
    selector?: string;
}>;
/** Button that opens a non-modal panel; the default slot receives close. */
export declare const NPopover: UIComponent<
    {
        /** Button text. */
        label?: string;
        /** Leading NIcon name. */
        icon?: string;
        /** Disable the button. @defaultValue false */
        disabled?: boolean;
        /** Minimum panel width (CSS length). */
        width?: string;
        /** Panel alignment to the button. @defaultValue "right" */
        align?: "left" | "right";
    },
    {
        /** Panel opened or closed. */
        "update:open": [open: boolean];
    },
    {
        /** Panel content. */
        default?: (props: {
            /** Close the panel; pass true to return focus to the button. */
            close: (returnFocus?: boolean) => void;
        }) => VNode[];
        /** Custom button content instead of label. */
        label?: () => VNode[];
    }
>;
/** Confirmation dialog built on NModal. */
export declare const NConfirmDialog: UIComponent<
    Model<boolean> & {
        /** Dialog title. */
        title?: string;
        /** Message text. */
        message?: string;
        /** Confirm-button text. */
        confirmLabel?: string;
        /** Cancel-button text. */
        cancelLabel?: string;
        /** Accessible close-button label. */
        closeLabel?: string;
        /** Destructive styling for the confirm button. @defaultValue false */
        danger?: boolean;
        /** Show a spinner on the confirm button. @defaultValue false */
        loading?: boolean;
        /** CSS width of the dialog. @defaultValue "420px" */
        width?: string;
    },
    Update<boolean> & {
        /** Confirm button activated. */
        confirm: [];
        /** Dialog dismissed without confirming. */
        cancel: [];
    }
>;
/** List toolbar with search, filter, and actions slots. */
export declare const NToolbar: UIComponent<
    {},
    {},
    DefaultSlots & {
        /** Search field that takes the free space. */
        search?: () => VNode[];
        /** Actions aligned to the far end. */
        actions?: () => VNode[];
    }
>;
/** Breadcrumb trail; the last item is the current page. */
export declare const NBreadcrumbs: UIComponent<{
    /** Trail items from the root to the current page. */
    items?: Crumb[];
    /** Element name or router link component for items with href. @defaultValue "a" */
    linkAs?: string | Component;
    /** Accessible navigation landmark label. */
    navLabel?: string;
}>;

/** localStorage key used for persisted theme. */
export declare const THEME_STORAGE_KEY: "nergous-ui-vue-theme";
/** localStorage key used for persisted density. */
export declare const DENSITY_STORAGE_KEY: "nergous-ui-vue-density";
/** Theme and density controls returned by useTheme. */
export interface ThemeControls {
    /** Shared writable theme ref. */
    theme: Ref<Theme>;
    /** Shared writable density ref. */
    density: Ref<Density>;
    /** Toggle between light and dark. @returns Nothing. */
    toggle(): void;
    /** Set the current theme. @param value - Desired theme. @returns Nothing. */
    setTheme(value: Theme): void;
    /** Set the current density. @param value - Desired density. @returns Nothing. */
    setDensity(value: Density): void;
}
/**
 * Access module-wide theme and density state and synchronize it with document data attributes and localStorage.
 * @returns Shared theme refs and update methods.
 */
export declare function useTheme(): ThemeControls;
/** Options accepted when creating a toast. */
export interface ToastOptions {
    /** Semantic presentation tone. @defaultValue "ok" */
    tone?: "ok" | "info" | "warn" | "danger";
    /** Toast heading. */
    title?: string;
    /** Toast body. */
    msg?: string;
    /** Auto-dismiss delay in milliseconds. Zero disables automatic dismissal. */
    duration?: number;
}
/** Reactive toast record. */
export interface Toast extends ToastOptions {
    /** Generated toast identifier. */
    id: number;
    /** Resolved presentation tone. */
    tone: "ok" | "info" | "warn" | "danger";
    /** Resolved heading; empty when omitted. */
    title: string;
    /** Resolved body; empty when omitted. */
    msg: string;
    /** Resolved auto-dismiss delay in milliseconds. */
    duration: number;
    /** Remaining auto-dismiss time in milliseconds. */
    remaining: number;
    /** Epoch milliseconds when the active timer started. */
    startedAt: number;
}
/** Shared toast store and controls returned by useToast. */
export interface ToastControls {
    /** Shared reactive list of active toasts. */
    toasts: Toast[];
    /** Add a toast. @param options - Heading text or toast options. @returns Generated toast id. */
    push(options: string | ToastOptions): number;
    /** Remove a toast and cancel its timer. @param id - Toast id. @returns Nothing. */
    dismiss(id: number): void;
    /** Pause active auto-dismiss timers. @returns Nothing. */
    pauseAll(): void;
    /** Resume paused auto-dismiss timers. @returns Nothing. */
    resumeAll(): void;
    /** Add a success toast. @returns Generated toast id. */
    success(title: string, msg?: string): number;
    /** Add an error toast. @returns Generated toast id. */
    error(title: string, msg?: string): number;
    /** Add a warning toast. @returns Generated toast id. */
    warning(title: string, msg?: string): number;
    /** Add an informational toast. @returns Generated toast id. */
    info(title: string, msg?: string): number;
}
/** Access the module-wide toast store. @returns Shared toast list and controls. */
export declare function useToast(): ToastControls;
/** Scroll-spy configuration. */
export interface ScrollSpyOptions {
    /** Pixel offset or getter evaluated for each operation. @defaultValue 16 */
    offset?: number | (() => number);
    /** Scrolling element: the container itself or its nearest scrolling ancestor (page flow). @defaultValue "self" */
    scroller?: "self" | "ancestor";
}
/** Scroll-spy state and controls. */
export interface ScrollSpyControls {
    /** Active data-spy value, or null before a section becomes active. */
    active: Ref<string | null>;
    /** Scroll to a matching section. @param value - Section identifier. @returns Nothing. */
    scrollTo(value: Value): void;
    /** Recompute the active section from current scroll position. @returns Nothing. */
    recompute(): void;
}
/**
 * Track data-spy descendants in a scroll container.
 * @param container - Container ref or getter.
 * @param options - Scroll offset configuration.
 * @returns Active section state and navigation methods.
 */
export declare function useScrollSpy(
    container: Ref<HTMLElement | null> | (() => HTMLElement | null),
    options?: ScrollSpyOptions,
): ScrollSpyControls;
/** Input accepted by date formatters. */
export type DateInput = string | number | Date | null | undefined;
/**
 * Parse a native date input.
 * @param value - Date, date string, epoch milliseconds, or absent value.
 * @returns A valid Date, or null for empty or invalid input.
 */
export declare function toDate(
    value: DateInput,
): Date | null;
/** Locale-bound formatters returned by createFormat. */
export interface Formatters {
    /** Parse a date input. @returns A valid Date or null. */
    toDate: typeof toDate;
    /** Format date and time. @returns Localized text or an em dash. */
    formatDateTime(value: DateInput): string;
    /** Format a short date. @returns Localized text or an em dash. */
    formatDateShort(value: DateInput): string;
    /** Format time relative to now. @returns Localized text or an em dash. */
    formatRelative(value: DateInput): string;
    /** Format a finite number. @returns Localized text or an em dash. */
    formatNumber(value: string | number | null | undefined): string;
    /** Format a byte count with 1024-based locale units. @returns Localized size or an em dash. */
    formatBytes(value: string | number | null | undefined): string;
    /** Pick a plural form by Intl.PluralRules; "#" inserts the formatted count. @returns The matching text. */
    plural(count: number, forms: PluralForms): string;
}
/** Plural-category texts; other is required. */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & {
    /** Fallback form. */
    other: string;
};
/** Options of createFormat. */
export interface FormatOptions {
    /** IANA time zone for dates; invalid or omitted uses the host zone. */
    timeZone?: string;
}
/**
 * Create locale-bound Intl formatters.
 * @param locale - BCP 47 locale identifier or preference list.
 * @param options - Optional display time zone.
 * @returns Cached date, relative-time, number, byte-size, and plural formatters.
 */
export declare function createFormat(
    locale?: string | string[],
    options?: FormatOptions,
): Formatters;
/** Every localizable component string; function entries build text from values. */
export interface Messages {
    /** Select placeholder. */
    "select.placeholder": string;
    /** Select search placeholder. */
    "select.search": string;
    /** Select text without matches. */
    "select.noResults": string;
    /** Show-password button. */
    "input.reveal": string;
    /** Hide-password button. */
    "input.hide": string;
    /** Dropzone instruction. */
    "dropzone.title": string;
    /** Dropzone separator. */
    "dropzone.or": string;
    /** Dropzone browse action. */
    "dropzone.browse": string;
    /** Untitled modal name. */
    "dialog.label": string;
    /** Dialog close button. */
    "dialog.close": string;
    /** Untitled drawer name. */
    "drawer.label": string;
    /** Lightbox dialog name. */
    "lightbox.label": string;
    /** Lightbox previous button. */
    "lightbox.prev": string;
    /** Lightbox next button. */
    "lightbox.next": string;
    /** Command palette placeholder. */
    "command.placeholder": string;
    /** Command palette without matches. */
    "command.empty": string;
    /** Command palette navigation hint. */
    "command.navigate": string;
    /** Command palette selection hint. */
    "command.select": string;
    /** Toast region name. */
    "toaster.region": string;
    /** Toast dismiss button. */
    "toaster.dismiss": string;
    /** Sidebar landmark name. */
    "nav.main": string;
    /** Stepper and wizard landmark name. */
    "nav.steps": string;
    /** Anchor navigation landmark name. */
    "nav.sections": string;
    /** Navigation toggle button. */
    "topbar.toggle": string;
    /** Empty-state heading. */
    "empty.title": string;
    /** Pagination landmark name. */
    "pagination.label": string;
    /** Previous-page button. */
    "pagination.prev": string;
    /** Next-page button. */
    "pagination.next": string;
    /** Page-number field label. */
    "pagination.jump": string;
    /** Page-jump button. */
    "pagination.jumpButton": string;
    /** Text before the page total. */
    "pagination.of": string;
    /** Invalid page-number message. */
    "pagination.jumpError": string;
    /** Page-size selector label. */
    "pagination.pageSize": string;
    /** Table without rows. */
    "table.empty": string;
    /** Clear-selection button. */
    "table.clear": string;
    /** Selected-row count text. */
    "table.selection": (count: number) => string;
    /** Visible-range text. */
    "table.range": (from: number, to: number, total: number) => string;
    /** Select-all checkbox. */
    "table.selectAll": string;
    /** Row checkbox. */
    "table.selectRow": string;
    /** Select-all-matching button. */
    "table.selectAllMatching": (total: number) => string;
    /** Column picker button. */
    "table.columns": string;
    /** Multi-select search placeholder. */
    "multiSelect.search": string;
    /** Multi-select without matches. */
    "multiSelect.noResults": string;
    /** Multi-select count text. */
    "multiSelect.selected": (count: number) => string;
    /** Multi-select clear action. */
    "multiSelect.clear": string;
    /** Filter chips group name. */
    "filters.label": string;
    /** Reset-all filters button. */
    "filters.reset": string;
    /** Remove-filter button name. */
    "filters.remove": (label: string, value: string) => string;
    /** Save bar text without changes. */
    "actionBar.idle": string;
    /** Save bar text with unsaved changes. */
    "actionBar.dirty": string;
    /** Confirmation title. */
    "confirm.title": string;
    /** Confirm button. */
    "confirm.confirm": string;
    /** Cancel button. */
    "confirm.cancel": string;
    /** Sort handle keyboard hint. */
    "sort.hint": string;
    /** Sort position announcement. */
    "sort.position": (label: string, position: number, total: number) => string;
    /** Breadcrumb landmark name. */
    "breadcrumbs.label": string;
    /** BCP 47 locale of NDatePicker names and its typed format. */
    "datePicker.locale": string;
    /** First day of the NDatePicker week, 0 = Sunday. */
    "datePicker.weekStart": number;
    /** Format-hint tokens of the NDatePicker placeholder. */
    "datePicker.tokens": {
        /** Year token. */
        year: string;
        /** Month token. */
        month: string;
        /** Day token. */
        day: string;
        /** Hour token. */
        hour: string;
        /** Minute token. */
        minute: string;
    };
    /** Date picker open button and popup name. */
    "datePicker.openDate": string;
    /** Time picker open button and popup name. */
    "datePicker.openTime": string;
    /** Previous-month button. */
    "datePicker.prevMonth": string;
    /** Next-month button. */
    "datePicker.nextMonth": string;
    /** Previous-year button. */
    "datePicker.prevYear": string;
    /** Next-year button. */
    "datePicker.nextYear": string;
    /** Previous year-page button. */
    "datePicker.prevYears": string;
    /** Next year-page button. */
    "datePicker.nextYears": string;
    /** Hint of the title that switches to months. */
    "datePicker.chooseMonth": string;
    /** Hint of the title that switches to years. */
    "datePicker.chooseYear": string;
    /** Pick-today button. */
    "datePicker.today": string;
    /** Pick-current-time button. */
    "datePicker.now": string;
    /** Clear button. */
    "datePicker.clear": string;
    /** Close button of the time popup. */
    "datePicker.done": string;
    /** Time field group. */
    "datePicker.time": string;
    /** Hours field. */
    "datePicker.hours": string;
    /** Minutes field. */
    "datePicker.minutes": string;
    /** NRichText labels, merged under the labels prop. */
    richText: RichTextLabels;
}
/** Partial dictionary accepted by locale providers; missing keys use English. */
export type MessagesInput = Partial<Messages>;
/** Built-in English dictionary (the component defaults). */
export declare const enMessages: Messages;
/** Built-in Russian dictionary. */
export declare const ruMessages: Messages;
/**
 * Provide a dictionary to the calling component's subtree; merges over an outer provider. Call during setup.
 * @param messages - Dictionary, ref, or getter; reactive sources switch language live.
 */
export declare function provideLocale(
    messages: MessagesInput | Ref<MessagesInput> | (() => MessagesInput),
): void;
/**
 * Create an app plugin providing a dictionary to the whole app: app.use(createLocale(ruMessages)).
 * Labels resolve as prop, then dictionary, then English default.
 * @param messages - Dictionary, ref, or getter.
 * @returns A Vue plugin.
 */
export declare function createLocale(
    messages: MessagesInput | Ref<MessagesInput> | (() => MessagesInput),
): Plugin;
/**
 * Read the effective dictionary (provided keys over English). Call during setup.
 * @returns A computed dictionary with every key present.
 */
export declare function useMessages(): ComputedRef<Messages>;
/** Reactive confirmation state returned by useConfirm. */
export interface ConfirmState<T> {
    /** Dialog open state; bind to NConfirmDialog v-model. */
    open: boolean;
    /** Payload being confirmed. */
    payload: T | null;
    /** Action in progress; bind to NConfirmDialog loading. */
    loading: boolean;
    /** Open the dialog for a payload. @returns Nothing. */
    ask(payload?: T | null): void;
    /** Close the dialog and reset loading. @returns Nothing. */
    close(): void;
    /** Run the action with loading on; close on success, rethrow on failure. @returns A promise of completion. */
    run(action: (payload: T | null) => unknown): Promise<void>;
}
/**
 * Create confirmation state for NConfirmDialog.
 * @returns Reactive open, payload, and loading state with controls.
 */
export declare function useConfirm<T = unknown>(): ConfirmState<T>;
/** Options of useSortable. */
export interface SortableOptions {
    /** Delay before commit after keyboard moves; 0 commits at once. @defaultValue 400 */
    commitDelay?: number;
    /** Announcement text; defaults to the locale's sort.position. */
    positionLabel?: (label: string, position: number, total: number) => string;
}
/** Item shape accepted by useSortable. */
export interface SortableItem {
    /** Stable id; rows carry it as data-sort-id. */
    id: Value;
}
/** Drag-to-reorder state and handlers returned by useSortable. */
export interface SortableControls<T extends SortableItem> {
    /** Items in the local order; render rows from it. */
    items: Ref<T[]>;
    /** Bind to the positioned list element whose direct children carry data-sort-id. */
    list: Ref<HTMLElement | null>;
    /** Id of the row being dragged. */
    draggingId: Ref<T["id"] | null>;
    /** Position announcement for a polite live region. */
    announcement: Ref<string>;
    /** Start dragging from a handle's pointerdown. @returns Nothing. */
    startDrag(event: PointerEvent, id: T["id"]): void;
    /** Move a row with the arrow keys from its handle. @returns Nothing. */
    onHandleKeydown(event: KeyboardEvent, id: T["id"]): void;
    /** Move a row by delta (-1 up, 1 down). @returns A promise that settles after the move. */
    move(id: T["id"], delta: number): Promise<void>;
}
/**
 * Drag, keyboard, and button reordering with FLIP animation. Call during setup.
 * @param source - Getter of the source order.
 * @param commit - Receives the ids in their new order.
 * @param label - Item name used in announcements.
 * @param options - Commit delay and announcement text.
 * @returns Local items, list ref, and handlers.
 */
export declare function useSortable<T extends SortableItem>(
    source: () => T[],
    commit: (ids: T["id"][]) => void,
    label: (item: T) => string,
    options?: SortableOptions,
): SortableControls<T>;
/** Shortcut map: combo string (e.g. "mod+s", "/", "mod+shift+p") to handler. */
export type HotkeyMap = Record<string, (event: KeyboardEvent) => void>;
/** Options of useHotkeys. */
export interface HotkeyOptions {
    /** Fire plain keys while typing in fields; mod combos always fire. @defaultValue false */
    inInputs?: boolean;
}
/**
 * Register window shortcuts while the calling component is mounted. Letters and digits
 * match physical keys, so shortcuts work under non-Latin layouts.
 * @param map - Combos and handlers.
 * @param options - Text-field behaviour.
 */
export declare function useHotkeys(map: HotkeyMap, options?: HotkeyOptions): void;
/** Hideable-column state returned by useColumnVisibility. */
export interface ColumnVisibility<C extends Column> {
    /** Visible columns in display order; pass to NDataTable. */
    columns: ComputedRef<C[]>;
    /** Optional columns; pass to NColumnPicker. */
    columnChoices: ComputedRef<C[]>;
    /** Hidden column keys; bind to NColumnPicker v-model:hidden. */
    hiddenColumns: Ref<string[]>;
}
/**
 * Optional table columns the user can hide, remembered in localStorage.
 * @param allColumns - All columns (array, ref, or getter).
 * @param optional - Keys the user may hide.
 * @param storageKey - localStorage key; empty keeps the choice in memory.
 * @returns Visible columns, picker choices, and hidden keys.
 */
export declare function useColumnVisibility<C extends Column>(
    allColumns: C[] | Ref<C[]> | (() => C[]),
    optional: string[],
    storageKey?: string,
): ColumnVisibility<C>;
/** Options of installEnterSubmit. */
export interface EnterSubmitOptions {
    /** Extra selector that stops the search for a submit button (e.g. the main area). */
    boundary?: string;
    /** Submit-button selector. @defaultValue "[data-enter-submit]" */
    submit?: string;
}
/**
 * Make Enter in a text field click the nearest [data-enter-submit] button
 * (Ctrl/⌘+Enter in multiline fields). A second call replaces the first.
 * @param options - Boundary and submit selectors.
 * @returns A function removing the listeners.
 */
export declare function installEnterSubmit(options?: EnterSubmitOptions): () => void;
