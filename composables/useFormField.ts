// Contract between NFormField and the form controls nested in its slot. The
// field provides ARIA wiring — the described-by message id, invalid/required
// state, and a label id when the field is not a <label> — and controls inject it
// to set the matching aria-* attributes without the call site repeating them.
// useFormField() returns null when a control is used outside any NFormField.
import { provide, inject, type ComputedRef, type InjectionKey } from "vue";

export interface FormFieldContext {
    labelledby: ComputedRef<string | undefined>;
    describedBy: ComputedRef<string | undefined>;
    invalid: ComputedRef<boolean>;
    required: ComputedRef<boolean>;
}

const FORM_FIELD_KEY: InjectionKey<FormFieldContext> = Symbol("n-form-field");

export function provideFormField(ctx: FormFieldContext) {
    provide(FORM_FIELD_KEY, ctx);
}

export function useFormField(): FormFieldContext | null {
    return inject(FORM_FIELD_KEY) ?? null;
}
