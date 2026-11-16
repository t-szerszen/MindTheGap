import type { CSSProperties } from 'react'

const mark = `${import.meta.env.BASE_URL}logo/mark-uk.svg`

// znak to plik, napis zostaje tekstem w Caveat; "gap" wpisane w lukę jak w ćwiczeniach
export function Logo({
  tagline,
  stack,
  className,
  style,
}: {
  tagline?: string
  stack?: boolean
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      className={`logo${stack ? ' stack' : ''}${className ? ` ${className}` : ''}`}
      lang="en"
      style={style}
    >
      <img className="logo-mark" src={mark} alt="" />
      <p className="logo-txt">
        <span className="logo-word">
          Mind the <span className="logo-gap">gap</span>
        </span>
        {tagline && (
          <span className="logo-tag" lang="pl">
            {tagline}
          </span>
        )}
      </p>
    </div>
  )
}
