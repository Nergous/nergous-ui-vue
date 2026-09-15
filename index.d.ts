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

export type Value = string | number;
export type Tone = "neutral" | "accent" | "ok" | "warn" | "danger" | "info";
export type Theme = "light" | "dark";
export type Density = "compact" | "comfortable" | "spacious";
export interface Option {
    value: Value;
    label: string;
    disabled?: boolean;
}
export interface Section {
    value: Value;
    label: string;
    count?: number;
}
export interface Step {
    value: Value;
    label: string;
    sub?: string;
}
export interface Command {
    label: string;
    icon?: string;
    hint?: string;
    action?: () => void;
}
export interface DropdownItem {
    label?: string;
    icon?: string;
    danger?: boolean;
    divider?: boolean;
    selected?: boolean;
    action?: () => void;
}
export interface SidebarItem {
    id: Value;
    label: string;
    icon?: string;
    badge?: Value;
    href?: string;
    external?: boolean;
}
export type Row = Record<string, unknown>;
export interface Column {
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
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
type DefaultSlots = { default?: () => VNode[] };
export type UIComponent<
    P = {},
    E extends Record<string, unknown[]> = {},
    S = DefaultSlots,
    A = HTMLAttributes,
> = new () => {
    $props: P &
        Omit<A, keyof P> &
        VNodeProps &
        AllowedComponentProps &
        ComponentCustomProps &
        EventProps<E>;
    $emit: <K extends keyof E>(event: K, ...args: E[K]) => void;
    $slots: S;
};
type Model<T = Value> = { modelValue?: T };
type Update<T = Value> = { "update:modelValue": [value: T] };
type Field = { error?: boolean; disabled?: boolean; placeholder?: string };
type DialogProps = Model<boolean> & {
    title?: string;
    dialogLabel?: string;
    width?: string;
    closeLabel?: string;
};
type DialogEvents = Update<boolean> & { close: [] };
type DialogSlots = DefaultSlots & {
    footer?: (props: { close: () => void }) => VNode[];
};

export declare const NIcon: UIComponent<{
    name: string;
    size?: Value;
    title?: string;
}>;
export declare const NButton: UIComponent<{
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    tone?: "" | "accent" | "danger";
    icon?: string;
    loading?: boolean;
    disabled?: boolean;
    block?: boolean;
    type?: "button" | "submit" | "reset";
    as?: string | Component;
}>;
export declare const NFormField: UIComponent<{
    label?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    tag?: string;
    labelId?: string;
}>;
export declare const NInput: UIComponent<
    Model &
        Field & {
            type?: string;
            icon?: string;
            size?: "sm" | "md" | "lg";
            revealLabel?: string;
            hideLabel?: string;
            modelModifiers?: { number?: boolean; trim?: boolean };
        },
    Update,
    DefaultSlots,
    InputHTMLAttributes
>;
export declare const NTextarea: UIComponent<
    Model & Field & { rows?: Value; modelModifiers?: { trim?: boolean } },
    Update,
    DefaultSlots,
    TextareaHTMLAttributes
>;
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
export declare const NRichText: UIComponent<
    Model<string> & Field & { labels?: RichTextLabels; tools?: RichTextTool[] },
    Update<string>
>;
export declare const NSelect: UIComponent<
    Model & Field & { options?: Option[] },
    Update
>;
export declare const NSelectWithSearch: UIComponent<
    Model &
        Field & {
            options?: Option[];
            searchPlaceholder?: string;
            noResultsText?: string;
        },
    Update
>;
export declare const NCheckbox: UIComponent<
    Model<boolean> & {
        indeterminate?: boolean;
        disabled?: boolean;
        ariaLabel?: string;
    },
    Update<boolean>
>;
export declare const NSwitch: UIComponent<
    Model<boolean> & { disabled?: boolean },
    Update<boolean>
>;
export declare const NRadioGroup: UIComponent<
    Model & { options?: Option[] },
    Update
>;
export declare const NSegmented: UIComponent<
    Model & { options?: Option[] },
    Update
>;
export declare const NDropzone: UIComponent<
    {
        accept?: string;
        multiple?: boolean;
        title?: string;
        orLabel?: string;
        browseLabel?: string;
        hint?: string;
    },
    { files: [files: File[]] }
>;
export declare const NBadge: UIComponent<{
    tone?: Tone;
    dot?: boolean;
    swatch?: string;
    pill?: boolean;
    size?: "md" | "sm";
}>;
export declare const NAvatar: UIComponent<{
    name?: string;
    src?: string;
    size?: number;
    status?: "" | "online" | "busy" | "away";
    square?: boolean;
    alt?: string;
}>;
export declare const NAvatarGroup: UIComponent<{
    items?: string[];
    max?: number;
    size?: number;
}>;
export declare const NCard: UIComponent<{ padding?: string; hover?: boolean }>;
export declare const NStatCard: UIComponent<{
    label?: string;
    value?: Value;
    sub?: string;
    delta?: string;
    trend?: "up" | "down";
    spark?: number[];
    icon?: string;
}>;
export declare const NActivityRow: UIComponent<{
    tone?: Tone;
    icon?: string;
    actor?: string;
    verb?: string;
    object?: string;
    tag?: string;
    time?: string;
    meta?: string;
}>;
export declare const NTabs: UIComponent<
    Model & { tabs?: Option[]; idBase?: string },
    Update
>;
export declare const NPagination: UIComponent<
    { page?: number; pages?: number; prevLabel?: string; nextLabel?: string },
    { "update:page": [page: number] }
>;
export declare const NDataTable: UIComponent<
    {
        columns?: Column[];
        rows?: Row[];
        rowKey?: string;
        selectable?: boolean;
        selected?: Value[];
        pageSize?: number;
        hover?: boolean;
        manualSort?: boolean;
        sortKey?: string;
        sortDir?: "asc" | "desc";
        emptyText?: string;
        clearLabel?: string;
        selectionLabel?: (n: number) => string;
        rangeLabel?: (from: number, to: number, total: number) => string;
        selectAllLabel?: string;
        selectRowLabel?: string;
        rowLabel?: ((row: Row) => string) | null;
        rowClass?:
            ((row: Row) => string | string[] | Record<string, boolean>) | null;
    },
    {
        "update:selected": [keys: Value[]];
        "row-click": [row: Row];
        "sort-change": [sort: { key: string; dir: "asc" | "desc" }];
    },
    {
        bulk?: (props: { selected: Value[]; clear: () => void }) => VNode[];
        empty?: () => VNode[];
    } & {
        [key: `cell-${string}`]:
            ((props: { row: Row; value: unknown }) => VNode[]) | undefined;
    }
>;
export declare const NAlert: UIComponent<{
    tone?: Tone;
    title?: string;
    icon?: string;
    role?: string;
}>;
export declare const NToaster: UIComponent<{
    regionLabel?: string;
    dismissLabel?: string;
}>;
export declare const NProgress: UIComponent<{
    value?: number;
    label?: string;
    showValue?: boolean;
    tone?: Tone;
}>;
export declare const NSpinner: UIComponent<{
    size?: number;
    width?: number;
    label?: string;
}>;
export declare const NSkeleton: UIComponent<{
    width?: string;
    height?: string;
    radius?: string;
    circle?: boolean;
}>;
export declare const NTooltip: UIComponent<{
    content?: string;
    placement?: "top" | "bottom" | "left" | "right";
}>;
export declare const NEmptyState: UIComponent<{
    icon?: string;
    title?: string;
    description?: string;
}>;
export declare const NModal: UIComponent<
    DialogProps,
    DialogEvents,
    DialogSlots
>;
export declare const NDrawer: UIComponent<
    DialogProps & { subtitle?: string },
    DialogEvents,
    DialogSlots
>;
export declare const NLightbox: UIComponent<
    {
        items?: { url: string; caption?: string }[];
        index?: number;
        dialogLabel?: string;
        closeLabel?: string;
        prevLabel?: string;
        nextLabel?: string;
    },
    { "update:index": [index: number] }
>;
export declare const NDropdown: UIComponent<
    { items?: DropdownItem[]; align?: "left" | "right" },
    { select: [item: DropdownItem] },
    { default?: (props: { open: boolean }) => VNode[] }
>;
export declare const NCommandPalette: UIComponent<
    Model<boolean> & {
        commands?: Command[];
        placeholder?: string;
        emptyText?: string;
        navHint?: string;
        selectHint?: string;
        shortcut?: boolean;
        filter?: boolean;
    },
    Update<boolean> & {
        run: [command: Command];
        "update:query": [query: string];
    }
>;
export declare const NSidebar: UIComponent<
    Model & {
        groups?: { label?: string; items: SidebarItem[] }[];
        collapsed?: boolean;
        mobile?: boolean;
        brand?: { name?: string; sub?: string; glyph?: string };
        linkAs?: Component;
        navLabel?: string;
    },
    Update & {
        "update:collapsed": [collapsed: boolean];
        navigate: [item: SidebarItem];
    },
    { footer?: (props: { collapsed: boolean }) => VNode[] }
>;
export declare const NTopbar: UIComponent<
    {
        title?: string;
        subtitle?: string;
        collapsible?: boolean;
        titleTag?: string;
        toggleLabel?: string;
    },
    { toggle: [] },
    DefaultSlots & { left?: () => VNode[]; right?: () => VNode[] }
>;
export declare const NBrand: UIComponent<{
    glyph?: string;
    name?: string;
    sub?: string;
    size?: "sm" | "md" | "lg";
    showSub?: boolean;
}>;
export declare const NStepper: UIComponent<
    Model & { steps?: Step[]; completed?: Value[] | null; navLabel?: string },
    Update
>;
type WizardBody = { step: Step | null; index: number; count: number };
export declare const NWizard: UIComponent<
    Model & {
        steps?: Step[];
        completed?: Value[] | null;
        title?: string;
        progress?: boolean;
        navLabel?: string;
    },
    Update,
    {
        default?: (props: WizardBody) => VNode[];
        footer?: (
            props: Omit<WizardBody, "step"> & {
                isFirst: boolean;
                isLast: boolean;
                prev: () => void;
                next: () => void;
                goTo: (value: Value) => void;
            },
        ) => VNode[];
    }
>;
export declare const NAnchorNav: UIComponent<
    Model & { sections?: Section[]; navLabel?: string },
    Update
>;
export declare const NAnchoredForm: UIComponent<
    Model & {
        sections?: Section[];
        sectionsLabel?: string;
        height?: string;
        offset?: number;
        navLabel?: string;
    },
    Update,
    {
        header?: () => VNode[];
        status?: () => VNode[];
        savebar?: () => VNode[];
    } & {
        [key: `section-${string}`]:
            | ((props: { section: Section; index: number }) => VNode[])
            | undefined;
    }
>;

export declare const THEME_STORAGE_KEY: "nergous-ui-vue-theme";
export declare const DENSITY_STORAGE_KEY: "nergous-ui-vue-density";
export declare function useTheme(): {
    theme: Ref<Theme>;
    density: Ref<Density>;
    toggle(): void;
    setTheme(value: Theme): void;
    setDensity(value: Density): void;
};
export interface ToastOptions {
    tone?: "ok" | "info" | "warn" | "danger";
    title?: string;
    msg?: string;
    duration?: number;
}
export interface Toast extends ToastOptions {
    id: number;
    remaining: number;
    startedAt: number;
}
export declare function useToast(): {
    toasts: Toast[];
    push(options: string | ToastOptions): number;
    dismiss(id: number): void;
    pauseAll(): void;
    resumeAll(): void;
    success(title: string, msg?: string): number;
    error(title: string, msg?: string): number;
    warning(title: string, msg?: string): number;
    info(title: string, msg?: string): number;
};
export declare function useScrollSpy(
    container: Ref<HTMLElement | null> | (() => HTMLElement | null),
    options?: { offset?: number | (() => number) },
): {
    active: Ref<string | null>;
    scrollTo(value: Value): void;
    recompute(): void;
};
export declare function toDate(
    value: string | number | Date | null | undefined,
): Date | null;
export declare function createFormat(locale?: string | string[]): {
    toDate: typeof toDate;
    formatDateTime(value: Parameters<typeof toDate>[0]): string;
    formatDateShort(value: Parameters<typeof toDate>[0]): string;
    formatRelative(value: Parameters<typeof toDate>[0]): string;
    formatNumber(value: string | number | null | undefined): string;
};
