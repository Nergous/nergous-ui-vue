<script setup>
import { ref, defineComponent, h } from "vue";
import * as ds from "@ds";
import { sanitizeHtml, safeUrl } from "@internal/utils/sanitize.ts";
const {
    NRichText,
    NButton,
    NFormField,
    NSelect,
    NSelectWithSearch,
    NPagination,
    NModal,
    NDrawer,
    NDropzone,
    NDataTable,
    NLightbox,
    NCommandPalette,
    NToaster,
    NDropdown,
    useScrollSpy,
} = ds;
const mode = new URLSearchParams(location.search).get("mode");
const html = ref(
    mode === "xss"
        ? '<img src="data:image/png,broken" onerror="window.auditXss=1">hello'
        : "hello",
);
const selected = ref("a"),
    page = ref(10),
    pages = ref(3),
    modal = ref(false),
    drawer = ref(false),
    scroll = ref(null);
const options = ref([
    { value: "a", label: "Alpha" },
    { value: "disabled", label: "Disabled", disabled: true },
    { value: "b", label: "Beta" },
]);
const spy = useScrollSpy(scroll, { offset: 60 });
const audit = (window.audit = {
    ds,
    html,
    page,
    pages,
    modal,
    drawer,
    spy,
    options,
    selected,
    sanitizeHtml,
    safeUrl,
    actions: 0,
    dropped: [],
    rowClicks: 0,
    selectedRows: ref([]),
    lightboxIndex: ref(0),
    commands: ref([{ label: "One" }, { label: "Two" }, { label: "Three" }]),
    ran: null,
    rows: ref(
        Array.from({ length: 20 }, (_, i) => ({
            id: i + 1,
            name: "Row " + (i + 1),
        })),
    ),
    disabled: ref(false),
});
const FakeLink = defineComponent({
    setup(_, { attrs, slots }) {
        return () =>
            h(
                "a",
                { ...attrs, href: "#router", onClick: () => audit.actions++ },
                slots.default?.(),
            );
    },
});
</script>
<template>
    <main style="padding: 20px">
        <h1>Regression fixture</h1>
        <template v-if="mode === 'xss' || mode === 'rte'"
            ><NFormField tag="div" label="Content"
                ><NRichText v-model="html" /></NFormField
        ></template>
        <template v-else-if="mode === 'button'">
            <NButton as="a" href="#activated" disabled @click="audit.actions++"
                >Disabled link</NButton
            >
            <NButton :as="FakeLink" loading>Loading router</NButton>
            <NButton @click="audit.actions++">Enabled button</NButton>
        </template>
        <template v-else-if="mode === 'select' || mode === 'select-basic'">
            <NFormField
                tag="div"
                label="City"
                hint="Choose city"
                error="Required"
                required
            >
                <component
                    :is="mode === 'select' ? NSelectWithSearch : NSelect"
                    v-model="selected"
                    :options="options"
                    :disabled="audit.disabled.value"
                /> </NFormField
            ><button id="after">After</button>
        </template>
        <template v-else-if="mode === 'pagination'"
            ><NPagination v-model:page="page" :pages="pages"
        /></template>
        <template v-else-if="['overlay', 'tall', 'unnamed'].includes(mode)">
            <button id="open" @click="drawer = true">Open drawer</button
            ><button id="open-modal" @click="modal = true">Open modal</button>
            <NDrawer
                v-model="drawer"
                :title="mode === 'unnamed' ? '' : 'Drawer'"
                dialog-label="Named panel"
                ><button id="inner" @click="modal = true">
                    Nested
                </button></NDrawer
            >
            <NModal
                v-model="modal"
                :title="mode === 'unnamed' ? '' : 'Modal'"
                dialog-label="Named dialog"
                width="800px"
            >
                <NFormField tag="div" label="Basic"
                    ><NSelect v-model="selected" :options="options"
                /></NFormField>
                <NFormField tag="div" label="Search"
                    ><NSelectWithSearch v-model="selected" :options="options"
                /></NFormField>
                <NDropdown :items="[{ label: 'Item' }]"
                    ><button>Actions</button></NDropdown
                >
                <div :style="mode === 'tall' ? 'height:1500px' : ''">
                    <button id="modal-action">Modal action</button>
                </div>
                <template #footer
                    ><NButton id="save" @click="modal = false"
                        >Save</NButton
                    ></template
                >
            </NModal>
        </template>
        <template v-else-if="mode === 'drop'"
            ><NDropzone
                :multiple="false"
                accept="image/png,.txt"
                @files="audit.dropped = $event.map((f) => f.name)"
        /></template>
        <template v-else-if="mode === 'table'"
            ><NDataTable
                :rows="audit.rows.value"
                :columns="[{ key: 'name', label: 'Name' }]"
                selectable
                :page-size="2"
                v-model:selected="audit.selectedRows.value"
                @row-click="audit.rowClicks++"
        /></template>
        <template v-else-if="mode === 'spy'"
            ><div
                ref="scroll"
                style="height: 200px; overflow: auto; position: relative"
            >
                <section data-spy="a" style="height: 300px">A</section>
                <section data-spy="b" style="height: 600px">B</section>
            </div></template
        >
        <template v-else-if="mode === 'lightbox'"
            ><NLightbox
                v-model:index="audit.lightboxIndex.value"
                :items="[
                    {
                        url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                        caption: 'One',
                    },
                    {
                        url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                        caption: 'Two',
                    },
                ]"
        /></template>
        <template v-else-if="mode === 'command'"
            ><NCommandPalette
                :model-value="true"
                :filter="false"
                :commands="audit.commands.value"
                @run="audit.ran = $event.label"
        /></template>
        <template v-else-if="mode === 'toaster'"><NToaster /></template>
        <template v-else><NButton>Mounted</NButton></template>
    </main>
</template>
