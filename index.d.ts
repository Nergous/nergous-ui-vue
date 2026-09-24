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
    | "clear";
/** Localized NRichText labels keyed by toolbar command or dialog control. */
export type RichTextLabels = Partial<
    Record<
        | RichTextTool
        | "toolbar"
        | "linkPrompt"
        | "linkTitle"
        | "linkConfirm"
        | "linkCancel"
        | "linkRemove",
        string
    >
>;
/** Sanitizing rich-text input backed by contenteditable. */
export declare const NRichText: UIComponent<
    Model<string> &
        Field & {
            /** Partial toolbar and link-dialog labels. */
            labels?: RichTextLabels;
            /** Enabled toolbar commands. An empty list enables all commands. */
            tools?: RichTextTool[];
        },
    Update<string>
>;
/** Themeable single-select listbox. */
export declare const NSelect: UIComponent<
    Model &
        Field & {
            /** Selectable options. */
            options?: Option[];
        },
    Update
>;
/** Themeable single-select listbox with client-side search. */
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
        /** Build an accessible name for an interactive row. */
        rowLabel?: ((row: Row) => string) | null;
        /** Add class bindings to each row. */
        rowClass?:
            ((row: Row) => string | string[] | Record<string, boolean>) | null;
    },
    {
        /** Updated selected row keys. */
        "update:selected": [keys: Value[]];
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
        };
        /** Component used to render items with href. */
        linkAs?: Component;
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
}
/**
 * Create locale-bound Intl formatters.
 * @param locale - BCP 47 locale identifier or preference list.
 * @returns Cached date, relative-time, and number formatters.
 */
export declare function createFormat(locale?: string | string[]): Formatters;
