import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

export type NoteColor = 'y' | 'p' | 'm' | 'b' | 'o'
export type TapeColor = 'p' | 'm' | 'y' | 'b'
export type TapePos = 'top' | 'tl' | 'tr' | 'br' | 'bl'
// obrót kartki: sąsiednie kartki nigdy pod tym samym kątem
export type Tilt = -3 | -2 | -1 | 0 | 1 | 2 | 3

function tiltClass(t: Tilt | undefined) {
  return t === undefined ? '' : `r${t}`
}

export function Tape({ color = 'p', pos = 'top' }: { color?: TapeColor; pos?: TapePos }) {
  return <span className={`tape ${pos} t-${color}`} aria-hidden="true" />
}

type StickyProps<T extends ElementType> = {
  as?: T
  color?: NoteColor
  tilt?: Tilt
  tape?: { color?: TapeColor; pos?: TapePos }
  pin?: boolean
  children?: ReactNode
} & Omit<ComponentPropsWithoutRef<T>, 'color'>

export function Sticky<T extends ElementType = 'div'>({
  as,
  color = 'y',
  tilt,
  tape,
  pin,
  className,
  children,
  ...rest
}: StickyProps<T>) {
  const Tag = as ?? 'div'
  return (
    <Tag className={['sticky', `n-${color}`, tiltClass(tilt), className].join(' ')} {...rest}>
      {tape && <Tape {...tape} />}
      {pin && <span className="pin" aria-hidden="true" />}
      {children}
    </Tag>
  )
}

type CardProps<T extends ElementType> = {
  as?: T
  variant?: 'card' | 'index-card'
  tilt?: Tilt
  tape?: { color?: TapeColor; pos?: TapePos }
  children?: ReactNode
} & ComponentPropsWithoutRef<T>

export function Card<T extends ElementType = 'div'>({
  as,
  variant = 'card',
  tilt,
  tape,
  className,
  children,
  ...rest
}: CardProps<T>) {
  const Tag = as ?? 'div'
  return (
    <Tag className={[variant, tiltClass(tilt), className].join(' ')} {...rest}>
      {tape && <Tape {...tape} />}
      {children}
    </Tag>
  )
}

export function TornSheet({
  edge = 'b',
  className,
  sheetClassName,
  children,
}: {
  edge?: 'b' | 't'
  className?: string
  sheetClassName?: string
  children: ReactNode
}) {
  return (
    <div className={['shadow-wrap', className].join(' ')}>
      <div className={[`torn-${edge}`, sheetClassName].join(' ')}>{children}</div>
    </div>
  )
}

export function Grain() {
  return <span className="grain" aria-hidden="true" />
}
