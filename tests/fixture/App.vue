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
    NMultiSelect,
    NPopover,
    NFilterChips,
    NActionBar,
    NConfirmDialog,
    NSortHandle,
    NToolbar,
    NBreadcrumbs,
    NColumnPicker,
    NIconTooltip,
    NSidebar,
    NInput,
    useScrollSpy,
    provideLocale,
    ruMessages,
    useConfirm,
    useSortable,
    useHotkeys,
    installEnterSubmit,
} = ds;
const mode = new URLSearchParams(location.search).get("mode");
if (mode === "locale") provideLocale(ruMessages);
if (mode === "kit") {
    installEnterSubmit();
    useHotkeys({ "mod+k": () => audit.hotkeys++, "/": () => audit.slash++ });
}
const html = ref(
    mode === "xss"
        ? '<img src="data:image/png,broken" onerror="window.auditXss=1">hello'
        : "hello",
);
// Full-preset editor pickers resolve immediately (stand-ins for a media library).
const pickImage = async () => ({ src: "/picked.png", alt: "Picked" });
const pickLink = async () => ({ href: "/files/doc.pdf", text: "doc.pdf" });
// Sidebar brand logo: a valid inline SVG; tests swap it for a broken URL.
const sidebarLogo = ref(
    "data:image/svg+xml," +
        encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="red"/></svg>',
        ),
);
const selected = ref("a"),
    page = ref(10),
    pages = ref(3),
    pageSize = ref(10),
    parentSubmits = ref(0),
    modal = ref(false),
    drawer = ref(false),
    scroll = ref(null);
const pageRoot = ref(null);
const pageSpy = useScrollSpy(pageRoot, { scroller: "ancestor", offset: 0 });
const confirm = useConfirm();
const sortSource = ref([
    { id: 1, title: "One" },
    { id: 2, title: "Two" },
    { id: 3, title: "Three" },
]);
const {
    items: sortRows,
    list: sortList,
    announcement,
    startDrag,
    onHandleKeydown,
} = useSortable(
    () => sortSource.value,
    (ids) => {
        audit.committed = ids;
        sortSource.value = ids.map((id) => sortSource.value.find((i) => i.id === id));
    },
    (item) => item.title,
    { commitDelay: 0 },
);
const name = ref("");
const options = ref([
    { value: "a", label: "Alpha" },
    { value: "disabled", label: "Disabled", disabled: true },
    { value: "b", label: "Beta" },
]);
const spy = useScrollSpy(scroll, { offset: 60 });
const audit = (window.audit = {
    ds,
    html,
    sidebarLogo,
    page,
    pages,
    pageSize,
    parentSubmits,
    modal,
    drawer,
    spy,
    pageSpy,
    confirm,
    multi: ref([]),
    hidden: ref([]),
    chips: ref([
        { key: "type", label: "Type", value: "Article" },
        { key: "status", label: "Status", value: "Draft" },
    ]),
    removed: [],
    resets: 0,
    hotkeys: 0,
    slash: 0,
    enterSubmits: 0,
    committed: null,
    confirmed: null,
    cancels: 0,
    allMatching: ref(false),
    total: ref(5),
    popoverOpen: false,
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
        <template v-else-if="mode === 'rte-full'"
            ><NFormField tag="div" label="Content"
                ><NRichText
                    v-model="html"
                    preset="full"
                    :pick-image="pickImage"
                    :pick-link="pickLink" /></NFormField
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
            ><form @submit.prevent="parentSubmits++">
                <NPagination
                    v-model:page="page"
                    v-model:page-size="pageSize"
                    :pages="pages"
                    :page-sizes="[10, 25, 50]"
                    jumpable
                />
            </form>
        </template>
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
        <template v-else-if="mode === 'kit' || mode === 'locale'">
            <NIconTooltip :delay="0" />
            <NBreadcrumbs
                :items="[
                    { label: 'Home', href: '/' },
                    { label: 'Posts', href: '/posts' },
                    { label: 'Edit post' },
                ]"
            />
            <NToolbar>
                <template #search
                    ><input aria-label="Search list" class="list-search"
                /></template>
                <NMultiSelect
                    v-model="audit.multi.value"
                    :options="options"
                    label="Letters"
                    search
                />
                <NSelect
                    v-model="selected"
                    :options="options"
                    aria-label="Sort order"
                />
                <NColumnPicker
                    v-model:hidden="audit.hidden.value"
                    :columns="[
                        { key: 'a', label: 'Author' },
                        { key: 'b', label: 'Updated' },
                    ]"
                />
                <template #actions
                    ><NButton
                        icon="bell"
                        aria-label="Notifications, 3 unread"
                        :badge="3"
                /></template>
            </NToolbar>
            <NFilterChips
                :filters="audit.chips.value"
                @remove="audit.removed.push($event)"
                @reset="audit.resets++"
            />
            <NPopover label="Export" @update:open="audit.popoverOpen = $event"
                ><template #default="{ close }"
                    ><button id="pop-inner" type="button" @click="close(true)">
                        Inner action
                    </button></template
                ></NPopover
            >
            <ul
                ref="sortList"
                style="position: relative; list-style: none; padding: 0"
            >
                <li
                    v-for="item in sortRows"
                    :key="item.id"
                    :data-sort-id="item.id"
                    style="display: flex; gap: 8px; align-items: center"
                >
                    <NSortHandle
                        :label="'Move ' + item.title"
                        @pointerdown="startDrag($event, item.id)"
                        @keydown="onHandleKeydown($event, item.id)"
                    />{{ item.title }}
                </li>
            </ul>
            <p id="sort-status" aria-live="polite">{{ announcement }}</p>
            <div data-enter-scope>
                <NFormField label="Name"><NInput v-model="name" /></NFormField>
                <NButton data-enter-submit @click="audit.enterSubmits++"
                    >Save name</NButton
                >
            </div>
            <NButton id="ask" variant="danger" @click="confirm.ask({ id: 7 })"
                >Delete</NButton
            >
            <NConfirmDialog
                v-model="confirm.open"
                danger
                message="Delete it?"
                :loading="confirm.loading"
                @confirm="confirm.run((p) => (audit.confirmed = p.id))"
                @cancel="audit.cancels++"
            />
            <NPagination :page="2" :pages="3" />
            <NPagination :page="2" :pages="3" next-label="Explicit next" />
            <NActionBar dirty><NButton>Save changes</NButton></NActionBar>
        </template>
        <template v-else-if="mode === 'table-matching'"
            ><NDataTable
                v-model:selected="audit.selectedRows.value"
                v-model:all-matching="audit.allMatching.value"
                :rows="audit.rows.value.slice(0, 2)"
                :columns="[
                    { key: 'id', label: 'ID' },
                    { key: 'name', label: 'Name' },
                ]"
                :total="20"
                selectable
                stacked
        /></template>
        <template v-else-if="mode === 'pager-hide'"
            ><NPagination
                :pages="1"
                :page-size="25"
                :page-sizes="[10, 25]"
                :total="audit.total.value"
                hide-on-single-page
        /></template>
        <template v-else-if="mode === 'page-spy'"
            ><div ref="pageRoot">
                <section data-spy="a" style="height: 900px">A</section>
                <section data-spy="b" style="height: 900px">B</section>
                <section data-spy="c" style="height: 120px">C</section>
            </div></template
        >
        <template v-else-if="mode === 'sidebar'"
            ><NSidebar
                :brand="{
                    name: 'Fixture',
                    glyph: 'F',
                    logo: sidebarLogo,
                }"
                :groups="[
                    {
                        items: [
                            { id: 'docs', label: 'Docs', href: '/docs' },
                            { id: 'home', label: 'Home', badge: 4 },
                        ],
                    },
                ]"
        /></template>
        <template v-else><NButton>Mounted</NButton></template>
    </main>
</template>
