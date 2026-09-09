/** Small controlled form controls shared by the property panel and settings modal. */

import type { ReactNode } from 'react'

interface FieldShellProps {
  label: ReactNode
  hint?: ReactNode
  children: ReactNode
}

function FieldShell({ label, hint, children }: FieldShellProps) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  )
}

interface NumberFieldProps {
  label: ReactNode
  value: number
  onChange: (value: number) => void
  min?: number
  step?: number
  suffix?: ReactNode
  hint?: ReactNode
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  step = 1,
  suffix,
  hint,
}: NumberFieldProps) {
  return (
    <FieldShell label={label} hint={hint}>
      <span className="field__control">
        <input
          className="field__input"
          type="number"
          value={Number.isFinite(value) ? value : ''}
          min={min}
          step={step}
          onChange={(event) => {
            const next = event.target.valueAsNumber
            if (!Number.isNaN(next)) onChange(next)
          }}
        />
        {suffix ? <span className="field__suffix">{suffix}</span> : null}
      </span>
    </FieldShell>
  )
}

interface TextFieldProps {
  label: ReactNode
  value: string
  onChange: (value: string) => void
}

export function TextField({ label, value, onChange }: TextFieldProps) {
  return (
    <FieldShell label={label}>
      <input
        className="field__input"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldShell>
  )
}

interface SelectFieldProps<T extends string> {
  label: ReactNode
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: SelectFieldProps<T>) {
  return (
    <FieldShell label={label}>
      <select
        className="field__input"
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}

interface CheckboxFieldProps {
  label: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
}

export function CheckboxField({ label, checked, onChange }: CheckboxFieldProps) {
  return (
    <label className="field field--checkbox">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  )
}
