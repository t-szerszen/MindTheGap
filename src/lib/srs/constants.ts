// wszystkie liczby do strojenia powtórek w jednym miejscu

export const INTERVAL_DAYS = [1, 3, 7, 14, 30] as const
export const MIN_BOX = 1
export const MAX_BOX = INTERVAL_DAYS.length

// „Uciekinierzy”: słówka, które ciągle wylatują z głowy
export const LEECH_LAPSES = 3
export const LEECH_MIN_ATTEMPTS = 5
export const LEECH_MAX_ACCURACY = 0.6

export const DAY_MS = 24 * 60 * 60 * 1000
