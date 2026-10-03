import { ReactNode } from "react";

import type { Option } from "~/config/creatorApplication";

export const fieldId = (name: string) => `creator-application-${name}`;
const errorId = (name: string) => `${fieldId(name)}-error`;
const hintId = (name: string) => `${fieldId(name)}-hint`;

const describedBy = (name: string, error?: string, hint?: ReactNode) =>
  [hint ? hintId(name) : null, error ? errorId(name) : null]
    .filter(Boolean)
    .join(" ") || undefined;

const inputClass = (error?: string) =>
  `block w-full rounded-xl border bg-white px-4 font-body text-base text-black placeholder:text-gray-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1 ${
    error ? "border-[#C8102E]" : "border-gray-300 hover:border-gray-400"
  }`;

const Label = ({
  name,
  children,
  optional,
}: {
  name: string;
  children: ReactNode;
  optional?: boolean;
}) => (
  <label htmlFor={fieldId(name)} className="mb-2 block font-body text-sm font-bold">
    {children}
    {optional && <span className="ml-1 font-normal text-gray-700">(optional)</span>}
  </label>
);

export const FieldError = ({ name, error }: { name: string; error?: string }) =>
  error ? (
    <p id={errorId(name)} className="mt-2 flex items-start gap-1.5 font-body text-sm text-[#C8102E]">
      <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor">
        <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm-.75 4a.75.75 0 0 1 1.5 0v4.5a.75.75 0 0 1-1.5 0V6ZM10 14.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
      </svg>
      {error}
    </p>
  ) : null;

const Hint = ({ name, children }: { name: string; children?: ReactNode }) =>
  children ? (
    <p id={hintId(name)} className="mt-2 font-body text-sm text-gray-700">
      {children}
    </p>
  ) : null;

interface BaseFieldProps {
  name: string;
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
}

export const TextField = ({
  name,
  label,
  error,
  hint,
  optional,
  value,
  onChange,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  maxLength,
  prefix,
}: BaseFieldProps & {
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "url";
  inputMode?: "text" | "email" | "url";
  autoComplete?: string;
  placeholder?: string;
  maxLength?: number;
  prefix?: string;
}) => (
  <div>
    <Label name={name} optional={optional}>
      {label}
    </Label>
    <div className="relative">
      {prefix && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-body text-base text-gray-500">
          {prefix}
        </span>
      )}
      <input
        id={fieldId(name)}
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        autoCapitalize={type === "text" && !prefix ? undefined : "none"}
        autoCorrect={type === "text" && !prefix ? undefined : "off"}
        spellCheck={type === "text" && !prefix}
        placeholder={placeholder}
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, error, hint)}
        className={`${inputClass(error)} h-12 ${prefix ? "pl-9" : ""}`}
      />
    </div>
    <Hint name={name}>{hint}</Hint>
    <FieldError name={name} error={error} />
  </div>
);

export const TextAreaField = ({
  name,
  label,
  error,
  hint,
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 4,
}: BaseFieldProps & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength: number;
  rows?: number;
}) => (
  <div>
    <Label name={name}>{label}</Label>
    <textarea
      id={fieldId(name)}
      name={name}
      rows={rows}
      placeholder={placeholder}
      maxLength={maxLength}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(name, error, hint)}
      className={`${inputClass(error)} resize-y py-3 leading-relaxed`}
    />
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <Hint name={name}>{hint}</Hint>
        <FieldError name={name} error={error} />
      </div>
      <p aria-hidden="true" className="mt-2 shrink-0 font-body text-xs text-gray-700">
        {value.length}/{maxLength}
      </p>
    </div>
  </div>
);

export const SelectField = ({
  name,
  label,
  error,
  hint,
  value,
  onChange,
  options,
  placeholder,
  autoComplete,
}: BaseFieldProps & {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  autoComplete?: string;
}) => (
  <div>
    <Label name={name}>{label}</Label>
    <div className="relative">
      <select
        id={fieldId(name)}
        name={name}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, error, hint)}
        className={`${inputClass(error)} h-12 appearance-none pr-10 ${value ? "" : "text-gray-500"}`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500">
        <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z" />
      </svg>
    </div>
    <Hint name={name}>{hint}</Hint>
    <FieldError name={name} error={error} />
  </div>
);

/** Radio (single) or checkbox (multiple) group rendered as tappable pills. */
export const ChoiceGroup = <T extends string>({
  name,
  label,
  error,
  hint,
  options,
  value,
  onChange,
  multiple,
}: BaseFieldProps & {
  options: readonly Option<T>[];
  value: T | T[];
  onChange: (value: T) => void;
  multiple?: boolean;
}) => {
  const selected = (optionValue: T) =>
    Array.isArray(value) ? value.includes(optionValue) : value === optionValue;

  return (
    <fieldset aria-describedby={describedBy(name, error, hint)}>
      <legend className="mb-2 block font-body text-sm font-bold">{label}</legend>
      {hint && (
        <p id={hintId(name)} className="-mt-1 mb-3 font-body text-sm text-gray-700">
          {hint}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => (
          <label key={option.value} className="relative cursor-pointer">
            <input
              id={index === 0 ? fieldId(name) : undefined}
              type={multiple ? "checkbox" : "radio"}
              name={name}
              value={option.value}
              checked={selected(option.value)}
              onChange={() => onChange(option.value)}
              aria-invalid={error ? true : undefined}
              className="peer sr-only"
            />
            <span
              className={`flex min-h-11 items-center gap-1.5 rounded-full border px-4 py-2 font-body text-sm transition-colors peer-checked:border-black peer-checked:bg-black peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-black peer-focus-visible:ring-offset-2 ${
                error ? "border-[#C8102E]" : "border-gray-300 hover:border-black"
              }`}
            >
              {multiple && selected(option.value) && (
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.79 6.8-6.8a1 1 0 0 1 1.4 0Z" />
                </svg>
              )}
              {option.label}
            </span>
          </label>
        ))}
      </div>
      <FieldError name={name} error={error} />
    </fieldset>
  );
};

export const CheckboxField = ({
  name,
  label,
  error,
  checked,
  onChange,
}: {
  name: string;
  label: ReactNode;
  error?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <div>
    <label
      htmlFor={fieldId(name)}
      className={`flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-4 transition-colors ${
        error ? "border-[#C8102E]" : checked ? "border-black" : "border-gray-300 hover:border-gray-400"
      }`}
    >
      <input
        id={fieldId(name)}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId(name) : undefined}
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
      />
      <span className="font-body text-sm leading-relaxed">{label}</span>
    </label>
    <FieldError name={name} error={error} />
  </div>
);
