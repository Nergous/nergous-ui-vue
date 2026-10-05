// Locale provider: an app sets its component language once instead of passing
// labels to every component. Resolution order for each label:
//   explicit prop → provided dictionary → built-in English default.
//
// Usage (whole app):      app.use(createLocale(ruMessages))
// Usage (subtree/switch): provideLocale(() => (lang.value === "ru" ? ruMessages : {}))
// Usage (own component):  const t = useMessages(); t.value["confirm.cancel"]
import {
    computed,
    inject,
    provide,
    toValue,
    type App,
    type ComputedRef,
    type InjectionKey,
    type MaybeRefOrGetter,
} from "vue";
import { enMessages, type Messages } from "../locales/en.ts";

/** Partial dictionary accepted by the providers; missing keys use English. */
export type MessagesInput = Partial<Messages>;

type Source = () => MessagesInput;

const LOCALE_KEY: InjectionKey<Source> = Symbol("nergous-ui-vue-locale");

function merge(outer: MessagesInput, own: MessagesInput): MessagesInput {
    return { ...outer, ...own, richText: { ...outer.richText, ...own.richText } };
}

/**
 * Provide a dictionary to the calling component's subtree. Call during setup.
 * Keys merge over an outer provider, so a nested provider may override a few.
 * @param messages - Dictionary, ref, or getter; reactive sources switch language live.
 */
export function provideLocale(messages: MaybeRefOrGetter<MessagesInput>): void {
    const parent = inject(LOCALE_KEY, null);
    provide(LOCALE_KEY, () => merge(parent ? parent() : {}, toValue(messages)));
}

/**
 * Create an app plugin that provides a dictionary to the whole app.
 * @param messages - Dictionary, ref, or getter.
 * @returns A plugin for app.use().
 */
export function createLocale(messages: MaybeRefOrGetter<MessagesInput>): {
    install(app: App): void;
} {
    return {
        install(app: App) {
            app.provide(LOCALE_KEY, () => toValue(messages));
        },
    };
}

/**
 * Read the effective dictionary (provided keys over English). Call during setup.
 * @returns A computed dictionary with every key present.
 */
export function useMessages(): ComputedRef<Messages> {
    const source = inject(LOCALE_KEY, null);
    return computed(() => merge(enMessages, source ? source() : {}) as Messages);
}

type LabelMap<P> = { [K in keyof P]?: keyof Messages };
type Resolved<P, M> = {
    [K in keyof M & keyof P]-?: Exclude<P[K], undefined | null>;
};

/**
 * Internal: resolve label props against the dictionary. A prop left undefined
 * falls back to its message; an explicit value (even "") wins.
 */
export function useLabels<P extends object, M extends LabelMap<P>>(
    props: P,
    map: M,
): ComputedRef<Resolved<P, M>> {
    const messages = useMessages();
    return computed(() => {
        const out: Record<string, unknown> = {};
        for (const key of Object.keys(map)) {
            const own = (props as Record<string, unknown>)[key];
            const id = map[key as keyof M] as keyof Messages;
            out[key] = own ?? messages.value[id];
        }
        return out as Resolved<P, M>;
    });
}
