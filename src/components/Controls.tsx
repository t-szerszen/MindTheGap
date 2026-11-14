import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react'
import { useId } from 'react'
import { Icon } from './Icon'
import type { NoteColor } from './Paper'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'plain' | 'primary' | 'mint' | 'pink' | 'blue'
  size?: 'sm'
  block?: boolean
}

export function Button({
  variant = 'plain',
  size,
  block,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  const cls = [
    'btn',
    variant !== 'plain' && `btn-${variant}`,
    size && `btn-${size}`,
    block && 'btn-block',
    className,
  ]
  return <button type={type} className={cls.filter(Boolean).join(' ')} {...rest} />
}

export function Tag({ color, children }: { color?: NoteColor; children: ReactNode }) {
  return <span className={`tag${color ? ` tg-${color}` : ''}`}>{children}</span>
}

export function TagButton({
  pressed,
  color,
  onClick,
  children,
}: {
  pressed?: boolean
  color?: NoteColor
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={`tag tap${color ? ` tg-${color}` : ''}`}
      aria-pressed={pressed}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; hideLabel?: boolean }

export function LineField({ label, hideLabel, id, className, ...rest }: FieldProps) {
  const auto = useId()
  const fieldId = id ?? auto
  return (
    <div className={className}>
      <label className={hideLabel ? 'sr' : 'field-label'} htmlFor={fieldId}>
        {label}
      </label>
      <input id={fieldId} className="line-input" {...rest} />
    </div>
  )
}

type AreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }

export function LineArea({ label, id, className, ...rest }: AreaProps) {
  const auto = useId()
  const fieldId = id ?? auto
  return (
    <div className={className}>
      <label className="field-label" htmlFor={fieldId}>
        {label}
      </label>
      <textarea id={fieldId} className="line-area" {...rest} />
    </div>
  )
}

export function SearchField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const id = useId()
  return (
    <div className="search">
      <Icon name="search" />
      <label className="sr" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="line-input"
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
    </div>
  )
}

export function Switch({
  checked,
  onChange,
  labelledBy,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  labelledBy: string
}) {
  return (
    <button
      type="button"
      className="switch"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      onClick={() => onChange(!checked)}
    />
  )
}

export function Progress({ value, label }: { value: number; label?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <span
      className="prog"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={label}
    >
      {pct > 0 && <i style={{ width: `${pct}%` }} />}
    </span>
  )
}
