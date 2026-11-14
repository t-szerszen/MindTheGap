import type { Role } from '../content/schema'

// kolor = rola: ten sam zakreślacz w czasach, ćwiczeniach i tematach
export const roleClass: Record<Role, string> = {
  subject: 'hl hl-m',
  aux: 'hl hl-b',
  verb: 'hl hl-p',
  particle: 'hl hl-o',
  signal: 'hl hl-y',
  object: 'u-pen',
  neutral: '',
}

export const legendOrder: Role[] = ['subject', 'aux', 'verb', 'particle', 'signal', 'object']
