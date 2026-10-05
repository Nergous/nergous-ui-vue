<script setup lang="ts">
import type { Component, PropType } from "vue";
import { useLabels } from "../../composables/useLocale.ts";

// NBreadcrumbs — page location trail: nav > ol, "/" separators, the last item
// is the current page (aria-current, not a link). Items with href render as
// `linkAs` (an element name or a router link component, default <a>); items
// without href render as plain text.
interface Crumb {
    label: string;
    href?: string;
}

const props = defineProps({
    items: {
        type: Array as PropType<Crumb[]>,
        default: () => [],
    },
    linkAs: {
        type: [String, Object, Function] as PropType<string | Component>,
        default: "a",
    },
    navLabel: { type: String, default: undefined },
});
// Labels: prop → provided locale (useLocale) → English default.
const lbl = useLabels(props, { navLabel: "breadcrumbs.label" });
</script>

<template>
    <nav v-if="items.length" class="n-crumbs" :aria-label="lbl.navLabel">
        <ol class="n-crumbs__list">
            <li v-for="(item, i) in items" :key="i" class="n-crumbs__item">
                <span v-if="i === items.length - 1" class="n-crumbs__current" aria-current="page">{{
                    item.label
                }}</span>
                <component :is="linkAs" v-else-if="item.href" :href="item.href" class="n-crumbs__link">{{
                    item.label
                }}</component>
                <span v-else class="n-crumbs__text">{{ item.label }}</span>
            </li>
        </ol>
    </nav>
</template>

<style scoped>
.n-crumbs__list {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 12.5px;
}
.n-crumbs__item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    color: var(--text-3);
}
.n-crumbs__item + .n-crumbs__item::before {
    content: "/";
    color: var(--border-2);
}
.n-crumbs__link {
    color: var(--text-2);
    text-decoration: none;
    border-radius: 4px;
}
.n-crumbs__link:hover {
    color: var(--accent-ink);
    text-decoration: underline;
}
.n-crumbs__link:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
}
.n-crumbs__current {
    overflow: hidden;
    max-width: 40ch;
    color: var(--text);
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
