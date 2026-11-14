import { useEffect, useId, useRef, type ReactNode } from 'react'
import { pl } from '../i18n/pl'
import { Icon } from './Icon'

// natywny <dialog>: fokus w środku, Esc zamyka, tło przyciemnione
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="sheet-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {open && (
        <div className="index-card sheet-card">
          <div className="row" style={{ justifyContent: 'space-between', height: 34 }}>
            <h2 id={titleId} className="h-m">
              {title}
            </h2>
            <button type="button" className="ibtn" onClick={onClose} aria-label={pl.common.close}>
              <Icon name="cross" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}
