import { Fragment } from 'react'
import type { FormulaPart, Role } from '../content/schema'
import { pl } from '../i18n/pl'
import { parseMarked } from '../lib/text/marked'
import { legendOrder, roleClass } from './roles'

const PUNCT = /^[?.!,]+$/

export function FormulaParts({ parts }: { parts: FormulaPart[] }) {
  return (
    <>
      {parts.map((p, i) => {
        const glue = i > 0 && !(p.role === 'neutral' && PUNCT.test(p.text))
        return (
          <Fragment key={i}>
            {glue && ' + '}
            {roleClass[p.role] ? <span className={roleClass[p.role]}>{p.text}</span> : p.text}
          </Fragment>
        )
      })}
    </>
  )
}

// tekst z notacją [k:…] (gramatyka): kawałki stoją obok siebie, plusy są już w tekście
export function MarkedText({ text }: { text: string }) {
  return (
    <>
      {parseMarked(text).map((p, i) =>
        roleClass[p.role] ? (
          <span key={i} className={roleClass[p.role]}>
            {p.text}
          </span>
        ) : (
          <Fragment key={i}>{p.text}</Fragment>
        ),
      )}
    </>
  )
}

export function RoleLegend({ roles }: { roles: Set<Role> }) {
  return (
    <div className="legend">
      {legendOrder
        .filter((r) => roles.has(r))
        .map((r) => (
          <span key={r}>
            <i className={`sw ${roleClass[r].replace('hl ', '')}`} />
            {pl.roles[r]}
          </span>
        ))}
    </div>
  )
}
