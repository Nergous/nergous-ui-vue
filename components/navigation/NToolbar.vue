<script setup lang="ts">
// NToolbar — list toolbar row: the #search slot takes the free space, the
// default slot holds filters (selects keep their width), #actions sit at the
// far end (e.g. the add button). Wraps on narrow screens.
</script>

<template>
    <div class="n-toolbar">
        <div v-if="$slots.search" class="n-toolbar__search">
            <slot name="search" />
        </div>
        <slot />
        <div v-if="$slots.actions" class="n-toolbar__actions">
            <slot name="actions" />
        </div>
    </div>
</template>

<style scoped>
.n-toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}
.n-toolbar__search {
    flex: 1;
    min-width: 220px;
}
.n-toolbar__actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 10px;
}
/* Selects keep a usable width next to the search field. */
.n-toolbar > :slotted(.n-select),
.n-toolbar > :slotted(.n-selects),
.n-toolbar > :slotted(.n-ms) {
    flex: none;
    min-width: 150px;
}
</style>
