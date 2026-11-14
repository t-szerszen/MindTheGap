import type { ReactNode } from 'react'

type Paper = 'ruled' | 'lined' | 'squared' | 'dotted' | 'desk'

// kartka dla ekranów, które same jej nie rysują (np. te za bramką logowania)
export function Page({
  paper = 'lined',
  plain = true,
  children,
}: {
  paper?: Paper
  plain?: boolean
  children: ReactNode
}) {
  return <div className={`sheet ${paper}${plain ? ' plain' : ''} page-in`}>{children}</div>
}
