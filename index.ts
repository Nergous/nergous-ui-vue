/**
 * Public Vue 3 source-package entry point with named exports; no app.use plugin.
 * Import components, composables, and formatters from "nergous-ui-vue".
 *
 * Evaluation loads global design-token CSS and evaluates the theme module, which
 * reads persisted settings and updates document-root attributes when available.
 * Theme and toast state are module singletons shared by consumers of this entry.
 * Function contracts are documented at their source declarations; component
 * contracts are documented alongside their props.
 * @packageDocumentation
 */
import "./styles/tokens.css";

import NIcon from "./components/primitives/NIcon.vue";

import NButton from "./components/forms/NButton.vue";
import NFormField from "./components/forms/NFormField.vue";
import NInput from "./components/forms/NInput.vue";
import NTextarea from "./components/forms/NTextarea.vue";
import NRichText from "./components/forms/NRichText.vue";
import NSelect from "./components/forms/NSelect.vue";
import NSelectWithSearch from "./components/forms/NSelectWithSearch.vue";
import NCheckbox from "./components/forms/NCheckbox.vue";
import NRadioGroup from "./components/forms/NRadioGroup.vue";
import NSwitch from "./components/forms/NSwitch.vue";
import NSegmented from "./components/forms/NSegmented.vue";
import NDropzone from "./components/forms/NDropzone.vue";
import NDatePicker from "./components/forms/NDatePicker.vue";

import NBadge from "./components/data-display/NBadge.vue";
import NAvatar from "./components/data-display/NAvatar.vue";
import NAvatarGroup from "./components/data-display/NAvatarGroup.vue";
import NCard from "./components/data-display/NCard.vue";
import NStatCard from "./components/data-display/NStatCard.vue";
import NActivityRow from "./components/data-display/NActivityRow.vue";
import NTabs from "./components/data-display/NTabs.vue";
import NDataTable from "./components/data-display/NDataTable.vue";
import NPagination from "./components/data-display/NPagination.vue";

import NAlert from "./components/feedback/NAlert.vue";
import NToaster from "./components/feedback/NToaster.vue";
import NProgress from "./components/feedback/NProgress.vue";
import NSpinner from "./components/feedback/NSpinner.vue";
import NSkeleton from "./components/feedback/NSkeleton.vue";
import NTooltip from "./components/feedback/NTooltip.vue";
import NEmptyState from "./components/feedback/NEmptyState.vue";

import NModal from "./components/overlays/NModal.vue";
import NDrawer from "./components/overlays/NDrawer.vue";
import NDropdown from "./components/overlays/NDropdown.vue";
import NCommandPalette from "./components/overlays/NCommandPalette.vue";
import NLightbox from "./components/overlays/NLightbox.vue";

import NSidebar from "./components/navigation/NSidebar.vue";
import NTopbar from "./components/navigation/NTopbar.vue";
import NBrand from "./components/navigation/NBrand.vue";
import NStepper from "./components/navigation/NStepper.vue";
import NWizard from "./components/navigation/NWizard.vue";
import NAnchorNav from "./components/navigation/NAnchorNav.vue";
import NAnchoredForm from "./components/navigation/NAnchoredForm.vue";
import NMultiSelect from "./components/forms/NMultiSelect.vue";
import NActionBar from "./components/forms/NActionBar.vue";
import NSortHandle from "./components/forms/NSortHandle.vue";
import NFilterChips from "./components/data-display/NFilterChips.vue";
import NColumnPicker from "./components/data-display/NColumnPicker.vue";
import NIconTooltip from "./components/feedback/NIconTooltip.vue";
import NPopover from "./components/overlays/NPopover.vue";
import NConfirmDialog from "./components/overlays/NConfirmDialog.vue";
import NToolbar from "./components/navigation/NToolbar.vue";
import NBreadcrumbs from "./components/navigation/NBreadcrumbs.vue";

import {
    useTheme,
    THEME_STORAGE_KEY,
    DENSITY_STORAGE_KEY,
} from "./composables/useTheme.ts";
import { useToast } from "./composables/useToast.ts";
import { useScrollSpy } from "./composables/useScrollSpy.ts";
import {
    provideLocale,
    createLocale,
    useMessages,
} from "./composables/useLocale.ts";
import { enMessages } from "./locales/en.ts";
import { ruMessages } from "./locales/ru.ts";
import { useConfirm } from "./composables/useConfirm.ts";
import { useSortable } from "./composables/useSortable.ts";
import { useHotkeys } from "./composables/useHotkeys.ts";
import { useColumnVisibility } from "./composables/useColumnVisibility.ts";
import { installEnterSubmit } from "./composables/enterSubmit.ts";
import { createFormat, toDate } from "./utils/format.ts";

export {
    NIcon,
    NButton,
    NFormField,
    NInput,
    NSelect,
    NSelectWithSearch,
    NTextarea,
    NRichText,
    NSwitch,
    NCheckbox,
    NRadioGroup,
    NSegmented,
    NBadge,
    NAvatar,
    NAvatarGroup,
    NCard,
    NAlert,
    NTabs,
    NModal,
    NDrawer,
    NToaster,
    NSidebar,
    NTopbar,
    NDataTable,
    NPagination,
    NStatCard,
    NActivityRow,
    NDropzone,
    NDatePicker,
    NEmptyState,
    NProgress,
    NSkeleton,
    NSpinner,
    NTooltip,
    NDropdown,
    NCommandPalette,
    NLightbox,
    NBrand,
    NStepper,
    NWizard,
    NAnchorNav,
    NAnchoredForm,
    NMultiSelect,
    NActionBar,
    NSortHandle,
    NFilterChips,
    NColumnPicker,
    NIconTooltip,
    NPopover,
    NConfirmDialog,
    NToolbar,
    NBreadcrumbs,
    useTheme,
    THEME_STORAGE_KEY,
    DENSITY_STORAGE_KEY,
    useToast,
    useScrollSpy,
    provideLocale,
    createLocale,
    useMessages,
    enMessages,
    ruMessages,
    useConfirm,
    useSortable,
    useHotkeys,
    useColumnVisibility,
    installEnterSubmit,
    createFormat,
    toDate,
};
